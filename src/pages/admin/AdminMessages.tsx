import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, Search, ArrowLeft, CheckCircle2, Circle, Radio, Users } from "lucide-react";
import { useAdminChat, type Recipient } from "../../hooks/useAdminChat";

const ROLES = ["judge", "registrar", "staff"] as const;

const ROLE_LABELS: Record<string, string> = {
  judge: "Judges",
  registrar: "Registrars",
  staff: "Staffs",
};

const AVATAR_COLOR: Record<string, string> = {
  judge: "bg-amber-100 text-amber-800 border-amber-200",
  registrar: "bg-green-100 text-green-800 border-green-200",
  staff: "bg-purple-100 text-purple-800 border-purple-200",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AdminMessages = () => {
  const {
    recipients,
    selectedRecipient,
    selectRecipient,
    conversationMessages,
    loadingHistory,
    connected,
    currentUser,
    sendToUser,
    sendBroadcast,
    broadcastMessages,
    loadingBroadcasts,
    fetchBroadcasts,
  } = useAdminChat();

  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"direct" | "broadcast">("direct");
  const [broadcastType, setBroadcastType] = useState<"broadcast" | "group">("group");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredRecipients = useMemo(() => {
    return [...recipients].filter(
      (r) =>
        r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // sorting is already handled inside useAdminChat
  }, [recipients, searchQuery]);

  useEffect(() => {
    if (activeTab === "broadcast") fetchBroadcasts();
  }, [activeTab, fetchBroadcasts]);

  // Auto-scroll to bottom whenever the visible message list changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages, broadcastMessages]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendDirect = () => {
    if (!input.trim() || !selectedRecipient) return;
    sendToUser(input.trim(), selectedRecipient.id);
    setInput("");
  };

  const handleSendBroadcast = () => {
    if (!input.trim()) return;
    sendBroadcast(
      input.trim(),
      broadcastType,
      broadcastType === "group" ? selectedRoles : undefined,
      selectedUserIds.length > 0 ? selectedUserIds : undefined
    );
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (activeTab === "direct") handleSendDirect();
    else handleSendBroadcast();
  };

  const activeMessages =
    activeTab === "direct" ? conversationMessages : broadcastMessages;

  return (
    <div className="flex w-full overflow-hidden bg-white border-t border-[#d5e0cc] h-[calc(100vh-128px)] font-sans">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        className={`flex-col flex-shrink-0 bg-white border-r border-[#d5e0cc] w-full md:w-80 lg:w-96 ${
          showSidebar ? "flex" : "hidden"
        } md:flex`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#d5e0cc]">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-black text-[#1a3a2a]">Messaging Hub</h2>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f7faf5] rounded-full border border-[#eef5e8]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-[9px] font-bold text-[#3a6644] uppercase">
                {connected ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8aaa92]"
              size={14}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "direct"
                  ? "Search contacts..."
                  : "Search users to include..."
              }
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl outline-none border border-[#cddcc5] bg-[#f7faf5] text-[#1a3a2a] focus:ring-1 focus:ring-[#3a6644]"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#d5e0cc]">
          {(["direct", "broadcast"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === t
                  ? "text-[#3a6644] border-b-2 border-[#3a6644]"
                  : "text-[#8aaa92]"
              }`}
            >
              {t === "broadcast" ? "Admin Broadcast" : "Direct Chat"}
            </button>
          ))}
        </div>

        {/* List / controls */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar p-2">
          {activeTab === "direct" ? (
            <div className="space-y-1">
              {filteredRecipients.length === 0 && (
                <p className="text-center text-[10px] text-[#8aaa92] py-8 uppercase font-bold tracking-widest">
                  No contacts found
                </p>
              )}
              {filteredRecipients.map((r) => (
                <RecipientRow
                  key={r.id}
                  recipient={r}
                  isSelected={selectedRecipient?.id === r.id}
                  onClick={() => {
                    selectRecipient(r);
                    setShowSidebar(false);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6 p-2">
              {/* Target audience */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-[#3a6644] uppercase tracking-widest flex items-center gap-2">
                  <Radio size={12} /> Target Audience
                </p>
                <label className="flex items-center gap-3 text-xs font-bold text-[#1a3a2a] cursor-pointer">
                  <input
                    type="radio"
                    checked={broadcastType === "broadcast"}
                    onChange={() => setBroadcastType("broadcast")}
                    className="accent-[#3a6644]"
                  />
                  Global Broadcast (All)
                </label>
                <label className="flex items-center gap-3 text-xs font-bold text-[#1a3a2a] cursor-pointer">
                  <input
                    type="radio"
                    checked={broadcastType === "group"}
                    onChange={() => setBroadcastType("group")}
                    className="accent-[#3a6644]"
                  />
                  Role-Based Group
                </label>
              </div>

              {broadcastType === "group" && (
                <div className="pl-6 space-y-2 border-l-2 border-[#f0f5ec]">
                  {ROLES.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 text-xs text-[#1a3a2a] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="rounded border-[#cddcc5] text-[#3a6644]"
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              )}

              {/* Individual additions */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-[#3a6644] uppercase tracking-widest flex items-center gap-2">
                  <Users size={12} /> Individual Additions
                </p>
                <div className="border border-[#eef5e8] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredRecipients.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => toggleUser(r.id)}
                      className="flex items-center gap-3 p-3 border-b border-[#eef5e8] hover:bg-[#f7faf5] cursor-pointer"
                    >
                      {selectedUserIds.includes(r.id) ? (
                        <CheckCircle2 size={16} className="text-[#3a6644]" />
                      ) : (
                        <Circle size={16} className="text-[#cddcc5]" />
                      )}
                      <span className="text-[11px] font-bold text-[#1a3a2a]">
                        {r.full_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main chat area ───────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col bg-[#f7faf5] ${
          !showSidebar ? "flex" : "hidden"
        } md:flex`}
      >
        {/* Top bar */}
        <div className="h-[65px] px-6 flex items-center justify-between border-b border-[#d5e0cc] bg-white">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)} className="md:hidden">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-sm font-black text-[#1a3a2a]">
                {activeTab === "broadcast"
                  ? "Administrative Relay History"
                  : selectedRecipient?.full_name || "Select a Recipient"}
              </h3>
              <p className="text-[10px] font-bold text-[#8aaa92] uppercase tracking-widest">
                {activeTab === "broadcast"
                  ? "One-Way Communication"
                  : "Two-Way Direct Chat"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          {/* Loading spinner */}
          {((activeTab === "direct" && loadingHistory) ||
            (activeTab === "broadcast" && loadingBroadcasts)) && (
            <div className="flex flex-col items-center justify-center py-10 text-[#3a6644]">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-[10px] font-black uppercase">
                Syncing Relay History...
              </span>
            </div>
          )}

          {/* Empty state */}
          {!loadingHistory &&
            !loadingBroadcasts &&
            activeMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-[#8aaa92]">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {activeTab === "direct"
                    ? selectedRecipient
                      ? "No messages yet. Say hello!"
                      : "Select a contact to start chatting"
                    : "No broadcasts yet"}
                </span>
              </div>
            )}

          {activeMessages.map((msg, i) => {
            const isMine = msg.sender_id === currentUser?.id;

            // In broadcast tab, only show outgoing admin messages
            if (activeTab === "broadcast" && !isMine) return null;

            return (
              <div
                key={msg.id ?? msg._tempId ?? i}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                {/* Sender label for incoming direct messages */}
                {!isMine && activeTab === "direct" && (
                  <span className="text-[9px] font-black text-[#8aaa92] uppercase px-1 mb-0.5">
                    {msg.sender_name}
                  </span>
                )}

                <div
                  className={`px-4 py-2.5 rounded-2xl text-[13px] shadow-sm max-w-[70%] ${
                    isMine
                      ? "bg-[#3a6644] text-white rounded-tr-none"
                      : "bg-white border border-[#d5e0cc] text-[#1a3a2a] rounded-tl-none"
                  } ${
                    /* Optimistic bubble: slightly translucent until confirmed */
                    !msg.id ? "opacity-70" : ""
                  }`}
                >
                  {activeTab === "broadcast" && (
                    <div className="text-[9px] font-black text-amber-200 uppercase mb-1 border-b border-white/10 pb-1">
                      RELAYED BY {currentUser?.full_name || "ADMIN"}
                    </div>
                  )}
                  {msg.message}
                </div>

                <span className="text-[9px] mt-1 font-bold text-[#a0b8a4] uppercase px-1">
                  {msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Sending..."}
                </span>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        {(activeTab === "broadcast" || selectedRecipient) && (
          <div className="p-4 bg-white border-t border-[#d5e0cc]">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeTab === "broadcast"
                    ? "Type global relay message..."
                    : "Type message..."
                }
                className="flex-1 px-4 py-3 rounded-xl border border-[#cddcc5] bg-[#f7faf5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3a6644]/20"
              />
              <button
                onClick={
                  activeTab === "direct" ? handleSendDirect : handleSendBroadcast
                }
                className={`px-8 py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all ${
                  activeTab === "broadcast" ? "bg-[#3a6644]" : "bg-[#C9922A]"
                }`}
              >
                {activeTab === "broadcast" ? "Relay" : "Send"}
              </button>
            </div>
            {activeTab === "broadcast" && (
              <p className="text-[9px] text-center mt-2 text-[#8aaa92] font-bold uppercase tracking-wider">
                Note: This message will be sent as a one-way notification to selected
                recipients.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Recipient row ─────────────────────────────────────────────────────────────

const RecipientRow = ({
  recipient,
  isSelected,
  onClick,
}: {
  recipient: Recipient;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-l-4 ${
      isSelected
        ? "bg-[#f0f5ec] border-[#3a6644]"
        : "border-transparent hover:bg-gray-50"
    }`}
  >
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black border flex-shrink-0 ${
        AVATAR_COLOR[recipient.role] ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {initials(recipient.full_name)}
    </div>
    <div className="flex-1 text-left min-w-0">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold text-[#1a3a2a] truncate">
          {recipient.full_name}
        </p>
        {(recipient.unreadCount ?? 0) > 0 && (
          <span className="bg-red-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-bounce ml-1 flex-shrink-0">
            {recipient.unreadCount}
          </span>
        )}
      </div>
      <p className="text-[10px] text-[#8aaa92] uppercase tracking-tighter font-semibold">
        {recipient.role}
      </p>
      {recipient.lastMessageAt && (
        <p className="text-[9px] text-[#b0c4b8] mt-0.5">
          {new Date(recipient.lastMessageAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  </button>
);

export default AdminMessages;