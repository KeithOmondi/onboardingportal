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
  const [broadcastMessages, setBroadcastMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isChatOpenRef = useRef(false);

  const setChatOpen = (open: boolean) => {
    isChatOpenRef.current = open;
    if (open) setUnreadCount(0);
  };

  // 1. Fetch History
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const isAdmin = user.role.toLowerCase().includes("admin");
        const endpoint = isAdmin ? "/chat/inbox" : "/chat/judge/history";
        
        const [directRes, broadcastRes] = await Promise.all([
          api.get(endpoint),
          api.get("/chat/broadcast/history")
        ]);

        setMessages(directRes.data.messages ?? []);
        setBroadcastMessages(broadcastRes.data.messages ?? []);
      } catch (err) {
        console.error("[useChat] History fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // 2. Socket Setup
  useEffect(() => {
    if (!user?.full_name) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    // Listen for Direct Messages
    socketRef.current.on("user:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
      if (!isChatOpenRef.current) setUnreadCount((n) => n + 1);
    });

    // Listen for Broadcasts (matches new Backend event)
    socketRef.current.on("broadcast:receive", (msg: ChatMessage) => {
      setBroadcastMessages((prev) => mergeMessage(prev, msg));
      if (!isChatOpenRef.current) setUnreadCount((n) => n + 1);
    });

    // Admin inbound (for Admin panel use)
    socketRef.current.on("admin:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
    });

    // Confirmation Logic: Replaces optimistic temp message with real DB message
    const handleSentSwap = (msg: ChatMessage) => {
      const targetSetter = msg.recipient_type === "single" ? setMessages : setBroadcastMessages;
      targetSetter((prev) => {
        const filtered = prev.filter(m => m.id || m._tempId !== msg._tempId);
        return mergeMessage(filtered, msg);
      });
    };

    socketRef.current.on("user:message:sent", handleSentSwap);
    socketRef.current.on("admin:message:sent", handleSentSwap);

    socketRef.current.on("user:message:error", ({ _tempId }: { _tempId: string }) => {
      setMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  // 3. Actions
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
    };
    socketRef.current.emit("user:message", optimistic);
    setMessages((prev) => [...prev, optimistic]);
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
    };
    socketRef.current.emit("admin:message:single", { ...msg, recipientId });
    setMessages((prev) => [...prev, msg]);
  };

  return {
    messages,
    broadcastMessages,
    sendMessage,
    replyToUser,
    connected,
    loading,
    unreadCount,
    setChatOpen,
  };
};