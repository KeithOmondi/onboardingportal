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
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

/**
 * Replace an optimistic message with its server-confirmed version, or
 * append if no optimistic entry exists. Deduplicates by DB id as a safety net.
 *
 * The key insight: the server always echoes _tempId back in the confirmation
 * event, so we can find the exact optimistic entry and swap it out in-place.
 * This prevents the "ghost + real" duplication that appears until refresh.
 */
const confirmMessage = (prev: ChatMessage[], confirmed: ChatMessage): ChatMessage[] => {
  // 1. Try to replace the matching optimistic entry by _tempId
  if (confirmed._tempId) {
    const idx = prev.findIndex((m) => m._tempId === confirmed._tempId);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = confirmed; // swap optimistic → confirmed in-place
      return next;
    }
  }

  // 2. Guard: don't append if the DB id is already present (e.g. history loaded it)
  if (confirmed.id && prev.some((m) => m.id === confirmed.id)) {
    return prev;
  }

  // 3. No optimistic entry found — just append (e.g. inbound message from other side)
  return [...prev, confirmed];
};

export const useAdminChat = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Only pull `connected` from useChat — we never call replyToUser from here.
  // Calling replyToUser was the original duplication source (double emit + double state add).
  const { connected } = useChat();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);

  // history  = REST snapshot loaded when a recipient is selected
  const [history, setHistory] = useState<ChatMessage[]>([]);

  // liveMessages = socket events received after history was loaded.
  // Optimistic messages are added here first, then replaced by server confirmations.
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Ref so socket listeners always read the latest selected recipient
  // without needing to re-register on every selection change.
  const selectedRecipientRef = useRef<Recipient | null>(null);
  selectedRecipientRef.current = selectedRecipient;

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.full_name) return;

    const socket = io(SOCKET_URL, {
      query: { userId: user.id, role: user.role, name: user.full_name },
      withCredentials: true,
    });
    socketRef.current = socket;

    /**
     * "admin:message:sent" — server confirmation for a message WE sent.
     * The payload always includes _tempId so confirmMessage can find and
     * replace the optimistic entry rather than appending a duplicate.
     */
    socket.on("admin:message:sent", (confirmed: ChatMessage) => {
      setLiveMessages((prev) => confirmMessage(prev, confirmed));
    });

    /**
     * "admin:receive" — inbound message from a non-admin user to our inbox,
     * OR a fan-out from a group message. Only add it if it belongs to the
     * currently open conversation.
     */
    socket.on("admin:receive", (msg: ChatMessage) => {
      const partner = selectedRecipientRef.current;
      if (!partner) return;

      const isRelevant =
        msg.sender_id === partner.id ||
        msg.recipient_id === partner.id;

      if (isRelevant) {
        setLiveMessages((prev) => confirmMessage(prev, msg));
      }
    });

    /**
     * "admin:message:error" — server failed to persist the message.
     * Remove the optimistic entry so the UI doesn't show an unsent bubble.
     */
    socket.on("admin:message:error", ({ _tempId }: { _tempId: string }) => {
      setLiveMessages((prev) => prev.filter((m) => m._tempId !== _tempId));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // ── Fetch all messageable users ───────────────────────────────────────────
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

  // ── Select recipient → load REST history ──────────────────────────────────
  const selectRecipient = useCallback(async (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    // Clear live messages so the previous conversation's real-time
    // entries don't bleed into the newly opened one.
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

  // ── Send direct message ───────────────────────────────────────────────────
  const sendToUser = useCallback(
    (message: string, recipientId: string) => {
      if (!socketRef.current || !user) return;

      const _tempId = crypto.randomUUID();

      // Add optimistic bubble immediately — it will be replaced (not duplicated)
      // when the server fires "admin:message:sent" with the same _tempId.
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

      // Single emit — server persists, then emits "admin:message:sent" back to
      // this socket and "user:receive" to the recipient. No second emit anywhere.
      socketRef.current.emit("admin:message:single", {
        _tempId,   // ← must be included so server echoes it back
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

  // ── Send broadcast / group message ────────────────────────────────────────
  // ── Send broadcast / group message ────────────────────────────────────────
const sendBroadcast = useCallback(
  (
    message: string, 
    type: "broadcast" | "group", 
    targetRoles?: string[],
    targetUserIds?: string[] // NEW: Support specific user IDs
  ) => {
    if (!socketRef.current || !user) return;

    const _tempId = crypto.randomUUID();
    const event =
      type === "broadcast" ? "admin:message:broadcast" : "admin:message:group";

    socketRef.current.emit(event, {
      _tempId,
      senderId: user.id,
      senderName: user.full_name,
      senderRole: user.role,
      recipientType: type,
      targetRoles,
      targetUserIds, // Include the IDs in the payload for the server
      message,
    });
  },
  [user]
);

  // ── Merge history + live, deduplicated ───────────────────────────────────
  // Walk both arrays in order, tracking seen keys so that:
  //   • A message already in history doesn't re-appear when echoed via socket
  //   • An optimistic entry (_tempId only) is recognised as distinct from the
  //     confirmed entry (has DB id) — the swap happens inside confirmMessage
  //     before this merge even runs, so by the time we get here liveMessages
  //     already has the confirmed version in the right position.
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