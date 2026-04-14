import { useState, useRef, useEffect } from "react";
import { useAppSelector } from "../redux/hooks";
import { useChat } from "../hooks/useChat";
import { UserRole } from "../interfaces/user.interface";

const formatTime = (timestamp: string | Date | undefined) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { user } = useAppSelector((state) => state.auth);
  const { messages, sendMessage, connected, unreadCount, setChatOpen } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isJudge = user?.role === UserRole.JUDGE;

  // Keep the hook in sync with open/close so badge logic works correctly
  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    setChatOpen(next);
  };

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || !isJudge) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000 }}>
      {/* ── Chat window ──────────────────────────────────────── */}
      {isOpen && (
        <div style={{
          width: "320px", height: "420px", background: "#fff",
          borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          marginBottom: "12px", display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: "#4f46e5", color: "#fff", padding: "14px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {isAdmin ? "📋 Support Inbox" : "💬 ORHC Team Chat"}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>
                {connected ? "🟢 Connected" : "🔴 Disconnected"}
                {!isAdmin && !isJudge && " • View Only"}
              </div>
            </div>
            <span onClick={handleToggle} style={{ cursor: "pointer", fontSize: "18px" }}>✕</span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, padding: "12px", overflowY: "auto", background: "#f9f9f9",
            display: "flex", flexDirection: "column", gap: "8px",
          }}>
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id ?? msg._tempId ?? i}
                  style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: "10px", color: "#999", marginBottom: "2px" }}>
                    {msg.sender_name} {msg.sender_role === "judge" && "⚖️"}
                  </div>
                  <div style={{
                    background: isMine ? "#4f46e5" : "#e5e7eb",
                    color: isMine ? "#fff" : "#111",
                    padding: "8px 12px", borderRadius: "12px",
                    maxWidth: "80%", fontSize: "13px",
                    // Slightly faded for unconfirmed optimistic messages
                    opacity: msg._tempId && !msg.id ? 0.6 : 1,
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb", marginTop: "2px" }}>
                    {formatTime(msg.created_at)}
                    {/* Show a subtle "sending…" indicator for optimistic messages */}
                    {msg._tempId && !msg.id && (
                      <span style={{ marginLeft: "4px", fontStyle: "italic" }}>sending…</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar — judges only; read-only notice for everyone else */}
          {!isAdmin && (
            <div style={{ borderTop: "1px solid #eee", padding: "8px", background: "#fff" }}>
              {isJudge ? (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message…"
                    style={{
                      flex: 1, border: "1px solid #ddd", borderRadius: "8px",
                      padding: "8px", fontSize: "13px", outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    style={{
                      background: input.trim() ? "#4f46e5" : "#a5b4fc",
                      color: "#fff", border: "none", borderRadius: "8px",
                      padding: "8px 14px", cursor: input.trim() ? "pointer" : "default",
                      transition: "background 0.2s",
                    }}
                  >➤</button>
                </div>
              ) : (
                <div style={{
                  textAlign: "center", padding: "4px", fontSize: "11px",
                  color: "#888", fontWeight: 500, fontStyle: "italic",
                }}>
                  You have read-only access to this chat.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FAB with unread badge ─────────────────────────────── */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        {/* Badge — only shown for judges when chat is closed and there are unreads */}
        {isJudge && !isOpen && unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "#ef4444", color: "#fff",
            fontSize: "11px", fontWeight: 700,
            borderRadius: "999px",
            // Keeps single digits circular, wider for 10+
            minWidth: "20px", height: "20px",
            padding: "0 5px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            zIndex: 1,
            // Subtle pulse to draw attention
            animation: "badge-pulse 1.5s ease-in-out infinite",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        <button
          onClick={handleToggle}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "#4f46e5", color: "#fff", border: "none",
            fontSize: "24px", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(79,70,229,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isOpen ? "✕" : "💬"}
        </button>
      </div>

      {/* Badge pulse keyframe — injected once */}
      <style>{`
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default ChatButton;