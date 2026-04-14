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
    // Only fetch if we have a valid user and a role
    if (!user?.id || !user?.role) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const isAdmin = user.role.toLowerCase().includes("admin");
        const endpoint = isAdmin ? "/chat/inbox" : "/chat/judge/history";
        
        const [directRes, broadcastRes] = await Promise.all([
          api.get(endpoint),
          api.get("/chat/broadcast/history")
        ]);

        // Backend response shape: { status: "success", messages: [...] }
        const directData = directRes.data?.messages || [];
        const broadcastData = broadcastRes.data?.messages || [];

        // DEBUG: This will show you exactly what's being loaded into state
        console.log(`[useChat] Fetched ${directData.length} messages for ${user.role}`);
        if (directData.length > 0) console.table(directData);

        setMessages(directData);
        setBroadcastMessages(broadcastData);
      } catch (err) {
        console.error("[useChat] History fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id, user?.role]); 

  // 2. Socket Setup
  useEffect(() => {
    if (!user?.id || !user?.role || !user?.full_name) return;

    const socket = io(SOCKET_URL, {
      query: { 
        userId: user.id, 
        role: user.role, 
        name: user.full_name 
      },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("user:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
      if (!isChatOpenRef.current) setUnreadCount((n) => n + 1);
    });

    socket.on("broadcast:receive", (msg: ChatMessage) => {
      setBroadcastMessages((prev) => mergeMessage(prev, msg));
      if (!isChatOpenRef.current) setUnreadCount((n) => n + 1);
    });

    socket.on("admin:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
    });

    const handleSentSwap = (msg: ChatMessage) => {
      const targetSetter = msg.recipient_type === "single" ? setMessages : setBroadcastMessages;
      targetSetter((prev) => {
        const filtered = prev.filter(m => m.id || m._tempId !== msg._tempId);
        return mergeMessage(filtered, msg);
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