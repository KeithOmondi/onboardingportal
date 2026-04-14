import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "../redux/hooks";
import api from "../api/api";

export interface ChatMessage {
  id?: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id?: string | null;
  recipient_type: "single" | "group" | "broadcast";
  target_roles?: string[] | null;
  message: string;
  created_at?: string | Date;
  _tempId?: string;
}

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.split("/api")[0];
  return "http://localhost:8000";
};

const SOCKET_URL = getSocketUrl();

const mergeMessage = (prev: ChatMessage[], msg: ChatMessage): ChatMessage[] => {
  if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
  return [...prev, msg];
};

export const useChat = () => {
  const { user } = useAppSelector((state) => state.auth);
  const socketRef = useRef<Socket | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Unread count: increments on incoming messages, reset by the consumer
  const [unreadCount, setUnreadCount] = useState(0);

  // The consumer tells us whether the chat window is open so we know
  // whether to increment the badge or not
  const isChatOpenRef = useRef(false);

  const markAsRead = () => setUnreadCount(0);

  const setChatOpen = (open: boolean) => {
    isChatOpenRef.current = open;
    if (open) setUnreadCount(0); // clear badge the moment they open it
  };

  // ── 1. Fetch history ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const isAdmin = user.role === "admin" || user.role === "super_admin";
        const endpoint = isAdmin ? "/chat/inbox" : "/chat/judge/history";
        const { data } = await api.get(endpoint);
        setMessages(data.messages ?? []);
      } catch (err) {
        console.error("[useChat] Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // ── 2. Socket setup ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.full_name) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    // Incoming message from admin → judge sees it
    socketRef.current.on("user:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
      // Only bump badge if chat is closed
      if (!isChatOpenRef.current) {
        setUnreadCount((n) => n + 1);
      }
    });

    // Admin inbox: admin sees incoming user messages
    socketRef.current.on("admin:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
      // Admins have their own inbox UI; badge handled separately there
    });

    // Optimistic → confirmed swap for user (judge) sent messages
    socketRef.current.on("user:message:sent", (msg: ChatMessage) => {
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (m) => m.id || m._tempId !== msg._tempId
        );
        return mergeMessage(withoutOptimistic, msg);
      });
    });

    // Optimistic → confirmed swap for admin sent messages
    socketRef.current.on("admin:message:sent", (msg: ChatMessage) => {
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (m) => m.id || m._tempId !== msg._tempId
        );
        return mergeMessage(withoutOptimistic, msg);
      });
    });

    // Failed send — remove optimistic bubble
    socketRef.current.on("user:message:error", ({ _tempId }: { _tempId: string }) => {
      setMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    socketRef.current.on("admin:message:error", ({ _tempId }: { _tempId: string }) => {
      setMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  // ── 3. Actions ──────────────────────────────────────────────

  // Judge → admin
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
      created_at: new Date(),
    };
    socketRef.current.emit("user:message", optimistic);
    setMessages((prev) => [...prev, optimistic]);
  };

  // Admin → single user
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
      created_at: new Date(),
    };
    socketRef.current.emit("admin:message:single", {
      ...msg,
      senderId: user.id,
      senderName: user.full_name,
      senderRole: user.role,
      recipientId: recipientId,
    });
    setMessages((prev) => [...prev, msg]);
  };

  return {
    messages,
    sendMessage,
    replyToUser,
    connected,
    loading,
    unreadCount,
    markAsRead,
    setChatOpen,
  };
};