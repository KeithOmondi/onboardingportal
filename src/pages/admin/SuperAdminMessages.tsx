import { useState, useRef, useEffect } from "react";
import { useAdminChat, type Recipient } from "../../hooks/useAdminChat";

const ROLES = ["judge", "registrar", "staff"] as const;

const ROLE_PILL: Record<string, string> = {
  judge: "bg-amber-100 text-amber-800",
  registrar: "bg-green-100 text-green-800",
  staff: "bg-purple-100 text-purple-800",
};

const AVATAR_COLOR: Record<string, string> = {
  judge: "bg-amber-100 text-amber-800",
  registrar: "bg-green-100 text-green-800",
  staff: "bg-purple-100 text-purple-800",
};

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const SuperAdminMessages = () => {
  const {
    recipients, selectedRecipient, selectRecipient,
    conversationMessages, loadingHistory, connected,
    currentUser, sendToUser, sendBroadcast,
  } = useAdminChat();

  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"direct" | "broadcast">("direct");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [broadcastType, setBroadcastType] = useState<"broadcast" | "group">("broadcast");
  const [showSidebar, setShowSidebar] = useState(true); 
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  const handleSelectRecipient = (r: Recipient) => {
    selectRecipient(r);
    setShowSidebar(false);
  };

  const filtered = recipients.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = ROLES.reduce((acc, role) => {
    acc[role] = filtered.filter((r) => r.role === role);
    return acc;
  }, {} as Record<string, Recipient[]>);

  const handleSendDirect = () => {
    if (!input.trim() || !selectedRecipient) return;
    sendToUser(input.trim(), selectedRecipient.id);
    setInput("");
  };

  const handleSendBroadcast = () => {
    if (!input.trim()) return;
    if (broadcastType === "group" && selectedRoles.length === 0) return;
    sendBroadcast(input.trim(), broadcastType, broadcastType === "group" ? selectedRoles : undefined);
    setInput("");
  };

  const broadcastLabel =
    broadcastType === "broadcast"
      ? "Broadcast to everyone"
      : `Group message → ${selectedRoles.length ? selectedRoles.join(", ") : "no roles selected"}`;

  return (
    /**
     * FIX: We use h-[calc(100vh-115px)] to account for the Header height.
     * This keeps the chat interface "sticky" within the viewport even if 
     * the AdminLayout allows scrolling.
     */
    <div className="flex w-full overflow-hidden bg-white border-t border-[#d5e0cc] h-[calc(100vh-115px)] md:h-[calc(100vh-128px)]">

      {/* ── Sidebar ── */}
      <div
        className={`
          flex-col flex-shrink-0 bg-white border-r border-[#d5e0cc]
          w-full md:w-72 lg:w-80
          ${showSidebar ? "flex" : "hidden"} md:flex
        `}
      >
        <div className="px-4 py-3 flex-shrink-0 border-b border-[#d5e0cc] bg-white">
          <h2 className="text-sm font-bold text-[#1a3a2a]">Messages</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: connected ? "#6ab187" : "#e24b4a" }}
            />
            <span className="text-[10px] font-medium" style={{ color: connected ? "#6ab187" : "#e24b4a" }}>
              {connected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 border-b border-[#d5e0cc] bg-white">
          {(["direct", "broadcast"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="flex-1 py-3 text-xs font-bold capitalize tracking-wide transition-colors"
              style={{
                color: activeTab === t ? "#3a6644" : "#8aaa92",
                borderBottom: activeTab === t ? "2px solid #3a6644" : "2px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {activeTab === "direct" && (
            <>
              <div className="p-3 sticky top-0 bg-white z-10">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 text-xs rounded-lg outline-none border border-[#cddcc5] bg-[#f7faf5] text-[#1a3a2a]"
                />
              </div>

              <div className="flex flex-col pb-4">
                {ROLES.map((role) =>
                  grouped[role]?.length ? (
                    <div key={role}>
                      <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#a0b8a4] bg-[#f7faf5]">
                        {role}s
                      </div>
                      {grouped[role].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleSelectRecipient(r)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-4 ${
                            selectedRecipient?.id === r.id
                              ? "bg-[#eef5e8] border-[#3a6644]"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLOR[r.role]}`}>
                            {initials(r.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate text-[#1a3a2a]">
                              {r.full_name}
                            </div>
                            <div className="mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${ROLE_PILL[r.role]}`}>
                                {r.role}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null
                )}
              </div>
            </>
          )}

          {activeTab === "broadcast" && (
            <div className="p-4 flex flex-col gap-4">
              <p className="text-xs leading-relaxed text-[#6a8a72]">
                Announce to groups or the entire system instantly.
              </p>
              {/* Broadcast settings logic stays same */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-[#1a3a2a] p-2 rounded hover:bg-[#f7faf5]">
                  <input type="radio" name="btype" checked={broadcastType === "broadcast"} onChange={() => setBroadcastType("broadcast")} className="accent-[#3a6644]" />
                  Broadcast to Everyone
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer text-[#1a3a2a] p-2 rounded hover:bg-[#f7faf5]">
                  <input type="radio" name="btype" checked={broadcastType === "group"} onChange={() => setBroadcastType("group")} className="accent-[#3a6644]" />
                  Target specific roles
                </label>
              </div>
              {broadcastType === "group" && (
                <div className="flex flex-col gap-1 pl-6">
                  {ROLES.map((role) => (
                    <label key={role} className="flex items-center gap-2 py-1 text-xs cursor-pointer capitalize text-[#1a3a2a]">
                      <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role] )} className="accent-[#3a6644] rounded" />
                      {role}s
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#f7faf5] ${!showSidebar ? "flex" : "hidden"} md:flex`}>
        
        {/* Sticky Chat Header */}
        <div className="flex-shrink-0 h-[65px] px-4 md:px-5 flex items-center gap-3 border-b border-[#d5e0cc] bg-white z-20">
          <button onClick={() => setShowSidebar(true)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f0f5ec] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3a6644" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>

          {activeTab === "direct" ? (
            selectedRecipient ? (
              <>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLOR[selectedRecipient.role]}`}>
                  {initials(selectedRecipient.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1a3a2a] truncate">{selectedRecipient.full_name}</div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${ROLE_PILL[selectedRecipient.role]}`}>
                    {selectedRecipient.role}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm font-medium text-[#8aaa92]">No recipient selected</div>
            )
          ) : (
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#1a3a2a] truncate">{broadcastLabel}</div>
              <div className="text-[10px] text-[#8aaa92] font-medium uppercase tracking-wider">Broadcast Mode</div>
            </div>
          )}
        </div>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-[#f7faf5] custom-scrollbar">
          {activeTab === "direct" && !selectedRecipient && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#a0b8a4]">
              <p className="text-xs font-medium">Select a contact to view conversation</p>
            </div>
          )}

          {loadingHistory && (
            <div className="text-center py-4 italic text-[10px] text-slate-400">Syncing history...</div>
          )}

          {activeTab === "direct" && conversationMessages.map((msg, i) => {
            const isMine = msg.sender_id === currentUser?.id;
            return (
              <div key={i} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className="px-4 py-2.5 rounded-2xl text-xs max-w-[85%] md:max-w-[70%] leading-relaxed shadow-sm"
                  style={
                    isMine
                      ? { background: "#3a6644", color: "#fff", borderBottomRightRadius: 4 }
                      : { background: "#fff", color: "#1a3a2a", border: "1px solid #d5e0cc", borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.message}
                </div>
                <div className="text-[9px] mt-1 font-medium text-[#a0b8a4] uppercase px-1">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Fixed Message Input Bar */}
        {(activeTab === "broadcast" || selectedRecipient) && (
          <div className="flex-shrink-0 bg-white p-3 md:p-4 border-t border-[#d5e0cc]">
            <div className="flex gap-2 md:gap-3 max-w-5xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (activeTab === "direct" ? handleSendDirect() : handleSendBroadcast())}
                placeholder={activeTab === "direct" ? `Message ${selectedRecipient?.full_name}...` : "Type broadcast message..."}
                className="flex-1 px-4 py-3 rounded-xl text-xs outline-none border border-[#cddcc5] bg-[#f7faf5] text-[#1a3a2a] focus:ring-1 focus:ring-[#3a6644]"
              />
              <button
                onClick={activeTab === "direct" ? handleSendDirect : handleSendBroadcast}
                className="px-5 md:px-7 py-3 rounded-xl text-xs font-black text-white active:scale-95 shadow-md flex-shrink-0 transition-transform"
                style={{ background: activeTab === "broadcast" ? "#C9922A" : "#3a6644" }}
              >
                SEND
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminMessages;