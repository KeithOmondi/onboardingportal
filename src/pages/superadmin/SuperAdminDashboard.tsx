import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchEvents } from "../../redux/slices/eventsSlice";
import { adminFetchNotices } from "../../redux/slices/noticeSlice";
import { adminGetAllRegistries } from "../../redux/slices/guestSlice";
import { fetchGallery } from "../../redux/slices/gallerySlice"; // Updated Import
import { MediaType } from "../../interfaces/gallery.interface"; // Updated Import
import type { IJudicialEvent } from "../../interfaces/events.interface";
import type { IAdminNotice } from "../../interfaces/notices.interface";
import type { IAdminRegistryRow } from "../../interfaces/guests.interface";
import api from "../../api/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | Date) =>
  new Date(dateStr).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const timeAgo = (dateStr: string | Date) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const deriveEventStatus = (
  e: IJudicialEvent,
): "UPCOMING" | "ONGOING" | "PAST" => {
  const now = Date.now();
  const start = new Date(e.start_time).getTime();
  const end = new Date(e.end_time).getTime();
  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "ONGOING";
  return "PAST";
};

// ── Shared badge maps ─────────────────────────────────────────────────────────

const NOTICE_CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "#FCEBEB", text: "#A32D2D" },
  DEADLINE: { bg: "#FAEEDA", text: "#854F0B" },
  INFO: { bg: "#E6F1FB", text: "#185FA5" },
  WELCOME: { bg: "#EAF3DE", text: "#3B6D11" },
};

const REGISTRY_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  SUBMITTED: { bg: "#f0fdf4", text: "#166534" },
  DRAFT: { bg: "#fffbeb", text: "#92400e" },
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
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
    </div>
    <span
      className="text-3xl font-serif font-black leading-none"
      style={{ color: valueColor ?? "#1a3a2a" }}
    >
      {value}
    </span>
    {sub && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{sub}</span>}
  </div>
);

/** Specialised card for messages showing unread/total split */
const MessagesMetricCard = ({
  unreadCount,
  totalContacts,
}: {
  unreadCount: number;
  totalContacts: number;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Messages</span>
      {unreadCount > 0 ? (
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      ) : (
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </div>

    {/* Unread / total display */}
    <div className="flex items-end gap-1.5 leading-none">
      <span
        className="text-3xl font-serif font-black"
        style={{ color: unreadCount > 0 ? "#b91c1c" : "#1a3a2a" }}
      >
        {unreadCount}
      </span>
      <span className="text-base font-serif font-black text-slate-300 mb-0.5">
        / {totalContacts}
      </span>
    </div>

    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
      {unreadCount > 0
        ? `${unreadCount} unread · ${totalContacts} contacts`
        : `All read · ${totalContacts} contacts`}
    </span>

    {/* Mini progress bar */}
    <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: totalContacts > 0 ? `${Math.min(100, Math.round((unreadCount / totalContacts) * 100))}%` : "0%",
          background: unreadCount > 0 ? "#b91c1c" : "#166534",
        }}
      />
    </div>
  </div>
);

const Badge = ({
  label,
  bg,
  text,
}: {
  label: string;
  bg: string;
  text: string;
}) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0"
    style={{ background: bg, color: text }}
  >
    {label}
  </span>
);

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
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-xs font-black" style={{ color: textColor }}>
        {count}
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%",
          background: color,
        }}
      />
    </div>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black text-[#1a3a2a] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
    {children}
  </p>
);

// ── Main Component ────────────────────────────────────────────────────────────

const SuperAdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { events, loading: eventsLoading } = useAppSelector((state) => state.events);
  const { adminNotices, loading: noticesLoading } = useAppSelector((state) => state.notices);
  const { admin: { allLists: registries, loading: registriesLoading } } = useAppSelector((state) => state.guests);
  const { items, loading: galleryLoading } = useAppSelector((state) => state.gallery);

  // ── Messages stats: lightweight direct fetch (no socket overhead) ──────────
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);

  useEffect(() => {
    const fetchMessageStats = async () => {
      try {
        const { data } = await api.get<{
          recipients: { unreadCount?: number }[];
        }>("/chat/recipients");
        const list = data.recipients ?? [];
        setTotalContacts(list.length);
        setTotalUnreadMessages(
          list.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0)
        );
      } catch (err) {
        console.error("[SuperAdminDashboard] fetchMessageStats failed:", err);
      }
    };
    fetchMessageStats();
  }, []);

  useEffect(() => {
    dispatch(fetchEvents("ALL"));
    dispatch(adminFetchNotices());
    dispatch(adminGetAllRegistries());
    dispatch(fetchGallery()); // Fetching items instead of albums
  }, [dispatch]);

  // ── Derived: events ─────────────────────────────────────────────────────────
  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => deriveEventStatus(e) === "UPCOMING").length;
  const ongoingCount = events.filter((e) => deriveEventStatus(e) === "ONGOING").length;
  const pastCount = events.filter((e) => deriveEventStatus(e) === "PAST").length;

  const upcomingEvents: IJudicialEvent[] = [...events]
    .filter((e) => deriveEventStatus(e) !== "PAST")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // ── Derived: notices ────────────────────────────────────────────────────────
  const activeNotices = adminNotices.filter((n) => n.is_active);
  const urgentCount = activeNotices.filter((n) => n.category === "URGENT").length;
  const totalReadCount = adminNotices.reduce((sum, n) => sum + (n.read_count ?? 0), 0);

  const recentNotices: IAdminNotice[] = [...adminNotices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // ── Derived: registries ─────────────────────────────────────────────────────
  const totalRegistries = registries.length;
  const submittedRegistries = registries.filter((r) => r.status === "SUBMITTED").length;
  const draftRegistries = registries.filter((r) => r.status === "DRAFT").length;
  const totalGuests = registries.reduce((sum, r) => sum + Number(r.guest_count ?? 0), 0);

  const recentRegistries: IAdminRegistryRow[] = [...registries]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  // ── Derived: gallery (Updated for Items) ────────────────────────────────────
  const totalMediaItems = items.length;
  const imageCount = items.filter(i => i.file_type === MediaType.IMAGE).length;
  const videoCount = items.filter(i => i.file_type === MediaType.VIDEO).length;

  const latestMedia = [...items].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  // ── Loading & Greeting ──────────────────────────────────────────────────────
  const loading = eventsLoading || noticesLoading || registriesLoading || galleryLoading;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = user?.full_name ?? "Super Admin";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-[#1a3a2a] font-serif text-3xl font-bold uppercase tracking-tight">
            {greeting}, {displayName.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
             ORHC Monitoring and Oversight
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="w-2 h-2 bg-[#c2a336] rounded-full animate-ping" /> Synchronizing...
          </div>
        )}
      </div>

      {/* ── Top metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-5">
        <MetricCard
          label="Total events"
          value={totalEvents}
          sub={ongoingCount > 0 ? `${ongoingCount} ongoing now` : `${upcomingCount} upcoming`}
        />
        <MetricCard
          label="Active notices"
          value={activeNotices.length}
          sub={urgentCount > 0 ? `${urgentCount} urgent` : `${totalReadCount} total reads`}
          valueColor="#1e40af"
        />
        <MetricCard
          label="Guest registries"
          value={totalRegistries}
          sub={`${totalGuests} guests total`}
          valueColor="#1a3a2a"
        />
        <MetricCard
          label="Gallery assets"
          value={totalMediaItems}
          sub={`${imageCount} images · ${videoCount} videos`}
          valueColor="#c2a336"
        />
        <MessagesMetricCard
          unreadCount={totalUnreadMessages}
          totalContacts={totalContacts}
        />
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notices */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 bg-slate-50/50">
            <SectionTitle>Recent notices</SectionTitle>
            {recentNotices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">No notices found in registry</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {recentNotices.map((notice) => {
                  const catStyle = NOTICE_CATEGORY_STYLE[notice.category] ?? { bg: "#f1f5f9", text: "#475569" };
                  return (
                    <div key={notice.id} className="flex items-center justify-between py-4 gap-3 group transition-colors hover:bg-white/50 px-2 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1a3a2a] truncate">{notice.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                          {timeAgo(notice.created_at)} · {notice.read_count ?? 0} views
                          {!notice.is_active && <span className="ml-1.5 text-red-400">· ARCHIVED</span>}
                        </p>
                      </div>
                      <Badge
                        label={notice.category}
                        bg={catStyle.bg}
                        text={catStyle.text}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Guest Registries */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 bg-slate-50/50">
            <SectionTitle>Guests Overview</SectionTitle>
            {recentRegistries.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">No guest recorded</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {recentRegistries.map((reg) => {
                  const regStyle = REGISTRY_STATUS_STYLE[reg.status] ?? { bg: "#f1f5f9", text: "#475569" };
                  return (
                    <div key={reg.id} className="flex items-center justify-between py-4 gap-3 group transition-colors hover:bg-white/50 px-2 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1a3a2a] truncate">{reg.judge_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                          {reg.guest_count} attendees · {formatDate(reg.updated_at)}
                        </p>
                      </div>
                      <Badge
                        label={reg.status}
                        bg={regStyle.bg}
                        text={regStyle.text}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom 3-col grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Events breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <SectionTitle>Events breakdown</SectionTitle>
          <div className="flex flex-col gap-4">
            <ProgressRow label="Upcoming" count={upcomingCount} total={totalEvents} color="#1e40af" textColor="#1e40af" />
            <ProgressRow label="Ongoing" count={ongoingCount} total={totalEvents} color="#166534" textColor="#166534" />
            <ProgressRow label="Past" count={pastCount} total={totalEvents} color="#94a3b8" textColor="#64748b" />
          </div>
          {upcomingEvents.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-3">
              {upcomingEvents.map((e) => {
                const status = deriveEventStatus(e);
                const style = status === "ONGOING" 
                  ? { bg: "#f0fdf4", text: "#166534", label: "Live" }
                  : { bg: "#eff6ff", text: "#1e40af", label: "Soon" };
                return (
                  <div key={e.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1a3a2a] truncate">{e.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(e.start_time)}</p>
                    </div>
                    <Badge label={style.label} bg={style.bg} text={style.text} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Registry health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <SectionTitle>Guests Overview</SectionTitle>
          <div className="flex flex-col gap-4">
            <ProgressRow label="Submitted" count={submittedRegistries} total={totalRegistries} color="#166534" textColor="#166534" />
            <ProgressRow label="Draft" count={draftRegistries} total={totalRegistries} color="#c2a336" textColor="#854F0B" />
          </div>
          {totalRegistries > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Attendance</span>
                <span className="text-sm font-serif font-black text-[#1a3a2a]">{(totalGuests / totalRegistries).toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Distribution (Updated for Items) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <SectionTitle>Media distribution</SectionTitle>
          <div className="flex flex-col gap-4">
            <ProgressRow 
              label="Images" 
              count={imageCount} 
              total={totalMediaItems} 
              color="#355E3B" 
              textColor="#355E3B" 
            />
            <ProgressRow 
              label="Videos" 
              count={videoCount} 
              total={totalMediaItems} 
              color="#c2a336" 
              textColor="#c2a336" 
            />
          </div>

          {latestMedia && (
            <div className="mt-6 border-t border-slate-100 pt-4">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-[#c2a336] uppercase tracking-widest mb-1">Past Events Overview</p>
                  <p className="text-[11px] font-bold text-[#1a3a2a] truncate">{latestMedia.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                    {formatDate(latestMedia.created_at)} · {latestMedia.file_type}
                  </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;