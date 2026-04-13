import React, { useEffect, useState } from "react";
import {
  ChevronDown, BookOpen, X, Scale,
  ShieldCheck, ExternalLink, Info, FileText, Gavel
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchCourtData } from "../../redux/slices/courtSlice";

interface ICourtOfficial {
  id: string;
  name: string;
  designation: string;
  image_url?: string | null;
  mandate_body?: string | null;
}

interface IMandate {
  id: string;
  title: string;
  detail: string;
  is_primary?: boolean;
}

/* ── MANDATE DETAIL MODAL ── */
const MandateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  mandate: IMandate | null;
}> = ({ isOpen, onClose, mandate }) => {
  if (!isOpen || !mandate) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-[#1a3a32]" />
            <h2 className="font-bold text-xs uppercase tracking-widest text-[#1a3a32]">Registrar Mandate Detail</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto">
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-4 italic">
            {mandate.title}
          </h3>
          <div className="text-slate-600 leading-relaxed font-serif whitespace-pre-line">
            {mandate.detail}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Judiciary of Kenya • Administrative Regulations
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── OFFICIAL MESSAGE MODAL ── */
const OfficialMessageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  official: ICourtOfficial | null;
}> = ({ isOpen, onClose, official }) => {
  if (!isOpen || !official) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-5xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col md:flex-row">
        
        <div className="relative w-full h-56 sm:h-72 md:h-auto md:w-[38%] bg-slate-200 overflow-hidden flex-shrink-0">
          <div className="absolute z-10 bg-[#1a3a32] opacity-90 top-0 left-0 w-full h-12 md:top-0 md:left-0 md:w-16 md:h-full md:rounded-r-full" />
          <img
            src={official.image_url ?? "https://via.placeholder.com/400x500"}
            className="absolute inset-0 w-full h-full object-cover object-top"
            alt={official.name}
          />
          <div className="absolute bottom-0 left-0 w-full px-6 py-5 pt-16 bg-gradient-to-t from-[#1a3a32] via-[#1a3a32]/70 to-transparent z-20">
            <h3 className="text-white font-bold text-base sm:text-lg tracking-wide leading-tight">{official.name}</h3>
            <p className="text-[#C5A059] font-black text-[10px] uppercase tracking-[0.2em] mt-1">{official.designation}</p>
          </div>
        </div>

        <div className="relative flex-1 p-6 sm:p-10 overflow-y-auto bg-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all z-10">
            <X size={20} />
          </button>

          <div className="max-w-xl mx-auto space-y-6 pt-2">
            <header className="text-center space-y-1 pb-2">
              <p className="text-[#1a3a32] font-bold text-[10px] uppercase tracking-[0.4em]">Republic of Kenya</p>
              <h2 className="text-[#1a3a32] font-black text-[11px] uppercase italic">Office of the Registrar</h2>
            </header>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-serif italic text-slate-800">Communication,</h1>
              <div className="text-slate-700 leading-relaxed text-sm sm:text-base font-serif whitespace-pre-line">
                {official.mandate_body ?? "Official registry guidance and administrative communication."}
              </div>
            </div>

            <footer className="pt-6 border-t border-slate-200 flex justify-between items-end">
              <div>
                <p className="font-serif italic text-base text-[#1a3a32]">{official.designation}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{official.name}</p>
              </div>
              <ShieldCheck size={20} className="text-[#1a3a32] opacity-30" />
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── MAIN REGISTRAR INFO COMPONENT ── */
const RegistrarInfo: React.FC = () => {
  const dispatch = useAppDispatch();
  const { officials, faqs, mandates, loading } = useAppSelector((state) => state.court);

  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [selectedOfficial, setSelectedOfficial] = useState<ICourtOfficial | null>(null);
  const [selectedMandate, setSelectedMandate] = useState<IMandate | null>(null);

  useEffect(() => { 
    dispatch(fetchCourtData()); 
  }, [dispatch]);

  const primaryMandate = mandates.find((m) => m.is_primary) || mandates[0];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#1a3a32]" />
        <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.5em]">Loading Registry Information</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* HERO / HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-10 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-[#1a3a32]" />
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1a3a32] italic">The Office of the Registrar</h1>
        <p className="text-slate-400 text-xs mt-2 tracking-wide uppercase font-bold">High Court of Kenya • Administrative Oversight</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REGISTRY LEADERSHIP */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Gavel size={16} className="text-[#1a3a32]" />
            <h2 className="font-bold text-xs uppercase tracking-widest text-[#1a3a32]">Registry Leadership</h2>
          </div>
          <div className="p-5 space-y-4 flex-1">
            {officials.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-xs italic">No officials currently listed.</p>
            ) : officials.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOfficial(o as ICourtOfficial)}
                className="group flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-[#1a3a32]/30 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-[#C5A059] flex-shrink-0">
                  {o.image_url ? (
                    <img src={o.image_url} alt={o.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-[#1a3a32]">
                      {o.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-[#1a3a32] text-sm truncate">{o.name}</h3>
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest truncate">{o.designation}</p>
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-[#1a3a32] transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* REGISTRY MANDATE */}
        <section className="bg-[#1a3a32] rounded-2xl shadow-xl overflow-hidden flex flex-col text-white">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Info size={16} className="text-[#C5A059]" />
            <h2 className="font-bold text-xs uppercase tracking-[0.2em] text-[#C5A059]">Registry Mandate</h2>
          </div>
          <div className="p-8 flex flex-col flex-1 gap-6">
            <div className="space-y-4">
              <h3 className="font-serif italic text-2xl text-white">
                {primaryMandate?.title || "Administrative Authority"}
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed line-clamp-6 font-serif">
                {primaryMandate?.detail || "The Registrar provides essential administrative support to the High Court, ensuring the efficient movement of documents and files."}
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedMandate(primaryMandate as IMandate)}
              className="mt-auto w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              <FileText size={16} className="text-[#C5A059]" />
              <span className="text-[11px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Read Detailed Mandate
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* FAQ SECTION */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <BookOpen size={16} className="text-[#1a3a32]" />
          <h2 className="font-bold text-xs uppercase tracking-widest text-[#1a3a32]">Registry & Procedure FAQs</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {faqs.map((faq) => (
            <div key={faq.id}>
              <button 
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} 
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors text-left gap-4"
              >
                <span className={`text-sm font-semibold ${openFaq === faq.id ? "text-[#1a3a32]" : "text-slate-700"}`}>
                  {faq.question}
                </span>
                <ChevronDown size={16} className={`transition-transform ${openFaq === faq.id ? "rotate-180 text-[#C5A059]" : "text-slate-300"}`} />
              </button>
              {openFaq === faq.id && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-slate-500 leading-relaxed border-l-2 border-[#C5A059] pl-4 font-serif">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* MODALS */}
      <OfficialMessageModal 
        isOpen={!!selectedOfficial} 
        onClose={() => setSelectedOfficial(null)} 
        official={selectedOfficial} 
      />
      <MandateModal 
        isOpen={!!selectedMandate} 
        onClose={() => setSelectedMandate(null)} 
        mandate={selectedMandate} 
      />
    </div>
  );
};

export default RegistrarInfo;