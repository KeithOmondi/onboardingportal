import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchEvents, setFilter } from "../../redux/slices/eventsSlice";
import {
  Calendar as CalendarIcon,
  MapPin,
  Video,
  Clock,
  ChevronRight,
  Filter,
  Gavel,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { EventStatus } from "../../interfaces/events.interface";

// ── Helpers ───────────────────────────────────────────────────────────

const getStatusStyles = (status: string) => {
  switch (status) {
    case "UPCOMING":
      return {
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-100",
      };
    case "ONGOING":
      return {
        color: "text-green-700",
        bg: "bg-green-50",
        border: "border-green-200 animate-pulse",
      };
    case "PAST":
      return {
        color: "text-stone-500",
        bg: "bg-stone-50",
        border: "border-stone-100",
      };
    default:
      return {
        color: "text-[#C9922A]",
        bg: "bg-amber-50",
        border: "border-amber-100",
      };
  }
};

/**
 * Syncs the ISO string from DB to the local browser timezone (EAT).
 */
const formatLocalTime = (dateSource: string) => {
  return new Date(dateSource)
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

const formatDate = (dateSource: string) =>
  new Date(dateSource).toLocaleDateString("en-KE", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// ── Component ─────────────────────────────────────────────────────────

const JudgeEvents = () => {
  const dispatch = useAppDispatch();
  const { events, loading, error, currentFilter } = useAppSelector(
    (state) => state.events,
  );

  useEffect(() => {
    dispatch(fetchEvents(currentFilter));
  }, [dispatch, currentFilter]);

  const handleTabChange = (tab: string) => {
    dispatch(setFilter(tab.toUpperCase() as EventStatus));
  };

  // Source of Truth: The 'current_status' injected by Postgres via Redux
  const nextSession =
    events.find((e) => e.current_status === "ONGOING") ??
    events.find((e) => e.current_status === "UPCOMING") ??
    (events.length > 0 ? events[0] : null);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#1a3a2a] tracking-tight">
            EVENTS CALENDAR
          </h1>
          <p className="text-xs text-stone-400 font-medium mt-1">
            Nairobi Standard Time (GMT+3)
          </p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto no-scrollbar">
          {["Upcoming", "Ongoing", "Past", "All"].map((tab) => {
            const isActive =
              (currentFilter === "ALL" && tab === "All") ||
              currentFilter === tab.toUpperCase();
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-[#1a3a2a] shadow-sm scale-[1.02]"
                    : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Summary + Next Session */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
              <Filter size={14} /> Events summery
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-600">
                  Events Found
                </span>
                <span className="text-lg font-bold text-[#1a3a2a]">
                  {events.length}
                </span>
              </div>
              <div className="h-px bg-stone-100" />
              <p className="text-[11px] text-stone-400 italic leading-relaxed">
                Displaying <strong>{currentFilter.toLowerCase()}</strong>{" "}
                sessions. Calculations are sync with the orhc data.
              </p>
            </div>
          </div>

          <div className="bg-[#1a3a2a] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <CalendarIcon
                size={24}
                className="text-[#C9922A] mb-4 group-hover:scale-110 transition-transform"
              />
              <p className="text-sm font-medium opacity-80">
                Next / Active Session
              </p>
              {nextSession ? (
                <>
                  <h4 className="text-lg font-bold font-serif mt-1">
                    {formatDate(nextSession.start_time)}
                  </h4>
                  <p className="text-xs mt-2 font-black uppercase tracking-widest text-[#C9922A]">
                    {formatLocalTime(nextSession.start_time)}
                    {nextSession.end_time && (
                      <span className="font-normal opacity-75">
                        {" – "}
                        {formatLocalTime(nextSession.end_time)}
                      </span>
                    )}
                  </p>
                  {nextSession.current_status && (
                    <span
                      className={`inline-block mt-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm ${
                        getStatusStyles(nextSession.current_status).bg
                      } ${getStatusStyles(nextSession.current_status).color}`}
                    >
                      {nextSession.current_status}
                    </span>
                  )}
                </>
              ) : (
                <p className="text-sm mt-2 opacity-60 italic">
                  No scheduled sessions
                </p>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <Gavel size={120} />
            </div>
          </div>
        </div>

        {/* Right: Timeline Feed */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-stone-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium tracking-wide">
                Retrieving verified records...
              </p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-24 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
              <div className="bg-stone-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="text-stone-300" size={20} />
              </div>
              <p className="text-stone-400 font-medium">
                No events found for the current selection.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventDate = new Date(event.start_time);
                const cardStatus = event.current_status || "UNKNOWN";
                const styles = getStatusStyles(cardStatus);

                return (
                  <div key={event.id} className="group relative flex gap-6">
                    {/* Date Sidebar */}
                    <div className="hidden sm:flex flex-col items-center min-w-[64px] pt-2">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">
                        {eventDate.toLocaleString("default", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-2xl font-bold text-stone-800 tabular-nums">
                        {eventDate.getDate().toString().padStart(2, "0")}
                      </span>
                      <div className="w-px h-full bg-stone-100 mt-2 group-last:bg-transparent" />
                    </div>

                    <div
                      className={`flex-1 bg-white border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300 transform hover:-translate-y-0.5 ${
                        cardStatus === "PAST"
                          ? "border-stone-100 opacity-80"
                          : "border-stone-200"
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles.bg} ${styles.color} ${styles.border}`}
                          >
                            <Clock size={12} />
                            {cardStatus}
                          </div>
                          <div className="flex items-center gap-2 text-stone-400">
                            {event.is_virtual ? (
                              <Video size={16} />
                            ) : (
                              <MapPin size={16} />
                            )}
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {event.location}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold font-serif text-[#1a3a2a] mb-2 group-hover:text-[#C9922A] transition-colors leading-tight">
                          {event.title}
                        </h3>
                        <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-6 font-medium">
                          {event.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-stone-50">
                          <div className="flex items-center gap-6 text-stone-500">
                            <div className="flex items-center gap-2">
                              <div className="bg-amber-50 p-1.5 rounded-lg">
                                <Clock size={14} className="text-[#C9922A]" />
                              </div>
                              <span className="text-xs font-bold text-stone-700">
                                {formatLocalTime(event.start_time)}
                                {event.end_time && (
                                  <span className="font-normal text-stone-400">
                                    {" – "}
                                    {formatLocalTime(event.end_time)}
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-stone-400" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                                {event.organizer}
                              </span>
                            </div>
                          </div>

                          <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#1a3a2a] hover:text-[#C9922A] transition-all bg-stone-50 px-4 py-2 rounded-lg hover:bg-stone-100">
                            View Case Details <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeEvents;
