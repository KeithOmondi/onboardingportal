import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "../redux/hooks";
import { useChat, type ChatMessage } from "./useChat";
import api from "../api/api";
import { io, type Socket } from "socket.io-client";

export interface Recipient {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  lastMessageAt?: string | Date;
}

/**
 * Fix: Derives the Socket URL from VITE_API_URL if VITE_SOCKET_URL is missing.
 */
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.split('/api')[0];
  return "http://localhost:8000";
};

const SOCKET_URL = getSocketUrl();

const confirmMessage = (prev: ChatMessage[], confirmed: ChatMessage): ChatMessage[] => {
  if (confirmed._tempId) {
    const idx = prev.findIndex((m) => m._tempId === confirmed._tempId);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = confirmed;
      return next;
    }
  }
  if (confirmed.id && prev.some((m) => m.id === confirmed.id)) {
    return prev;
  }
  return [...prev, confirmed];
};

export const useAdminChat = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { connected } = useChat();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const selectedRecipientRef = useRef<Recipient | null>(null);
  selectedRecipientRef.current = selectedRecipient;

  const bumpRecipient = useCallback((userId: string, timestamp: string | Date) => {
    setRecipients((prev) => {
      const index = prev.findIndex((r) => r.id === userId);
      if (index === -1) return prev;
      
      const updated = [...prev];
      updated[index] = { ...updated[index], lastMessageAt: timestamp };
      return updated;
    });
  }, []);

  // ── Socket setup with PNA/CORS Fix ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.full_name) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      /**
       * CRITICAL FIX: Force WebSockets to bypass CORS loopback restrictions
       * when calling a local/private backend from a public Vercel frontend.
       */
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("admin:message:sent", (confirmed: ChatMessage) => {
      const partner = selectedRecipientRef.current;
      if (partner && (confirmed.sender_id === partner.id || confirmed.recipient_id === partner.id)) {
        setLiveMessages((prev) => confirmMessage(prev, confirmed));
      }
      const targetId = confirmed.recipient_id;
      if (targetId) bumpRecipient(targetId, confirmed.created_at || new Date());
    });

    socket.on("admin:receive", (msg: ChatMessage) => {
      const partner = selectedRecipientRef.current;
      if (partner && (msg.sender_id === partner.id || msg.recipient_id === partner.id)) {
        setLiveMessages((prev) => confirmMessage(prev, msg));
      }
      bumpRecipient(msg.sender_id, msg.created_at || new Date());
    });

    socket.on("admin:message:error", ({ _tempId }: { _tempId: string }) => {
      setLiveMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, bumpRecipient]);

  const fetchRecipients = useCallback(async () => {
    try {
      const { data } = await api.get("/chat/recipients");
      setRecipients(data.recipients);
    } catch (err) {
      console.error("[useAdminChat] fetchRecipients failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const selectRecipient = useCallback(async (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setLiveMessages([]);
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/chat/history/${recipient.id}`);
      setHistory(data.messages ?? []);
    } catch (err) {
      console.error("[useAdminChat] loadHistory failed:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const sendToUser = useCallback(
    (message: string, recipientId: string) => {
      if (!socketRef.current || !user) return;

      const _tempId = crypto.randomUUID();
      const now = new Date();

      const optimistic: ChatMessage = {
        _tempId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_id: recipientId,
        recipient_type: "single",
        message,
        created_at: now,
      };

      setLiveMessages((prev) => [...prev, optimistic]);
      bumpRecipient(recipientId, now);

      socketRef.current.emit("admin:message:single", {
        _tempId,
        senderId: user.id,
        senderName: user.full_name,
        senderRole: user.role,
        recipientId,
        recipientType: "single",
        message,
      });
    },
    [user, bumpRecipient]
  );

  const sendBroadcast = useCallback(
    (message: string, type: "broadcast" | "group", targetRoles?: string[], targetUserIds?: string[]) => {
      if (!socketRef.current || !user) return;

      const _tempId = crypto.randomUUID();
      const event = type === "broadcast" ? "admin:message:broadcast" : "admin:message:group";

      socketRef.current.emit(event, {
        _tempId,
        senderId: user.id,
        senderName: user.full_name,
        senderRole: user.role,
        recipientType: type,
        targetRoles,
        targetUserIds,
        message,
      });
    },
    [user]
  );

  const conversationMessages: ChatMessage[] = (() => {
    const seenIds = new Set<string>();
    const result: ChatMessage[] = [];

    for (const msg of [...history, ...liveMessages]) {
      const key = msg.id ?? msg._tempId;
      if (!key) {
        result.push(msg);
        continue;
      }
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      result.push(msg);
    }
    return result;
  })();

  return {
    recipients,
    selectedRecipient,
    selectRecipient,
    conversationMessages,
    loadingHistory,
    connected,
    currentUser: user,
    sendToUser,
    sendBroadcast,
  };
};