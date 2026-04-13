import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users, Scale, BookOpen, Search,
  Download, Filter, RefreshCw, ChevronRight,
  Loader2, Gavel, Calendar
} from "lucide-react";
import type { AppDispatch, RootState } from "../../redux/store";
import { fetchAllPreferences } from "../../redux/slices/swearingPreferenceSlice";

const SuperAdminOath = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { allPreferences, loading } = useSelector(
    (state: RootState) => state.swearingPreference
  );

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllPreferences());
  }, [dispatch]);

  const totalJudges = allPreferences.length;
  const oathCount = allPreferences.filter(p => p.ceremony_choice === "oath").length;
  const affirmationCount = allPreferences.filter(p => p.ceremony_choice === "affirmation").length;

  const filteredData = allPreferences.filter((pref) =>
    pref.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pref.religious_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="min-h-screen p-6 lg:p-12 text-[#1a1a1a] selection:bg-[#C9922A] selection:text-white"
      style={{
        backgroundColor: "#eeeeee",
        backgroundImage: `radial-gradient(circle at 50% 0%, #ffffff 0%, #eeeeee 100%)`,
        fontFamily: "'Georgia', 'serif'",
      }}
    >
      {/* Decorative Brand Watermark */}
      <div className="fixed top-10 right-10 opacity-[0.03] pointer-events-none text-[#C9922A]">
        <Gavel size={400} />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-10">

        {/* ── HEADER ── */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-8 pb-10 border-b border-black/5">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
              style={{
                background: "linear-gradient(135deg, #C9922A 0%, #a87520 100%)",
                boxShadow: "0 10px 30px rgba(201,146,42,0.3)",
              }}
            >
              <Gavel size={32} color="#fff" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[#C9922A] text-xs font-bold uppercase tracking-[0.5em] mb-2">
                office of the registrar high court
              </p>
              <h1 className="text-4xl lg:text-3xl font-extrabold uppercase font-serif font-medium tracking-tight text-[#1a1c1e]">
                oath <span className="italic text-[#C9922A]">details</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => dispatch(fetchAllPreferences())}
              disabled={loading}
              className="p-4 rounded-xl border border-black/5 bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-30 shadow-sm"
            >
              <RefreshCw size={20} className={`${loading ? "animate-spin" : ""} text-[#C9922A]`} />
            </button>
            <button
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #C9922A 0%, #a87520 100%)",
                color: "white",
                boxShadow: "0 10px 25px -5px rgba(201,146,42,0.4)",
              }}
            >
              <Download size={16} />
              Export Records
            </button>
          </div>
        </header>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Registrations", value: totalJudges, icon: Users, color: "#C9922A" },
            { label: "Religious Oaths", value: oathCount, icon: BookOpen, color: "#C9922A" },
            { label: "Affirmations", value: affirmationCount, icon: Scale, color: "#2d6a4f" },
          ].map((stat, i) => (
            <div
              key={i}
              className="group relative bg-white border border-black/5 rounded-3xl p-8 transition-all hover:border-[#C9922A]/30 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-4xl font-serif text-[#1a1c1e] group-hover:text-[#C9922A] transition-colors">
                    {stat.value.toString().padStart(2, "0")}
                  </p>
                </div>
                <div className="p-3 bg-[#fcf9f2] rounded-xl group-hover:bg-[#fcf9f2] transition-colors border border-[#C9922A]/10">
                  <stat.icon size={24} style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN REGISTRY CARD ── */}
        <div className="bg-white border border-black/5 rounded-[2rem] overflow-hidden shadow-xl">

          {/* Search Controls */}
          <div className="p-8 border-b border-black/5 flex flex-col md:flex-row gap-6 justify-between items-center bg-[#fcfcfc]">
            <div className="relative w-full md:w-1/2 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#C9922A] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Filter by officer name or text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f8f8f8] border border-black/5 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-[#C9922A]/50 focus:bg-white transition-all placeholder:text-gray-400 font-sans"
              />
            </div>
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#fcf9f2] border border-[#C9922A]/10">
              <Filter size={14} className="text-[#C9922A]" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#C9922A]">
                {filteredData.length} Results Found
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8f8f8]">
                  {["Judicial Officer", "Ceremony Choice", "Sacred Text", "Action"].map((h) => (
                    <th key={h} className="px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C9922A] text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-sans">
                {filteredData.map((pref) => (
                  <tr key={pref.id} className="hover:bg-[#fcf9f2]/30 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[#fcf9f2] border border-[#C9922A]/20 flex items-center justify-center text-lg font-serif text-[#C9922A] group-hover:border-[#C9922A]/40 transition-all">
                          {pref.full_name?.charAt(0) || "J"}
                        </div>
                        <div>
                          <p className="font-bold text-[#1a1c1e] group-hover:text-[#C9922A] transition-colors">
                            {pref.full_name || "Unknown Judge"}
                          </p>
                          {pref.updated_at && (
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1 mt-1 font-bold">
                              <Calendar size={10} />
                              {new Date(pref.updated_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tighter
                          ${pref.ceremony_choice === "oath"
                            ? "bg-[#C9922A]/10 border-[#C9922A]/30 text-[#C9922A]"
                            : "bg-green-50 border-green-200 text-green-700"
                          }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${pref.ceremony_choice === "oath" ? "bg-[#C9922A]" : "bg-green-500"}`} />
                        {pref.ceremony_choice}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm text-gray-600 font-medium italic">
                        {pref.ceremony_choice === "affirmation" ? (
                          <span className="opacity-40">Non-religious (Solemn)</span>
                        ) : (
                          pref.religious_text || "Standard Text"
                        )}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <button className="p-3 rounded-lg bg-gray-50 border border-black/5 text-gray-300 hover:text-[#C9922A] hover:border-[#C9922A]/40 hover:bg-white transition-all shadow-sm">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty States */}
            {!loading && filteredData.length === 0 && (
              <div className="py-32 text-center">
                <Search size={48} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-400 uppercase tracking-widest text-xs font-bold font-sans">
                  No registry entries match your criteria
                </p>
              </div>
            )}

            {loading && allPreferences.length === 0 && (
              <div className="py-32 text-center">
                <Loader2 size={40} className="animate-spin mx-auto text-[#C9922A] mb-4" />
                <p className="text-[#C9922A] uppercase tracking-[0.4em] text-[10px] font-bold">
                  Accessing Secure Records...
                </p>
              </div>
            )}
          </div>

          {/* Table Footer */}
          <footer className="p-8 border-t border-black/5 bg-[#f8f8f8] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                onboarding portal • {new Date().getFullYear()}
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-sans italic font-bold">
              Displaying {filteredData.length} of {totalJudges} officers
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOath;