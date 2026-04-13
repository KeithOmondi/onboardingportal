import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Scale, Scroll, ShieldCheck, Edit3, X, 
  CheckCircle2, Calendar, BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

import type { CeremonyChoice, SwearingPreferencePayload } from "../../interfaces/swearingPreference.interface";
import type { AppDispatch, RootState } from "../../redux/store";
import { 
  clearSwearingPreferenceState, 
  getMySwearingPreference, 
  saveSwearingPreference 
} from "../../redux/slices/swearingPreferenceSlice";

/* =====================================================
    CONSTANTS
===================================================== */
const RELIGIOUS_TEXTS = ["Bible", "Quran", "Bhagavad Gita", "Other"];

const JudgeOathDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Connect to Redux State
  const { myPreference, loading, error, success } = useSelector(
    (state: RootState) => state.swearingPreference
  );

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [isOath, setIsOath] = useState<boolean>(true);
  const [religiousText, setReligiousText] = useState("");
  const [otherText, setOtherText] = useState("");

  // 1. Initial Data Fetch
  useEffect(() => {
    dispatch(getMySwearingPreference());
  }, [dispatch]);

  // 2. Sync Local Form State (Optimized to prevent cascading renders)
  useEffect(() => {
    if (myPreference && isModalOpen) {
      const incomingIsOath = myPreference.ceremony_choice === "oath";
      const incomingText = myPreference.religious_text || "";
      
      // Only update if values actually changed to satisfy React's performance guardrails
      if (isOath !== incomingIsOath) setIsOath(incomingIsOath);

      if (incomingText && !RELIGIOUS_TEXTS.includes(incomingText)) {
        if (religiousText !== "Other") setReligiousText("Other");
        if (otherText !== incomingText) setOtherText(incomingText);
      } else {
        if (religiousText !== incomingText) setReligiousText(incomingText);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPreference, isModalOpen]); 

  // 3. Notifications
  useEffect(() => {
    if (success) {
      toast.success("Preferences synchronized");
      setIsModalOpen(false); 
      dispatch(clearSwearingPreferenceState());
    }
    if (error) {
      toast.error(error);
      dispatch(clearSwearingPreferenceState());
    }
  }, [success, error, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fix: Ensure religiousText is a string (use empty string if null)
    const payload: SwearingPreferencePayload = {
      ceremonyChoice: (isOath ? "oath" : "affirmation") as CeremonyChoice,
      religiousText: isOath 
        ? (religiousText === "Other" ? otherText : religiousText) 
        : "" // Sending empty string instead of null to satisfy TS SwearingPreferencePayload
    };

    dispatch(saveSwearingPreference(payload));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black font-serif text-[#1a3a32] uppercase tracking-tighter flex items-center gap-3">
            <Scale className="text-[#b48222]" /> Ceremony Preference 
          </h1>
          <p className="text-[9px] font-bold text-[#b48222] uppercase tracking-[0.2em] mt-1">
                For purposes of the swearing-in ceremony, do you wish to take the
            prescribed oath (which includes a reference to God) or would you
            prefer to make a solemn affirmation? 
              </p>  
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1a3a32] hover:bg-[#112621] text-white text-[10px] font-black uppercase tracking-widest py-4 px-8 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-900/10"
        >
          {myPreference ? "Click to Select" : "Set Preference"}
        </button>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-1 px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            {myPreference && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    <CheckCircle2 size={12} />
                    <span className="text-[9px] font-bold uppercase">Verified</span>
                </div>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Text</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myPreference ? (
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#b48222]/10 rounded-lg text-[#b48222]">
                        <ShieldCheck size={18} />
                      </div>
                      <span className="text-sm font-bold text-[#1a3a32] capitalize">{myPreference.ceremony_choice}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BookOpen size={14} className="text-[#b48222]" />
                      <span className="text-xs font-medium">{myPreference.religious_text || "Non-Religious Affirmation"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase">Active</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <Calendar size={12} />
                        {new Date(myPreference.updated_at || "").toLocaleDateString()}
                      </div>
                      <span className="text-[9px] text-slate-300 font-medium">
                        {new Date(myPreference.updated_at || "").toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Scale size={48} />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No preference record found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a3a32]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="bg-[#1a3a32] p-8 text-white relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-black uppercase tracking-tighter">Ceremony Preference</h2>
              
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="flex gap-4">
                {[
                  { id: true, label: "Oath", sub: "Religious", icon: ShieldCheck },
                  { id: false, label: "Affirmation", sub: "Solemn Promise", icon: ShieldCheck }
                ].map((type) => (
                  <button
                    key={type.label}
                    type="button"
                    onClick={() => setIsOath(type.id)}
                    className={`flex-1 p-5 rounded-2xl border transition-all duration-300 text-left ${
                      isOath === type.id
                        ? "border-[#b48222] bg-[#b48222]/5 ring-1 ring-[#b48222]"
                        : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-[#1a3a32] uppercase">{type.label}</span>
                      {isOath === type.id && <type.icon size={14} className="text-[#b48222]" />}
                    </div>
                    <span className="text-[9px] font-medium text-slate-500 uppercase">{type.sub}</span>
                  </button>
                ))}
              </div>

              <div className={`space-y-6 transition-all duration-500 ${isOath ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Scroll size={12} className="text-[#b48222]" /> Selected Religious Text
                  </label>
                  <select
                    value={religiousText}
                    onChange={(e) => setReligiousText(e.target.value)}
                    disabled={!isOath}
                    className="w-full bg-slate-50 border border-slate-200 text-[#1a3a32] text-[11px] font-bold uppercase py-4 px-5 rounded-2xl outline-none"
                  >
                    <option value="" disabled>-- Select --</option>
                    {RELIGIOUS_TEXTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {isOath && religiousText === "Other" && (
                  <div className="space-y-3 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Edit3 size={12} className="text-[#b48222]" /> Specify Text
                    </label>
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Enter sacred text name..."
                      className="w-full bg-white border border-slate-200 text-[#1a3a32] text-[11px] font-bold uppercase py-4 px-5 rounded-2xl outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a3a32] text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Synchronizing..." : "Confirm Selection"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeOathDashboard;