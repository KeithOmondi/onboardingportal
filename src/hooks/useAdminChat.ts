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
  lastMessageAt?: Date;   // always a Date internally; never a string
  unreadCount?: number;   // badge count for admin inbox
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
  const socketRef = useRef<Socket | null>(null);

  // Stable ref so socket handlers always read current value without re-registering
  const selectedRecipientRef = useRef<Recipient | null>(null);
  selectedRecipientRef.current = selectedRecipient;

  /**
   * Core helper — called whenever ANY message activity happens for a user.
   * 
   * - Updates lastMessageAt → triggers re-sort (recipients sorted in render)
   * - Increments unreadCount ONLY if that conversation isn't currently open
   */
  const updateRecipientActivity = useCallback(
    (userId: string, timestamp: string | Date, isIncoming: boolean) => {
      setRecipients((prev) => {
        const idx = prev.findIndex((r) => r.id === userId);
        if (idx === -1) return prev;                    // unknown user, skip

        const isOpen = selectedRecipientRef.current?.id === userId;
        const current = prev[idx];

        const updated: Recipient = {
          ...current,
          lastMessageAt: new Date(timestamp),
          unreadCount: isIncoming && !isOpen
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

    /**
     * conversation:updated — the single source of truth for sorting + badges.
     * Fired by the server after every message regardless of type.
     */
    socket.on("conversation:updated", (payload: ConversationUpdatedPayload) => {
      if (payload.recipientType !== "single") return; // broadcast/group don't map to a user row

      const isIncoming = payload.senderId !== user.id;
      updateRecipientActivity(payload.conversationId, payload.lastMessageAt, isIncoming);
    });

    // Confirmed delivery of admin's own sent message → swap optimistic bubble
    socket.on("admin:message:sent", (confirmed: ChatMessage) => {
      const partner = selectedRecipientRef.current;
      if (
        partner &&
        (confirmed.sender_id === partner.id || confirmed.recipient_id === partner.id)
      ) {
        setLiveMessages((prev) => confirmMessage(prev, confirmed));
      }
    });

    // Incoming message from a user → add to conversation if it's currently open
    socket.on("admin:receive", (msg: ChatMessage) => {
      const partner = selectedRecipientRef.current;
      if (
        partner &&
        (msg.sender_id === partner.id || msg.recipient_id === partner.id)
      ) {
        setLiveMessages((prev) => confirmMessage(prev, msg));
      }
      // NOTE: sorting + badge is handled by conversation:updated, not here
    });

    socket.on("admin:message:error", ({ _tempId }: { _tempId: string }) => {
      setLiveMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => { socket.disconnect(); };
  }, [user, updateRecipientActivity]);

  // ── Fetch recipients ─────────────────────────────────────────
  const fetchRecipients = useCallback(async () => {
    try {
      const { data } = await api.get("/chat/recipients");
      // Normalise lastMessageAt to Date on the way in
      const normalised: Recipient[] = (data.recipients as Recipient[]).map((r) => ({
        ...r,
        lastMessageAt: r.lastMessageAt ? new Date(r.lastMessageAt) : undefined,
        unreadCount: 0,
      }));
      setRecipients(normalised);
    } catch (err) {
      console.error("[useAdminChat] fetchRecipients failed:", err);
    }
  }, []);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  // ── Select a recipient ───────────────────────────────────────
  const selectRecipient = useCallback(async (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setLiveMessages([]);
    setLoadingHistory(true);

    // Clear badge the moment admin opens the conversation
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

  // ── Send to single user ──────────────────────────────────────
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

  // ── Broadcast / group ────────────────────────────────────────
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

  // ── Merge history + live, deduplicated ──────────────────────
  const conversationMessages: ChatMessage[] = (() => {
    const seenIds = new Set<string>();
    const result: ChatMessage[] = [];
    for (const msg of [...history, ...liveMessages]) {
      const key = msg.id ?? msg._tempId;
      if (!key) { result.push(msg); continue; }
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      result.push(msg);
    }
    return result;
  })();

  /**
   * Sorted recipients — most recent activity first.
   * Recipients with no lastMessageAt fall to the bottom alphabetically.
   */
  const sortedRecipients = [...recipients].sort((a, b) => {
    const tA = a.lastMessageAt?.getTime() ?? 0;
    const tB = b.lastMessageAt?.getTime() ?? 0;
    if (tB !== tA) return tB - tA;                   // recent first
    return a.full_name.localeCompare(b.full_name);    // alpha tiebreak
  });

  return {
    recipients: sortedRecipients,                     // pre-sorted, drop useMemo in UI
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