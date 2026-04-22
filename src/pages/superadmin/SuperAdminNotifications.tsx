import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Send,
  Loader2,
  Megaphone,
  RefreshCw,
  RotateCcw,
  CalendarDays,
  Clock,
  FileText,
  Trash2, // Added
  Edit3,   // Added
} from "lucide-react";
import type { AppDispatch, RootState } from "../../redux/store";
import {
  fetchEmergencyNote,
  upsertEmergencyNote,
  deleteEmergencyNote, // Added
  resetEmergencyStatus,
} from "../../redux/slices/emergency";

/* ─────────────────────────────────────────
    Helpers
───────────────────────────────────────── */
const formatDisplayDate = (isoString: string): string => {
  if (!isoString) return "[date not set]";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const buildTemplate = (date: string): string =>
  `Dear Judges,\n\nKindly note that the guest registration date will end on ${formatDisplayDate(
    date
  )} and the portal will automatically close at 11:59 PM.\n\nThank you for your cooperation.`;

/* ─────────────────────────────────────────
    Component
───────────────────────────────────────── */
const SuperAdminNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    note,
    loading: isEmergencyLoading,
    success: broadcastSuccess,
  } = useSelector((state: RootState) => state.emergency);

  const [emergencyDate, setEmergencyDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [emergencyText, setEmergencyText] = useState(() =>
    buildTemplate(new Date().toISOString().slice(0, 16))
  );
  const [isCustomized, setIsCustomized] = useState(false);

  // Load existing note on mount
  useEffect(() => {
    dispatch(fetchEmergencyNote())
      .unwrap()
      .then((data) => {
        if (data?.note) {
          setEmergencyText(data.note);
          setIsCustomized(true);
        }
      })
      .catch((err) => console.error("Failed to load existing note:", err));
  }, [dispatch]);

  useEffect(() => {
    if (broadcastSuccess) {
      const timer = setTimeout(() => {
        dispatch(resetEmergencyStatus());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [broadcastSuccess, dispatch]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setEmergencyDate(newDate);
    if (!isCustomized) {
      setEmergencyText(buildTemplate(newDate));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmergencyText(e.target.value);
    setIsCustomized(true);
  };

  const handleResetTemplate = () => {
    setEmergencyText(buildTemplate(emergencyDate));
    setIsCustomized(false);
  };

  const handleBroadcast = () => {
    if (!emergencyText) return;
    dispatch(upsertEmergencyNote(emergencyText));
  };

  // --- Table Actions ---
  const handleEditFromTable = () => {
    if (note) {
      setEmergencyText(note.note);
      setIsCustomized(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to clear this emergency broadcast?")) {
      dispatch(deleteEmergencyNote());
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] flex items-start justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-gradient-to-br from-[#1a4731] to-[#2d7a50] rounded-[24px] mb-5 shadow-lg shadow-[#1a4731]/25 ring-4 ring-[#fdf6e8] relative text-[#e0b96a]">
            <Megaphone size={30} />
            <div className="absolute inset-[-4px] rounded-[28px] border border-[#c9963b] opacity-35" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#1a4731] leading-tight tracking-tight mb-1">
            Emergency Broadcast
          </h1>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#c9963b]">
            Judge Management System
          </p>
        </div>

        {/* Main Card */}
        <div className="relative bg-white border border-[#e8ede6] rounded-[2rem] p-6 md:p-10 shadow-xl shadow-[#1a4731]/5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1a4731] via-[#c9963b] to-[#2d7a50]" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6b7563] flex items-center">
              Message for All Judges
              {isEmergencyLoading && (
                <RefreshCw size={12} className="ml-2 animate-spin" />
              )}
            </span>

            <div className="flex items-center gap-2">
              {isCustomized && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-[#22623f] bg-[#e9f5ee] rounded-full px-2.5 py-1 animate-in zoom-in-90">
                  ✎ Edited
                </span>
              )}
              {isCustomized && (
                <button
                  onClick={handleResetTemplate}
                  className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-[#c9963b] bg-[#fdf6e8] border border-[#e8d9b8] rounded-full px-3 py-1 hover:bg-[#c9963b] hover:text-white transition-colors"
                >
                  <RotateCcw size={10} />
                  Reset Template
                </button>
              )}
            </div>
          </div>

          <textarea
            className="w-full min-h-[11rem] p-5 bg-[#fdf6e8] border-[1.5px] border-[#e8d9b8] rounded-[1.25rem] text-[13.5px] text-[#1c1c1a] leading-relaxed font-medium outline-none focus:bg-white focus:border-[#22623f] focus:ring-4 focus:ring-[#22623f]/10 transition-all resize-y placeholder:text-[#b5b89e]"
            value={emergencyText}
            onChange={handleTextChange}
            placeholder="Enter critical update for all judges..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#6b7563] mb-2.5">
                Closing Date
              </label>
              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22623f] pointer-events-none"
                />
                <input
                  type="datetime-local"
                  className="w-full py-3.5 pl-11 pr-4 bg-[#fdf6e8] border-[1.5px] border-[#e8d9b8] rounded-2xl text-[12px] font-bold text-[#1a4731] outline-none focus:border-[#22623f] focus:ring-4 focus:ring-[#22623f]/10 transition-all cursor-pointer"
                  value={emergencyDate}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleBroadcast}
                disabled={isEmergencyLoading || !emergencyText}
                className="group relative w-full h-[52px] bg-[#1a4731] rounded-2xl overflow-hidden shadow-lg shadow-[#1a4731]/30 hover:shadow-[#c9963b]/35 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#c9963b] to-[#e0b96a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-[#e0b96a] group-hover:text-[#1a4731]">
                  {isEmergencyLoading ? (
                    <Loader2 size={16} className="animate-spin text-inherit" />
                  ) : (
                    <Send size={16} className="text-inherit" />
                  )}
                  <span>Broadcast to Judges</span>
                </div>
              </button>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="flex items-center gap-3 p-3.5 bg-[#e9f5ee] border border-[#b7dfc8] rounded-2xl mt-4 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-[#2d7a50] animate-pulse" />
              <p className="text-[11px] font-bold text-[#1a4731] tracking-tight m-0">
                {note?.updated_at
                  ? `Note last updated at ${new Date(note.updated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                  : "Broadcast sent successfully."}
              </p>
            </div>
          )}
        </div>

        {/* --- Registry Table --- */}
        <div className="w-full bg-white border border-[#e8ede6] rounded-[1.5rem] overflow-hidden shadow-sm shadow-[#1a4731]/5 mt-8">
          <div className="px-6 py-4 bg-[#f8f9f6] border-b border-[#e8ede6] flex items-center justify-between">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#1a4731] flex items-center gap-2">
              <FileText size={14} className="text-[#c9963b]" />
              Active Notice Registry
            </h3>
            <span className="text-[9px] px-2 py-0.5 bg-[#1a4731]/5 text-[#1a4731] rounded-md font-bold uppercase">
              Current Live Status
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafaf7]">
                  <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-[#6b7563] border-b border-[#e8ede6]">Content Preview</th>
                  <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-[#6b7563] border-b border-[#e8ede6]">Last Updated</th>
                  <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-[#6b7563] border-b border-[#e8ede6] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {note ? (
                  <tr className="group hover:bg-[#fdf6e8]/30 transition-colors">
                    <td className="px-6 py-5 border-b border-[#f4f7f2]">
                      <p className="text-[12px] text-[#1a4731] font-medium leading-relaxed line-clamp-2 max-w-[240px]">
                        {note.note}
                      </p>
                    </td>
                    <td className="px-6 py-5 border-b border-[#f4f7f2]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-[#1a4731] flex items-center gap-1.5 whitespace-nowrap">
                          <CalendarDays size={12} className="text-[#c9963b]" />
                          {formatDisplayDate(note.updated_at)}
                        </span>
                        <span className="text-[10px] text-[#6b7563] flex items-center gap-1.5">
                          <Clock size={12} />
                          {new Date(note.updated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-[#f4f7f2] text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={handleEditFromTable}
                          title="Edit broadcast"
                          className="p-2 text-[#1a4731] bg-[#f0f4f1] hover:bg-[#1a4731] hover:text-white rounded-xl transition-all duration-200"
                        >
                          <Edit3 size={14} />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={handleDelete}
                          disabled={isEmergencyLoading}
                          title="Delete broadcast"
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                        >
                          {isEmergencyLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#b5b89e]">
                        No active broadcast found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminNotifications;