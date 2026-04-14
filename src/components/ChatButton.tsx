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
  const [activeTab, setActiveTab] = useState<"direct" | "broadcast">("direct");
  const [input, setInput] = useState("");
  const { user } = useAppSelector((state) => state.auth);
  
  // Destructure from useChat - these will now be recognized by TS
  const { 
    messages, 
    broadcastMessages, 
    sendMessage, 
    connected, 
    unreadCount, 
    setChatOpen 
  } = useChat();
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isJudge = user?.role === UserRole.JUDGE;
  const isRegistrar = user?.role === UserRole.REGISTRAR;

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    setChatOpen(next);
  };

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, broadcastMessages, isOpen, activeTab]);

  const handleSend = () => {
    // Only Judges can send in Direct. Broadcast is always read-only for recipients.
    if (!input.trim() || !isJudge || activeTab === "broadcast") return; 
    sendMessage(input.trim());
    setInput("");
  };

  // Switch between Direct and Broadcast arrays based on active tab
  const displayedMessages = activeTab === "direct" ? messages : broadcastMessages;

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, fontFamily: "sans-serif" }}>
      {isOpen && (
        <div style={{
          width: "340px", height: "480px", background: "#fff",
          borderRadius: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          marginBottom: "12px", display: "flex", flexDirection: "column",
          overflow: "hidden", border: "1px solid #e5e7eb"
        }}>
          {/* Header */}
          <div style={{ background: "#4f46e5", color: "#fff", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.5px" }}>
                  {isAdmin ? "ADMIN HUB" : "ORHC COMMUNICATION"}
                </div>
                <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 600 }}>
                  {connected ? "● ONLINE" : "○ OFFLINE"}
                </div>
              </div>
              <button onClick={handleToggle} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.1)", borderRadius: "8px", padding: "2px" }}>
              <button 
                onClick={() => setActiveTab("direct")}
                style={{
                  flex: 1, padding: "8px", fontSize: "11px", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer",
                  background: activeTab === "direct" ? "#fff" : "transparent",
                  color: activeTab === "direct" ? "#4f46e5" : "#fff",
                  transition: "all 0.2s"
                }}>DIRECT</button>
              <button 
                onClick={() => setActiveTab("broadcast")}
                style={{
                  flex: 1, padding: "8px", fontSize: "11px", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer",
                  background: activeTab === "broadcast" ? "#fff" : "transparent",
                  color: activeTab === "broadcast" ? "#4f46e5" : "#fff",
                  transition: "all 0.2s"
                }}>OFFICIAL RELAY</button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1, padding: "12px", overflowY: "auto", background: "#f8fafc",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {displayedMessages.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "40px", color: "#94a3b8", fontSize: "12px" }}>
                No {activeTab === "direct" ? "conversations" : "announcements"} yet.
              </div>
            ) : (
              displayedMessages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id;
                const isBroadcastTab = activeTab === "broadcast";

                return (
                  <div key={msg.id ?? i} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    {!isMine && (
                      <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, marginBottom: "2px", textTransform: "uppercase" }}>
                        {isBroadcastTab ? "📢 SYSTEM RELAY" : `${msg.sender_name} ${msg.sender_role === "judge" ? "⚖️" : ""}`}
                      </div>
                    )}
                    <div style={{
                      background: isBroadcastTab ? "#fefce8" : (isMine ? "#4f46e5" : "#fff"),
                      color: isBroadcastTab ? "#854d0e" : (isMine ? "#fff" : "#1e293b"),
                      padding: "10px 14px", borderRadius: "14px",
                      border: isMine ? "none" : "1px solid #e2e8f0",
                      maxWidth: "85%", fontSize: "13px", lineHeight: "1.4",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      borderLeft: isBroadcastTab ? "4px solid #eab308" : undefined
                    }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px", fontWeight: 600 }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer / Input */}
          <div style={{ padding: "12px", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
            {activeTab === "broadcast" ? (
              <div style={{ textAlign: "center", fontSize: "11px", color: "#64748b", fontWeight: 700, padding: "8px", background: "#fefce8", borderRadius: "8px" }}>
                LATEST ADMINISTRATIVE ANNOUNCEMENTS
              </div>
            ) : isJudge ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Message support..."
                  style={{
                    flex: 1, border: "1px solid #e2e8f0", borderRadius: "10px",
                    padding: "10px", fontSize: "13px", outline: "none", background: "#f8fafc"
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    background: "#4f46e5", color: "#fff", border: "none", borderRadius: "10px",
                    padding: "0 16px", cursor: "pointer", opacity: input.trim() ? 1 : 0.5
                  }}
                >➤</button>
              </div>
            ) : (
              <div style={{ 
                textAlign: "center", fontSize: "11px", color: "#94a3b8", fontStyle: "italic",
                padding: "8px", background: "#f8fafc", borderRadius: "8px" 
              }}>
                {isRegistrar ? "Registrars have read-only access to direct chat." : "Read-only access."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB with Unread Indicator */}
      <div style={{ position: "relative" }}>
        {unreadCount > 0 && !isOpen && (
          <span style={{
            position: "absolute", top: "-5px", right: "-5px",
            background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 800,
            minWidth: "22px", height: "22px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(239,68,68,0.4)", zIndex: 2,
            animation: "pulse 2s infinite"
          }}>
            {unreadCount}
          </span>
        )}
        <button
          onClick={handleToggle}
          style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "#4f46e5", color: "#fff", border: "none",
            fontSize: "24px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(79,70,229,0.5)",
            transition: "transform 0.2s"
          }}
        >
          {isOpen ? "✕" : "💬"}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239,68,68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68, 0); }
        }
      `}</style>
    </div>
  );
};

export default ChatButton;