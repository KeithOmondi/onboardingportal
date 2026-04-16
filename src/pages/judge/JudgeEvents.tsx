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

const getStatusStyles = (status: EventStatus) => {
  switch (status) {
    case "UPCOMING": return { color: "text-blue-700",   bg: "bg-blue-50"   };
    case "ONGOING":  return { color: "text-green-700",  bg: "bg-green-50"  };
    case "PAST":     return { color: "text-stone-500",  bg: "bg-stone-50"  };
    default:         return { color: "text-[#C9922A]",  bg: "bg-amber-50"  };
  }
};

/**
 * FIX: Prevents timezone shifting. 
 * If your DB stores 10:00 AM, this ensures it shows 10:00 AM 
 * regardless of whether the browser is in UTC or EAT.
 */
const formatZonedTime = (dateSource: Date | string) => {
  const date = new Date(dateSource);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC", // Forces the 'raw' time from the ISO string
  }).toUpperCase();
};

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-KE", { month: "long", day: "numeric", timeZone: "UTC" });

const JudgeEvents = () => {
  const dispatch = useAppDispatch();
  const { events, loading, error, currentFilter } = useAppSelector(
    (state) => state.events
  );

  useEffect(() => {
    dispatch(fetchEvents(currentFilter));
  }, [dispatch, currentFilter]);

  const handleTabChange = (tab: string) => {
    const statusMap: Record<string, EventStatus> = {
      Upcoming: "UPCOMING",
      Past:     "PAST",
      Ongoing:  "ONGOING",
      All:      "ALL",
    };
    dispatch(setFilter(statusMap[tab]));
  };

  const nextSession =
    events.find((e) => e.current_status === "UPCOMING" || e.current_status === "ONGOING")
    ?? (events.length > 0 ? events[0] : null);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-serif text-[#1a3a2a]">
          2026 HIGH COURT JUDGES EVENTS
        </h1>

        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto">
          {["Upcoming", "Ongoing", "Past", "All"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                (currentFilter === "ALL" && tab === "All") ||
                currentFilter === tab.toUpperCase()
                  ? "bg-white text-[#1a3a2a] shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Summary + Next Session */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
              <Filter size={14} /> View Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-600">Total Events</span>
                <span className="text-lg font-bold text-[#1a3a2a]">{events.length}</span>
              </div>
              <div className="h-px bg-stone-100" />
              <p className="text-[11px] text-stone-400 italic">
                Currently showing {currentFilter.toLowerCase()} records from the registry.
              </p>
            </div>
          </div>

          <div className="bg-[#1a3a2a] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <CalendarIcon size={24} className="text-[#C9922A] mb-4" />
              <p className="text-sm font-medium opacity-80">Next Session</p>
              {nextSession ? (
                <>
                  <h4 className="text-lg font-bold font-serif mt-1">
                    {formatDate(nextSession.start_time)}
                  </h4>
                  <p className="text-xs mt-2 font-black uppercase tracking-widest text-[#C9922A]">
                    {formatZonedTime(nextSession.start_time)}
                    {nextSession.end_time && (
                      <span className="font-normal opacity-75">
                        {" – "}{formatZonedTime(nextSession.end_time)}
                      </span>
                    )}
                  </p>
                  {nextSession.current_status && (
                    <span
                      className={`inline-block mt-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        getStatusStyles(nextSession.current_status).bg
                      } ${getStatusStyles(nextSession.current_status).color}`}
                    >
                      {nextSession.current_status}
                    </span>
                  )}
                </>
              ) : (
                <p className="text-sm mt-2 opacity-60 italic">No upcoming sessions</p>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Gavel size={120} />
            </div>
          </div>
        </div>

        {/* Right: Timeline Feed */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium">Retrieving judicial records...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-stone-400 font-medium">No events found for this category.</p>
            </div>
          ) : (
            events.map((event) => {
              const eventDate   = new Date(event.start_time);
              const cardStatus  = event.current_status ?? currentFilter;
              const statusStyle = getStatusStyles(cardStatus);

              return (
                <div key={event.id} className="group relative flex gap-6">
                  {/* Vertical Date - Fixed for Timezone */}
                  <div className="hidden sm:flex flex-col items-center min-w-[60px] pt-2">
                    <span className="text-xs font-black text-stone-400 uppercase">
                      {eventDate.toLocaleString("default", { month: "short", timeZone: "UTC" })}
                    </span>
                    <span className="text-2xl font-bold text-stone-800">
                      {eventDate.getUTCDate()}
                    </span>
                    <div className="w-px h-full bg-stone-100 mt-2 group-last:bg-transparent" />
                  </div>

                  <div
                    className={`flex-1 bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 ${
                      event.is_past ? "border-stone-100 opacity-75" : "border-stone-200"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyle.bg} ${statusStyle.color}`}
                        >
                          <Clock size={12} />
                          {cardStatus}
                        </div>
                        <div className="flex items-center gap-2 text-stone-400">
                          {event.is_virtual ? <Video size={16} /> : <MapPin size={16} />}
                          <span className="text-xs font-medium">{event.location}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold font-serif text-[#1a3a2a] mb-2 group-hover:text-[#C9922A] transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-6">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-50">
                        <div className="flex items-center gap-4 text-stone-500">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-[#C9922A]" />
                            <span className="text-xs font-bold">
                              {formatZonedTime(event.start_time)}
                              {event.end_time && (
                                <span className="font-normal text-stone-400">
                                  {" – "}{formatZonedTime(event.end_time)}
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users size={14} />
                            <span className="text-xs font-medium">{event.organizer}</span>
                          </div>
                        </div>

                        <button className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[#1a3a2a] hover:text-[#C9922A] transition-colors">
                          View Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeEvents;