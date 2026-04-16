import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "../redux/hooks";
import api from "../api/api";

export type RecipientType = "single" | "group" | "broadcast";

export interface ChatMessage {
  id?: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id?: string | null;
  recipient_type: RecipientType;
  target_roles?: string[] | null;
  message: string;
  created_at?: string | Date;
  _tempId?: string;
  is_read?: boolean; // local read tracking
}

// ── Unread counts per tab ─────────────────────────────────────────────────────
export interface UnreadCounts {
  direct: number;
  broadcast: number;
}

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.split("/api")[0];
  return "http://localhost:8000";
};

const SOCKET_URL = getSocketUrl();

// ── LocalStorage keys ─────────────────────────────────────────────────────────
const keys = (userId = "anon") => ({
  directMessages:  `chat_direct_messages_${userId}`,
  broadcastMessages: `chat_broadcast_messages_${userId}`,
  unreadDirect:    `chat_unread_direct_${userId}`,
  unreadBroadcast: `chat_unread_broadcast_${userId}`,
});

// ── Storage helpers ───────────────────────────────────────────────────────────
const load = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private browsing / quota exceeded — silently ignore
  }
};

// ── Merge helper (dedup by id or _tempId) ─────────────────────────────────────
const mergeMessage = (prev: ChatMessage[], msg: ChatMessage): ChatMessage[] => {
  const isDuplicate = prev.some(
    (m) =>
      (msg.id && m.id === msg.id) ||
      (msg._tempId && m._tempId === msg._tempId)
  );
  if (isDuplicate) return prev;
  return [...prev, msg];
};

// ── Mark a list as read (set is_read = true on all) ──────────────────────────
const markAllRead = (msgs: ChatMessage[]): ChatMessage[] =>
  msgs.map((m) => ({ ...m, is_read: true }));

// ── Count unread in a list ────────────────────────────────────────────────────
const countUnread = (msgs: ChatMessage[], currentUserId?: string): number =>
  msgs.filter((m) => !m.is_read && m.sender_id !== currentUserId).length;

// ─────────────────────────────────────────────────────────────────────────────
export const useChat = () => {
  const { user } = useAppSelector((state) => state.auth);
  const socketRef = useRef<Socket | null>(null);
  const k = keys(user?.id);

  // Hydrate from localStorage on first render
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    load<ChatMessage[]>(k.directMessages, [])
  );
  const [broadcastMessages, setBroadcastMessages] = useState<ChatMessage[]>(
    () => load<ChatMessage[]>(k.broadcastMessages, [])
  );

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // activeTab tracked here so we know which panel is visible
  const activeTabRef = useRef<"direct" | "broadcast">("direct");
  const isChatOpenRef = useRef(false);

  // Derive unread counts from message state (not a separate counter)
  // so they're always consistent with the persisted messages array.
  const unreadDirect = countUnread(messages, user?.id);
  const unreadBroadcast = countUnread(broadcastMessages, user?.id);
  const totalUnread = unreadDirect + unreadBroadcast;

  // ── Persist messages whenever they change ──────────────────────────────────
  useEffect(() => {
    save(k.directMessages, messages);
  }, [messages, k.directMessages]);

  useEffect(() => {
    save(k.broadcastMessages, broadcastMessages);
  }, [broadcastMessages, k.broadcastMessages]);

  // ── setChatOpen: tell the hook which state the panel is in ─────────────────
  const setChatOpen = useCallback(
    (open: boolean) => {
      isChatOpenRef.current = open;
      if (open) {
        // Mark the currently-visible tab as read immediately on open
        if (activeTabRef.current === "direct") {
          setMessages((prev) => markAllRead(prev));
        } else {
          setBroadcastMessages((prev) => markAllRead(prev));
        }
      }
    },
    []
  );

  // ── setActiveTab: called by ChatButton when user switches tabs ─────────────
  const setActiveTab = useCallback((tab: "direct" | "broadcast") => {
    activeTabRef.current = tab;
    if (isChatOpenRef.current) {
      // Mark the newly-visible tab as read
      if (tab === "direct") {
        setMessages((prev) => markAllRead(prev));
      } else {
        setBroadcastMessages((prev) => markAllRead(prev));
      }
    }
  }, []);

  // ── 1. Fetch history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !user?.role) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const isAdmin = user.role.toLowerCase().includes("admin");
        const directEndpoint = isAdmin ? "/chat/inbox" : "/chat/judge/history";

        const [directRes, broadcastRes] = await Promise.all([
          api.get(directEndpoint),
          api.get("/chat/broadcast/history"),
        ]);

        const fresh: ChatMessage[] = directRes.data?.messages || [];
        const freshBroadcast: ChatMessage[] = broadcastRes.data?.messages || [];

        // Merge server messages with locally-persisted ones, preserving
        // local is_read flags so already-read messages stay read.
        setMessages((local) => {
          const readMap = new Map(local.map((m) => [m.id, m.is_read]));
          const merged = fresh.map((m) => ({
            ...m,
            is_read:
              m.sender_id === user.id
                ? true                          // own messages are always "read"
                : readMap.get(m.id) ?? false,   // use local flag if available
          }));
          // Append any local optimistic messages not yet on server
          const serverIds = new Set(merged.map((m) => m.id));
          const optimistic = local.filter((m) => !m.id || !serverIds.has(m.id));
          return [...merged, ...optimistic];
        });

        setBroadcastMessages((local) => {
          const readMap = new Map(local.map((m) => [m.id, m.is_read]));
          const merged = freshBroadcast.map((m) => ({
            ...m,
            is_read:
              m.sender_id === user.id ? true : readMap.get(m.id) ?? false,
          }));
          const serverIds = new Set(merged.map((m) => m.id));
          const optimistic = local.filter((m) => !m.id || !serverIds.has(m.id));
          return [...merged, ...optimistic];
        });
      } catch (err) {
        console.error("[useChat] History fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id, user?.role]);

  // ── 2. Socket setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !user?.role || !user?.full_name) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => setConnected(false));

    // Direct messages
    socket.on("user:receive", (msg: ChatMessage) => {
      const isRead =
        isChatOpenRef.current && activeTabRef.current === "direct";
      setMessages((prev) =>
        mergeMessage(prev, { ...msg, is_read: isRead })
      );
    });

    // Broadcast / Official Relay
    socket.on("broadcast:receive", (msg: ChatMessage) => {
      const isRead =
        isChatOpenRef.current && activeTabRef.current === "broadcast";
      setBroadcastMessages((prev) =>
        mergeMessage(prev, { ...msg, is_read: isRead })
      );
    });

    // Admin support inbox
    socket.on("admin:receive", (msg: ChatMessage) => {
      const isRead =
        isChatOpenRef.current && activeTabRef.current === "direct";
      setMessages((prev) =>
        mergeMessage(prev, { ...msg, is_read: isRead })
      );
    });

    // Swap optimistic → confirmed
    const handleSentSwap = (msg: ChatMessage) => {
      const isBroadcast = ["broadcast", "group"].includes(msg.recipient_type);
      const setter = isBroadcast ? setBroadcastMessages : setMessages;
      setter((prev) => {
        const filtered = prev.filter((m) => m._tempId !== msg._tempId);
        return mergeMessage(filtered, { ...msg, is_read: true });
      });
    };

    socket.on("user:message:sent", handleSentSwap);
    socket.on("admin:message:sent", handleSentSwap);

    socket.on("user:message:error", ({ _tempId }: { _tempId: string }) => {
      setMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, user?.role, user?.full_name]);

  // ── 3. Actions ──────────────────────────────────────────────────────────────
  const sendMessage = (message: string) => {
    if (!user || !socketRef.current) return;
    const _tempId = crypto.randomUUID();
    const optimistic: ChatMessage = {
      _tempId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      recipient_type: "single",
      message,
      created_at: new Date().toISOString(),
      is_read: true, // own messages are always read
    };
    setMessages((prev) => [...prev, optimistic]);
    socketRef.current.emit("user:message", optimistic);
  };

  const replyToUser = (message: string, recipientId: string) => {
    if (!user || !socketRef.current) return;
    const _tempId = crypto.randomUUID();
    const msg: ChatMessage = {
      _tempId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      recipient_id: recipientId,
      recipient_type: "single",
      message,
      created_at: new Date().toISOString(),
      is_read: true,
    };
    setMessages((prev) => [...prev, msg]);
    socketRef.current.emit("admin:message:single", { ...msg, recipientId });
  };

  return {
    socket: socketRef.current,
    messages,
    broadcastMessages,
    sendMessage,
    replyToUser,
    connected,
    loading,
    // Convenience totals
    unreadCount: totalUnread,           // for FAB badge (combined)
    unreadDirect,                       // "X of Y" in Direct tab
    unreadBroadcast,                    // "X of Y" in Broadcast tab
    totalDirect: messages.length,
    totalBroadcast: broadcastMessages.length,
    // Controls
    setChatOpen,
    setActiveTab,
  };
};