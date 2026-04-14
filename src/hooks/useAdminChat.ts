import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  lastMessageAt?: Date;
  unreadCount?: number;
}

interface ConversationUpdatedPayload {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string | Date;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientType: "single" | "broadcast" | "group";
  targetRoles?: string[] | null;
}

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.split("/api")[0];
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
  if (confirmed.id && prev.some((m) => m.id === confirmed.id)) return prev;
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

  // ── Broadcast state ──────────────────────────────────────────
  const [broadcastHistory, setBroadcastHistory] = useState<ChatMessage[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<ChatMessage[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedRecipientRef = useRef<Recipient | null>(null);
  selectedRecipientRef.current = selectedRecipient;

  const updateRecipientActivity = useCallback(
    (userId: string, timestamp: string | Date, isIncoming: boolean) => {
      setRecipients((prev) => {
        const idx = prev.findIndex((r) => r.id === userId);
        if (idx === -1) return prev;

        const isOpen = selectedRecipientRef.current?.id === userId;
        const current = prev[idx];

        const updated: Recipient = {
          ...current,
          lastMessageAt: new Date(timestamp),
          unreadCount:
            isIncoming && !isOpen
              ? (current.unreadCount ?? 0) + 1
              : (current.unreadCount ?? 0),
        };

        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    },
    []
  );

  // ── Socket setup ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.full_name) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("conversation:updated", (payload: ConversationUpdatedPayload) => {
      if (payload.recipientType !== "single") return;
      const isIncoming = payload.senderId !== user.id;
      updateRecipientActivity(payload.conversationId, payload.lastMessageAt, isIncoming);
    });

    socket.on("admin:message:sent", (confirmed: ChatMessage) => {
      if (
        confirmed.recipient_type === "broadcast" ||
        confirmed.recipient_type === "group"
      ) {
        setLiveBroadcasts((prev) => confirmMessage(prev, confirmed));
        return;
      }

      const partner = selectedRecipientRef.current;
      if (
        partner &&
        (confirmed.sender_id === partner.id || confirmed.recipient_id === partner.id)
      ) {
        setLiveMessages((prev) => confirmMessage(prev, confirmed));
      }
    });

    socket.on("admin:receive", (msg: ChatMessage) => {
      if (
        msg.recipient_type === "broadcast" ||
        msg.recipient_type === "group"
      ) {
        setLiveBroadcasts((prev) => confirmMessage(prev, msg));
        return;
      }

      const partner = selectedRecipientRef.current;
      if (
        partner &&
        (msg.sender_id === partner.id || msg.recipient_id === partner.id)
      ) {
        setLiveMessages((prev) => confirmMessage(prev, msg));
      }
    });

    socket.on("admin:message:error", ({ _tempId }: { _tempId: string }) => {
      setLiveMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
      setLiveBroadcasts((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, updateRecipientActivity]);

  const fetchRecipients = useCallback(async () => {
  try {
    const { data } = await api.get("/chat/recipients");
    const normalised: Recipient[] = (data.recipients as Recipient[]).map((r) => ({
      ...r,
      // DB returns the column alias as "lastMessageAt" (quoted in SQL, so case-preserved)
      lastMessageAt: r.lastMessageAt ? new Date(r.lastMessageAt) : undefined,
      unreadCount: 0,
    }));
    setRecipients(normalised);
  } catch (err) {
    console.error("[useAdminChat] fetchRecipients failed:", err);
  }
}, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const fetchBroadcasts = useCallback(async () => {
    setLoadingBroadcasts(true);
    try {
      const { data } = await api.get("/chat/broadcasts");
      setBroadcastHistory(data.broadcasts ?? []);
    } catch (err) {
      console.error("[useAdminChat] fetchBroadcasts failed:", err);
      setBroadcastHistory([]);
    } finally {
      setLoadingBroadcasts(false);
    }
  }, []);

  const selectRecipient = useCallback(async (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setLiveMessages([]);
    setLoadingHistory(true);

    setRecipients((prev) =>
      prev.map((r) => (r.id === recipient.id ? { ...r, unreadCount: 0 } : r))
    );

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
      const optimistic: ChatMessage = {
        _tempId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_id: recipientId,
        recipient_type: "single",
        message,
        created_at: new Date(),
      };

      setLiveMessages((prev) => [...prev, optimistic]);

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
    [user]
  );

  const sendBroadcast = useCallback(
    (
      message: string,
      type: "broadcast" | "group",
      targetRoles?: string[],
      targetUserIds?: string[]
    ) => {
      if (!socketRef.current || !user) return;

      const _tempId = crypto.randomUUID();
      const optimistic: ChatMessage = {
        _tempId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_id: null,
        recipient_type: type,
        target_roles: targetRoles ?? null,
        message,
        created_at: new Date(),
      };

      setLiveBroadcasts((prev) => [...prev, optimistic]);

      const event =
        type === "broadcast" ? "admin:message:broadcast" : "admin:message:group";

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

  // ── Unified Merge & Sort Logic ───────────────────────────────
  
  const conversationMessages = useMemo(() => {
    const seenIds = new Set<string>();
    const combined = [...history, ...liveMessages];
    
    return combined
      .filter((msg) => {
        const key = msg.id ?? msg._tempId;
        if (!key) return true;
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      })
      .sort((a, b) => {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tA - tB;
      });
  }, [history, liveMessages]);

  const broadcastMessages = useMemo(() => {
    const seenIds = new Set<string>();
    const combined = [...broadcastHistory, ...liveBroadcasts];
    
    return combined
      .filter((msg) => {
        const key = msg.id ?? msg._tempId;
        if (!key) return true;
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      })
      .sort((a, b) => {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tA - tB;
      });
  }, [broadcastHistory, liveBroadcasts]);

  const sortedRecipients = useMemo(() => {
    return [...recipients].sort((a, b) => {
      const tA = a.lastMessageAt?.getTime() ?? 0;
      const tB = b.lastMessageAt?.getTime() ?? 0;
      if (tB !== tA) return tB - tA;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [recipients]);

  return {
    recipients: sortedRecipients,
    selectedRecipient,
    selectRecipient,
    conversationMessages,
    loadingHistory,
    connected,
    currentUser: user,
    sendToUser,
    sendBroadcast,
    broadcastMessages,
    loadingBroadcasts,
    fetchBroadcasts,
  };
};