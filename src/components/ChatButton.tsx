import { useState, useRef, useEffect } from "react";
import { useAppSelector } from "../redux/hooks";
import { useChat } from "../hooks/useChat";
import { UserRole } from "../interfaces/user.interface";

const formatTime = (timestamp: string | Date | undefined) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString();
};

// ... (previous imports)

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { user } = useAppSelector((state) => state.auth);
  const { messages, sendMessage, connected } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  // NEW: Specifically check for Judge role
  const isJudge = user?.role === UserRole.JUDGE;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    // Safety check: Don't allow sending if not a judge
    if (!input.trim() || !isJudge) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000 }}>
      {isOpen && (
        <div style={{
          width: "320px", height: "420px", background: "#fff",
          borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          marginBottom: "12px", display: "flex", flexDirection: "column", overflow: "hidden",
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
            <span
              onClick={() => setIsOpen(false)}
              style={{ cursor: "pointer", fontSize: "18px" }}
            >✕</span>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, padding: "12px", overflowY: "auto", background: "#f9f9f9",
            display: "flex", flexDirection: "column", gap: "8px",
          }}>
            {/* ... (Message map remains the same) */}
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: "10px", color: "#999", marginBottom: "2px" }}>
                    {msg.sender_name} {msg.sender_role === 'judge' && "⚖️"}
                  </div>
                  <div style={{
                    background: isMine ? "#4f46e5" : "#e5e7eb",
                    color: isMine ? "#fff" : "#111",
                    padding: "8px 12px", borderRadius: "12px",
                    maxWidth: "80%", fontSize: "13px",
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb", marginTop: "2px" }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar Logic */}
          {!isAdmin && (
            <div style={{ borderTop: "1px solid #eee", padding: "8px", background: "#fff" }}>
              {isJudge ? (
                // Only show input for Judges
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message as Judge..."
                    style={{
                      flex: 1, border: "1px solid #ddd", borderRadius: "8px",
                      padding: "8px", fontSize: "13px", outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    style={{
                      background: "#4f46e5", color: "#fff", border: "none",
                      borderRadius: "8px", padding: "8px 14px", cursor: "pointer",
                    }}
                  >➤</button>
                </div>
              ) : (
                // Show "Read Only" message for Registrars
                <div style={{ 
                  textAlign: "center", padding: "4px", fontSize: "11px", 
                  color: "#888", fontWeight: 500, fontStyle: "italic" 
                }}>
                  You have read-only access to this chat.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
  );
};

export default ChatButton;