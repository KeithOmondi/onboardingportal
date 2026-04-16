import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchEvents, selectAllEvents } from "../../redux/slices/eventsSlice";
import { fetchNotices } from "../../redux/slices/noticeSlice";
import { getMyGuestRegistry } from "../../redux/slices/guestSlice";
import { useChat } from "../../hooks/useChat";
import type { IJudicialEvent } from "../../interfaces/events.interface";
import type { INotice } from "../../interfaces/notices.interface";

// ── Helpers ───────────────────────────────────────────────────────────

const formatDate = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const formatTime = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).toUpperCase();

const timeAgo = (dateStr: string | Date) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const deriveEventStatus = (
  event: IJudicialEvent
): "UPCOMING" | "ONGOING" | "PAST" => {
  const now = new Date().getTime();
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();

  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "ONGOING";
  return "PAST";
};

// ── Sub-components ────────────────────────────────────────────────────────────

const MetricCard = ({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: number | string;
  sub?: string;
  valueColor?: string;
}) => (
  <div className="bg-[#f2f4f2] border-l-4 border-[#c2a336] rounded-lg p-4 flex flex-col gap-1.5 shadow-sm">
    <span className="text-xs text-[#25443c] font-semibold uppercase tracking-wider">
      {label}
    </span>
    <span
      className="text-[26px] font-bold leading-none"
      style={{ color: valueColor ?? "#1a3a32" }}
    >
      {value}
    </span>
    {sub && (
      <span className="text-[11px] text-[#5c7a6b] font-medium">{sub}</span>
    )}
  </div>
);

const EventStatusBadge = ({
  status,
}: {
  status: "UPCOMING" | "ONGOING" | "PAST";
}) => {
  const map = {
    UPCOMING: { bg: "#e1e8e5", text: "#1a3a32", label: "Upcoming" },
    ONGOING: { bg: "#c2a336", text: "#ffffff", label: "Ongoing" },
    PAST: { bg: "#f1f1f1", text: "#7d7d7d", label: "Past" },
  } as const;
  const s = map[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 shadow-sm"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
};

const NoticeCategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    URGENT: { bg: "#7a1a1a", text: "#ffffff" },
    DEADLINE: { bg: "#c2a336", text: "#ffffff" },
    INFO: { bg: "#1a3a32", text: "#ffffff" },
    WELCOME: { bg: "#25443c", text: "#ffffff" },
  };
  const s = map[category] ?? { bg: "#f1f1f1", text: "#1a3a32" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
      style={{ background: s.bg, color: s.text }}
    >
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
};

const RegistryStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    SUBMITTED: { bg: "#1a3a32", text: "#ffffff" },
    DRAFT: { bg: "#f2f4f2", text: "#c2a336" },
  };
  const s = map[status.toUpperCase()] ?? { bg: "#f1f1f1", text: "#7d7d7d" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#c2a336]/20"
      style={{ background: s.bg, color: s.text }}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const ProgressRow = ({
  label,
  count,
  total,
  color,
  textColor,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  textColor: string;
}) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-xs font-semibold text-[#25443c]">{label}</span>
      <span className="text-xs font-bold" style={{ color: textColor }}>
        {count}
      </span>
    </div>
    <div className="h-2 rounded-full bg-[#e8ede9] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300 shadow-inner"
        style={{
          width: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%",
          background: color,
        }}
      />
    </div>
  </div>
);

const guestInitial = (name: string) => name.trim().charAt(0).toUpperCase();
const genderLabel = (gender: string) => gender.charAt(0) + gender.slice(1).toLowerCase();

// ── Main Component ────────────────────────────────────────────────────────────

const JudgeDashboard = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const { user } = useAppSelector((state) => state.auth);
  const events = useAppSelector(selectAllEvents);
  const { loading: eventsLoading } = useAppSelector((state) => state.events);
  const { notices, unreadCount: unreadNotices, loading: noticesLoading } = useAppSelector((state) => state.notices);
  const { myRegistry, loading: guestsLoading } = useAppSelector((state) => state.guests);
  const { messages, broadcastMessages, unreadCount: unreadMessages, connected, loading: chatLoading } = useChat();

  useEffect(() => {
    dispatch(fetchEvents("ALL"));
    dispatch(fetchNotices());
    dispatch(getMyGuestRegistry());
  }, [dispatch]);

  // ── Unified Live Status Logic ───────────────────────────────────────────────

  const eventsWithLiveStatus = useMemo(() => {
    return events.map(event => ({
      ...event,
      liveStatus: deriveEventStatus(event)
    }));
  }, [events]);

  const totalEvents = eventsWithLiveStatus.length;
  const upcomingCount = eventsWithLiveStatus.filter(e => e.liveStatus === "UPCOMING").length;
  const ongoingCount = eventsWithLiveStatus.filter(e => e.liveStatus === "ONGOING").length;
  const pastCount = eventsWithLiveStatus.filter(e => e.liveStatus === "PAST").length;

  const upcomingEventsPreview = [...eventsWithLiveStatus]
    .filter((e) => e.liveStatus !== "PAST")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 4);

  // FIXED: Explicitly typed to resolve unused declaration error
  const recentNotices: INotice[] = [...notices]
    .sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);

  const guestCount = myRegistry.guests.length;
  const totalMessages = messages.length + broadcastMessages.length;
  const loading = eventsLoading || noticesLoading || guestsLoading || chatLoading;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = user?.full_name ?? "Judge";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-[#f9faf9]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-[#c2a336]">{greeting}, {displayName}</p>
          <h1 className="text-3xl font-bold text-[#1a3a32] mt-0.5 border-b-2 border-[#c2a336] inline-block pr-8">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#e2e8e4] rounded-full shadow-sm">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
          <span className="text-[10px] font-bold text-[#1a3a32] uppercase tracking-tighter">
            {connected ? "Securely Connected" : "Offline"}
          </span>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-[#1a3a32] mb-4 animate-pulse font-medium">
          Loading judicial records and communications…
        </p>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard 
            label="Upcoming Events" 
            value={upcomingCount} 
            sub={ongoingCount > 0 ? `${ongoingCount} ongoing now` : "Scheduled Sessions"} 
            valueColor="#c2a336" 
        />
        <MetricCard label="Unread Notices" value={unreadNotices} sub={`of ${notices.length} total updates`} valueColor={unreadNotices > 0 ? "#7a1a1a" : "#1a3a32"} />
        <MetricCard label="Unread Messages" value={unreadMessages} sub={`of ${totalMessages} total message${totalMessages !== 1 ? "s" : ""}`} valueColor={unreadMessages > 0 ? "#7a1a1a" : "#1a3a32"} />
        <MetricCard label="Guest Registry" value={guestCount} sub={myRegistry.status} valueColor="#25443c" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Events List */}
        <div className="bg-white border border-[#e2e8e4] rounded-xl p-5 shadow-sm">
          <p className="text-[12px] font-bold text-[#1a3a32] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-4 bg-[#c2a336] rounded-sm" />
            Upcoming Events
          </p>
          {upcomingEventsPreview.length === 0 ? (
            <p className="text-xs text-[#5c7a6b] py-4 text-center italic">No upcoming judicial events scheduled.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#f2f4f2]">
              {upcomingEventsPreview.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-3.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1a3a32] truncate">{event.title}</p>
                    <p className="text-[11px] text-[#5c7a6b] mt-0.5 font-medium">
                      {formatDate(event.start_time)} · {formatTime(event.start_time)}
                    </p>
                    {event.location && (
                      <p className="text-[10px] text-[#c2a336] font-semibold mt-0.5 truncate italic">
                        {event.is_virtual ? "Virtual Session · " : ""}{event.location}
                      </p>
                    )}
                  </div>
                  <EventStatusBadge status={event.liveStatus} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="bg-white border border-[#e2e8e4] rounded-xl p-5 shadow-sm">
          <p className="text-[12px] font-bold text-[#1a3a32] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-4 bg-[#1a3a32] rounded-sm" />
            Recent Notices
          </p>
          {recentNotices.length === 0 ? (
            <p className="text-xs text-[#5c7a6b] py-4 text-center italic">No recent administrative notices.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#f2f4f2]">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="flex items-start gap-3 py-3.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 shadow-sm" style={{ background: notice.is_read ? "#d1d1d1" : "#c2a336" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-[#1a3a32] leading-relaxed" style={{ fontWeight: notice.is_read ? 500 : 700 }}>{notice.title}</p>
                      <NoticeCategoryBadge category={notice.category} />
                    </div>
                    <p className="text-[11px] text-[#5c7a6b] mt-0.5 font-medium">
                      {timeAgo(notice.created_at)}
                      {!notice.is_read && <span className="ml-1.5 text-[#c2a336] font-bold italic">· New</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistics Bar Charts */}
        <div className="bg-white border border-[#e2e8e4] rounded-xl p-5 shadow-sm">
          <p className="text-[12px] font-bold text-[#1a3a32] uppercase tracking-widest mb-5">
            Event Statistics
          </p>
          <div className="flex flex-col gap-4">
            <ProgressRow label="Upcoming" count={upcomingCount} total={totalEvents} color="#c2a336" textColor="#c2a336" />
            <ProgressRow label="Ongoing" count={ongoingCount} total={totalEvents} color="#1a3a32" textColor="#1a3a32" />
            <ProgressRow label="Past" count={pastCount} total={totalEvents} color="#d1d1d1" textColor="#7d7d7d" />
          </div>
        </div>

        {/* Registry Summary */}
        <div className="bg-[#1a3a32] border border-[#1a3a32] rounded-xl p-5 shadow-lg text-white">
          <p className="text-[12px] font-bold text-[#c2a336] uppercase tracking-widest mb-4">
            Guest Registry
          </p>
          <div className="flex items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-full bg-[#c2a336] flex items-center justify-center flex-shrink-0 shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{guestCount} Registered Guest{guestCount !== 1 ? "s" : ""}</p>
              <div className="mt-1"><RegistryStatusBadge status={myRegistry.status} /></div>
            </div>
          </div>
          {myRegistry.guests.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2">
              {myRegistry.guests.slice(0, 3).map((g, i) => (
                <div key={g.id ?? i} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#c2a336]/20 border border-[#c2a336]/40 flex items-center justify-center text-xs font-bold text-[#c2a336]">
                    {guestInitial(g.name)}
                  </div>
                  <span className="text-xs font-medium text-white/90 truncate">{g.name}</span>
                  <span className="text-[10px] font-bold text-[#c2a336] ml-auto uppercase tracking-tighter">
                    {g.type === "MINOR" ? "Minor · " : ""}{genderLabel(g.gender)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboard;