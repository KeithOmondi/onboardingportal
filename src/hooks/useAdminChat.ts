import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAppSelector } from "../redux/hooks";
import { useChat } from "./useChat";
import api from "../api/api";
import { io, type Socket } from "socket.io-client";

// ── Types ──────────────────────────────────────────────────────────────────
export type RecipientType = 'single' | 'group' | 'broadcast';

export interface ChatMessage {
  id?: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id?: string | null;
  recipient_type: RecipientType;
  target_roles?: string[] | null;
  message: string;
  created_at: string | Date;
  _tempId?: string;
}

export interface Recipient {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  lastMessageAt?: Date;
  unreadCount: number;
}

/** Interface for raw API response to avoid 'any' */
interface RecipientResponse extends Omit<Recipient, 'lastMessageAt'> {
  lastMessageAt?: string | Date;
}

interface ConversationUpdatedPayload {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string | Date;
  senderId: string;        // the user who sent the message — use THIS to match recipient
  recipientType: RecipientType;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
  const idToMatch = confirmed.id;
  if (idToMatch && prev.some((m) => m.id === idToMatch)) return prev;
  return [...prev, confirmed];
};

// ── Hook ───────────────────────────────────────────────────────────────────

export const useAdminChat = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { connected } = useChat();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [broadcastHistory, setBroadcastHistory] = useState<ChatMessage[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<ChatMessage[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedRecipientRef = useRef<Recipient | null>(null);
  selectedRecipientRef.current = selectedRecipient;

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchRecipients = useCallback(async () => {
    try {
      const { data } = await api.get<{ recipients: RecipientResponse[] }>("/chat/recipients");
      const normalised: Recipient[] = (data.recipients || []).map((r) => ({
        ...r,
        lastMessageAt: r.lastMessageAt ? new Date(r.lastMessageAt) : undefined,
        unreadCount: r.unreadCount || 0,
      }));
      setRecipients(normalised);
    } catch (err) {
      console.error("[useAdminChat] fetchRecipients failed:", err);
    }
  }, []);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (recipientId: string) => {
    try {
      await api.post(`/chat/read/${recipientId}`);
      // Optimistically zero out in UI immediately
      setRecipients((prev) =>
        prev.map((r) => (r.id === recipientId ? { ...r, unreadCount: 0 } : r))
      );
    } catch (err) {
      console.error("[useAdminChat] Failed to mark as read:", err);
    }
  }, []);

  const updateRecipientActivity = useCallback(
    (
      senderId: string,        // the actual user id who sent the message
      timestamp: string | Date,
      isIncoming: boolean
    ) => {
      setRecipients((prev) => {
        // Match by senderId (the non-admin user's id), NOT conversationId
        const idx = prev.findIndex((r) => r.id === senderId);
        if (idx === -1) return prev;

        const isOpen = selectedRecipientRef.current?.id === senderId;
        const current = prev[idx];

        const newUnreadCount = isIncoming && !isOpen
          ? (current.unreadCount ?? 0) + 1
          : current.unreadCount;

        const updated: Recipient = {
          ...current,
          lastMessageAt: new Date(timestamp),
          unreadCount: newUnreadCount,
        };

        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });
    },
    []
  );

  // ── Socket setup ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("conversation:updated", (payload: ConversationUpdatedPayload) => {
      if (payload.recipientType !== "single") return;
      const isIncoming = payload.senderId !== user.id;
      // FIX: use senderId (the non-admin user's id) — NOT conversationId
      updateRecipientActivity(payload.senderId, payload.lastMessageAt, isIncoming);
    });

    socket.on("admin:message:sent", (confirmed: ChatMessage) => {
      if (confirmed.recipient_type !== "single") {
        setLiveBroadcasts((prev) => confirmMessage(prev, confirmed));
        return;
      }
      const partner = selectedRecipientRef.current;
      if (partner && (confirmed.sender_id === partner.id || confirmed.recipient_id === partner.id)) {
        setLiveMessages((prev) => confirmMessage(prev, confirmed));
      }
    });

    socket.on("admin:receive", (msg: ChatMessage) => {
      if (msg.recipient_type !== "single") {
        setLiveBroadcasts((prev) => confirmMessage(prev, msg));
        return;
      }
      const partner = selectedRecipientRef.current;
      if (partner && (msg.sender_id === partner.id || msg.recipient_id === partner.id)) {
        setLiveMessages((prev) => confirmMessage(prev, msg));
        markAsRead(partner.id);
      }
    });

    socket.on("admin:message:error", ({ _tempId }: { _tempId: string }) => {
      setLiveMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
      setLiveBroadcasts((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => { socket.disconnect(); };
  }, [user, updateRecipientActivity, markAsRead]);

  // ── Broadcasts ───────────────────────────────────────────────────────────

  const fetchBroadcasts = useCallback(async () => {
    setLoadingBroadcasts(true);
    try {
      const { data } = await api.get<{ broadcasts: ChatMessage[] }>("/chat/broadcasts");
      setBroadcastHistory(data.broadcasts ?? []);
    } catch {
      setBroadcastHistory([]);
    } finally { setLoadingBroadcasts(false); }
  }, []);

  // ── Select recipient ─────────────────────────────────────────────────────

  const selectRecipient = useCallback(async (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setLiveMessages([]);
    setLoadingHistory(true);

    if (recipient.unreadCount > 0) {
      markAsRead(recipient.id);
    }

    try {
      const { data } = await api.get<{ messages: ChatMessage[] }>(`/chat/history/${recipient.id}`);
      setHistory(data.messages ?? []);
    } catch {
      setHistory([]);
    } finally { setLoadingHistory(false); }
  }, [markAsRead]);

  // ── Sending ──────────────────────────────────────────────────────────────

  const sendToUser = useCallback((message: string, recipientId: string) => {
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
      created_at: new Date().toISOString(),
    };
    setLiveMessages((prev) => [...prev, optimistic]);
    socketRef.current.emit("admin:message:single", {
      _tempId,
      senderId: user.id,
      recipientId,
      message,
    });
  }, [user]);

  const sendBroadcast = useCallback((
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
      recipient_type: type,
      target_roles: targetRoles ?? null,
      message,
      created_at: new Date().toISOString(),
    };
    setLiveBroadcasts((prev) => [...prev, optimistic]);
    socketRef.current.emit(type === "broadcast" ? "admin:message:broadcast" : "admin:message:group", {
      _tempId,
      senderId: user.id,
      recipientType: type,
      targetRoles,
      targetUserIds,
      message,
    });
  }, [user]);

  // ── Memoized Merges ──────────────────────────────────────────────────────

  const conversationMessages = useMemo(() => {
    const seenIds = new Set<string>();
    return [...history, ...liveMessages]
      .filter((msg) => {
        const key = msg.id ?? msg._tempId;
        if (!key || seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [history, liveMessages]);

  const broadcastMessages = useMemo(() => {
    const seenIds = new Set<string>();
    return [...broadcastHistory, ...liveBroadcasts]
      .filter((msg) => {
        const key = msg.id ?? msg._tempId;
        if (!key || seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [broadcastHistory, liveBroadcasts]);

  const sortedRecipients = useMemo(() => {
    return [...recipients].sort((a, b) => {
      const tA = a.lastMessageAt?.getTime() ?? 0;
      const tB = b.lastMessageAt?.getTime() ?? 0;
      return tB - tA || a.full_name.localeCompare(b.full_name);
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