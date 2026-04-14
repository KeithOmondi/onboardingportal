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

/**
 * Fix: Derives the Socket URL from VITE_API_URL if VITE_SOCKET_URL is missing.
 * It removes the '/api/v1' suffix to get the base server URL.
 */
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  
  const apiUrl = import.meta.env.VITE_API_URL; // http://localhost:8000/api/v1
  if (apiUrl) {
    return apiUrl.split('/api')[0]; // Returns http://localhost:8000
  }
  return "http://localhost:8000";
};

const SOCKET_URL = getSocketUrl();

const mergeMessage = (prev: ChatMessage[], msg: ChatMessage) => {
  if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
  return [...prev, msg];
};

export const useChat = () => {
  const { user } = useAppSelector((state) => state.auth);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Fetch History
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

  // 2. Socket Setup with CORS/PNA Fix
  useEffect(() => {
    if (!user?.full_name) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
      /**
       * CRITICAL FIX: Forces 'websocket' as the primary transport.
       * This bypasses the browser's PNA check for 'polling' (XMLHttpRequest)
       * which often blocks the 'loopback' address when deployed on Vercel.
       */
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("user:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
    });

    socketRef.current.on("admin:receive", (msg: ChatMessage) => {
      setMessages((prev) => mergeMessage(prev, msg));
    });

    socketRef.current.on("user:message:sent", (msg: ChatMessage) => {
      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (m) => m.id || m._tempId !== msg._tempId
        );
        return mergeMessage(withoutOptimistic, msg);
      });
    });

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
      created_at: new Date(),
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
      created_at: new Date(),
    };
    socketRef.current.emit("admin:message:single", msg);
    setMessages((prev) => [...prev, msg]);
  };

  return { messages, sendMessage, replyToUser, connected, loading };
};