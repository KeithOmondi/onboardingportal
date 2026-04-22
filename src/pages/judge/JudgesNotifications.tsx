import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Clock, BellRing, RefreshCw } from "lucide-react";
import type { AppDispatch, RootState } from "../../redux/store";
import { clearEmergencyError, fetchEmergencyNote } from "../../redux/slices/emergency";

/**
 * JudgesNotifications
 * Fetches and displays the global emergency broadcast note.
 * Decoupled from registrationId to act as a singleton.
 */
const JudgesNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { note, loading, error } = useSelector(
    (state: RootState) => state.emergency
  );

  useEffect(() => {
    // Fetch the global singleton note on mount
    dispatch(fetchEmergencyNote());

    return () => {
      dispatch(clearEmergencyError());
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 p-8 bg-[#fdf6e8]/50 border border-[#e8d9b8]/30 rounded-[2rem] animate-pulse mb-8">
        <div className="w-10 h-10 bg-[#e8d9b8] rounded-xl" />
        <div className="space-y-2">
          <div className="h-3 bg-[#e8d9b8] rounded w-24" />
          <div className="h-4 bg-[#e8d9b8] rounded w-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-[11px] font-bold uppercase tracking-wider mb-8">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="relative overflow-hidden bg-white border border-[#e8ede6] shadow-xl shadow-[#1a4731]/5 rounded-[2rem] p-6 md:p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Brand Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1a4731] via-[#c9963b] to-[#2d7a50]" />
      
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex gap-5">
          {/* Icon Container */}
          <div className="mt-1 flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#fdf6e8] text-[#c9963b] rounded-[18px] border border-[#e8d9b8] shadow-sm">
            <BellRing size={22} className="animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6b7563]">
              Emergency Broadcast
            </h3>
            
            {/* The Message */}
            <p className="text-[#1a4731] font-serif font-bold text-[16px] md:text-[18px] leading-[1.6] whitespace-pre-line">
              {note.note}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#c9963b] uppercase tracking-wide">
                <Clock size={12} />
                <span>
                  Updated {new Date(note.updated_at).toLocaleTimeString("en-GB", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </span>
              </div>
              <div className="h-1 w-1 rounded-full bg-[#e8d9b8]" />
              <span className="text-[10px] font-bold text-[#6b7563] uppercase tracking-wide">
                Official Notice
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => dispatch(fetchEmergencyNote())}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-2 text-[10px] font-black text-[#1a4731] hover:text-[#c9963b] bg-[#fafaf7] px-4 py-2 rounded-full border border-[#e8ede6] transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          REFRESH
        </button>
      </div>

      {/* Subtle background decorative element */}
      <div className="absolute -bottom-6 -right-6 text-[#1a4731]/5 pointer-events-none">
         <BellRing size={120} />
      </div>
    </div>
  );
};

export default JudgesNotifications;