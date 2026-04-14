import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchEvents } from "../../redux/slices/eventsSlice";
import { fetchNotices } from "../../redux/slices/noticeSlice";
import { useChat } from "../../hooks/useChat";
import type { IJudicialEvent } from "../../interfaces/events.interface";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });

const timeAgo = (dateStr: string | Date) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const deriveEventStatus = (event: IJudicialEvent): "UPCOMING" | "ONGOING" | "PAST" => {
  const now = Date.now();
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "ONGOING";
  return "PAST";
};

// ── Sub-components ────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, sub, valueColor }: { label: string; value: number | string; sub?: string; valueColor?: string }) => (
  <div className="bg-[#f2f4f2] border-l-4 border-[#c2a336] rounded-lg p-4 flex flex-col gap-1.5 shadow-sm">
    <span className="text-xs text-[#25443c] font-semibold uppercase tracking-wider">{label}</span>
    <span className="text-[26px] font-bold leading-none" style={{ color: valueColor ?? "#1a3a32" }}>
      {value}
    </span>
    {sub && <span className="text-[11px] text-[#5c7a6b] font-medium">{sub}</span>}
  </div>
);

const EventStatusBadge = ({ status }: { status: "UPCOMING" | "ONGOING" | "PAST" }) => {
  const map = {
    UPCOMING: { bg: "#e1e8e5", text: "#1a3a32", label: "Upcoming" },
    ONGOING: { bg: "#c2a336", text: "#ffffff", label: "Ongoing" },
    PAST: { bg: "#f1f1f1", text: "#7d7d7d", label: "Past" },
  } as const;
  const s = map[status];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 shadow-sm" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
};

const NoticeCategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    URGENT: { bg: "#7a1a1a", text: "#ffffff" },
    DEADLINE: { bg: "#c2a336", text: "#ffffff" },
    INFO: { bg: "#1a3a32", text: "#ffffff" },
  };
  const s = map[category] ?? { bg: "#f1f1f1", text: "#1a3a32" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: s.bg, color: s.text }}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
};

const ProgressRow = ({ label, count, total, color, textColor }: { label: string; count: number; total: number; color: string; textColor: string }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-xs font-semibold text-[#25443c]">{label}</span>
      <span className="text-xs font-bold" style={{ color: textColor }}>{count}</span>
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

// ── Main Component ────────────────────────────────────────────────────────────

const RegistrarDashboard = () => {
  const dispatch = useAppDispatch();


  const { events, loading: eventsLoading } = useAppSelector((state) => state.events);
  const { notices, unreadCount: unreadNotices, loading: noticesLoading } = useAppSelector((state) => state.notices);
  const { messages, connected, loading: chatLoading } = useChat();

  useEffect(() => {
    dispatch(fetchEvents("ALL"));
    dispatch(fetchNotices());
  }, [dispatch]);

  // Calculations
  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => deriveEventStatus(e) === "UPCOMING").length;
  const ongoingCount = events.filter((e) => deriveEventStatus(e) === "ONGOING").length;
  const pastCount = events.filter((e) => deriveEventStatus(e) === "PAST").length;

  const upcomingEvents = [...events]
    .filter((e) => deriveEventStatus(e) !== "PAST")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 4);

  const recentNotices = [...notices]
    .sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);

  const loading = eventsLoading || noticesLoading || chatLoading;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-[#f9faf9]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-[#c2a336]">
            {greeting}, 
          </p>
          <h1 className="text-2xl font-bold uppercase font-serif text-[#1a3a32] mt-0.5 border-b-2 border-[#c2a336] inline-block pr-8">
            Registrar DASHBOARD
          </h1>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#e2e8e4] rounded-full shadow-sm">
           <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
           <span className="text-[10px] font-bold text-[#1a3a32] uppercase tracking-tighter">
             {connected ? 'Systems Online' : 'Offline'}
           </span>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-[#1a3a32] mb-4 animate-pulse font-medium">
          Synchronizing Data...
        </p>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Upcoming"
          value={upcomingCount}
          sub={ongoingCount > 0 ? `${ongoingCount} active now` : "Scheduled Today"}
          valueColor="#c2a336"
        />
        <MetricCard
          label="Unread Notices"
          value={unreadNotices}
          sub={`of ${notices.length} total`}
          valueColor={unreadNotices > 0 ? "#7a1a1a" : "#1a3a32"}
        />
        <MetricCard
          label="Messages"
          value={messages.length}
          sub="Portal Activity"
          valueColor="#1a3a32"
        />
        <MetricCard
          label="Total Events"
          value={totalEvents}
          sub="Calendar Overview"
          valueColor="#25443c"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Events List */}
        <div className="bg-white border border-[#e2e8e4] rounded-xl p-5 shadow-sm">
          <p className="text-[12px] font-bold text-[#1a3a32] uppercase font-serif tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-4 bg-[#c2a336] rounded-sm"></span>
            upcoming events
          </p>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-[#5c7a6b] py-4 text-center italic">No upcoming events found.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#f2f4f2]">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-3.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1a3a32] truncate">{event.title}</p>
                    <p className="text-[11px] text-[#5c7a6b] mt-0.5 font-medium">
                      {formatDate(event.start_time)} · {formatTime(event.start_time)}
                    </p>
                    {event.location && (
                      <p className="text-[10px] text-[#c2a336] font-semibold mt-0.5 truncate italic">
                        {event.location}
                      </p>
                    )}
                  </div>
                  <EventStatusBadge status={deriveEventStatus(event)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices List */}
        <div className="bg-white border border-[#e2e8e4] rounded-xl p-5 shadow-sm">
          <p className="text-[12px] font-bold font-serif text-[#1a3a32] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-4 bg-[#1a3a32] rounded-sm"></span>
            recent notices
          </p>
          {recentNotices.length === 0 ? (
            <p className="text-xs text-[#5c7a6b] py-4 text-center italic">No recent notices.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#f2f4f2]">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="flex items-start gap-3 py-3.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 shadow-sm"
                    style={{ background: notice.is_read ? "#d1d1d1" : "#c2a336" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-[#1a3a32] leading-relaxed" style={{ fontWeight: notice.is_read ? 500 : 700 }}>
                        {notice.title}
                      </p>
                      <NoticeCategoryBadge category={notice.category} />
                    </div>
                    <p className="text-[11px] text-[#5c7a6b] mt-0.5 font-medium">
                      {timeAgo(notice.created_at)} {!notice.is_read && <span className="text-[#c2a336]">· New</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="bg-white border border-[#e2e8e4] rounded-xl p-5 shadow-sm max-w-md">
        <p className="text-[12px] font-bold text-[#1a3a32] font-serif uppercase tracking-widest mb-5">Event Breakdown</p>
        <div className="flex flex-col gap-4">
          <ProgressRow label="Upcoming" count={upcomingCount} total={totalEvents} color="#c2a336" textColor="#c2a336" />
          <ProgressRow label="Ongoing" count={ongoingCount} total={totalEvents} color="#1a3a32" textColor="#1a3a32" />
          <ProgressRow label="Past" count={pastCount} total={totalEvents} color="#d1d1d1" textColor="#7d7d7d" />
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;