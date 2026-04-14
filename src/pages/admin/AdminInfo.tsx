import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Pencil, Gavel, BookOpen, Upload,
  Plus, Scale, Loader2, ChevronDown, ChevronUp, X, Eye
} from "lucide-react";
import { fetchCourtData, createOfficial, createFaq, createMandate } from "../../redux/slices/courtSlice";
import type { AppDispatch, RootState } from "../../redux/store";

/* ── SHARED MODAL COMPONENT ── */
const AdminModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-xs uppercase tracking-widest text-[#355E3B]">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const AdminInfo = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { officials, faqs, mandates, loading, error } = useSelector(
    (state: RootState) => state.court
  );

  const [showFaqForm, setShowFaqForm] = useState(false);
  const [showMandateForm, setShowMandateForm] = useState(false);
  const [showOfficialForm, setShowOfficialForm] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Modal States
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingMandate, setViewingMandate] = useState<{title: string, detail: string} | null>(null);

  const [officialForm, setOfficialForm] = useState({ name: "", designation: "", mandate_body: "" });
  const [file, setFile] = useState<File | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [mandateForm, setMandateForm] = useState({ title: "", detail: "", is_primary: false });

  useEffect(() => { dispatch(fetchCourtData()); }, [dispatch]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handlePublishOfficial = async () => {
    const formData = new FormData();
    formData.append("name", officialForm.name);
    formData.append("designation", officialForm.designation);
    formData.append("mandate_body", officialForm.mandate_body);
    if (file) formData.append("portrait", file);
    const result = await dispatch(createOfficial(formData));
    if (createOfficial.fulfilled.match(result)) {
      setOfficialForm({ name: "", designation: "", mandate_body: "" });
      setFile(null);
      setShowOfficialForm(false);
    }
  };

  const handlePublishFaq = async () => {
    const result = await dispatch(createFaq(faqForm));
    if (createFaq.fulfilled.match(result)) {
      setFaqForm({ question: "", answer: "" });
      setShowFaqForm(false);
    }
  };

  const handlePublishMandate = async () => {
    const result = await dispatch(createMandate(mandateForm));
    if (createMandate.fulfilled.match(result)) {
      setMandateForm({ title: "", detail: "", is_primary: false });
      setShowMandateForm(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-700">

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
          ERROR: {error}
        </div>
      )}

      {/* ── HERO TITLE CARD ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-10 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-[#355E3B]" />
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#355E3B] italic">The High Court of Kenya</h1>
        <p className="text-slate-400 text-xs mt-2 tracking-wide">Established under Article 165 of the Constitution of Kenya.</p>
        {loading && <Loader2 className="animate-spin text-[#355E3B] absolute top-4 right-4" size={18} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT — Court Leadership */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel size={16} className="text-[#355E3B]" />
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#355E3B]">Court Leadership</h2>
            </div>
            <button onClick={() => setShowOfficialForm(!showOfficialForm)} className="text-[10px] font-black text-[#C5A059] border border-[#C5A059] px-3 py-1 rounded-full hover:bg-[#C5A059] hover:text-white transition-all">
              {showOfficialForm ? "CANCEL" : "+ ADD"}
            </button>
          </div>

          {showOfficialForm && (
            <div className="p-5 bg-slate-50 border-b border-slate-100 space-y-3 animate-in slide-in-from-top duration-300">
              <input value={officialForm.name} onChange={(e) => setOfficialForm({ ...officialForm, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-[#355E3B]" placeholder="Full name e.g. Hon. John Doe" />
              <input value={officialForm.designation} onChange={(e) => setOfficialForm({ ...officialForm, designation: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-[#355E3B]" placeholder="Designation e.g. Registrar" />
              <textarea value={officialForm.mandate_body} onChange={(e) => setOfficialForm({ ...officialForm, mandate_body: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm min-h-[80px] outline-none focus:border-[#355E3B] resize-none" placeholder="Official mandate or message..." />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <Upload size={13} className="text-[#C5A059]" />
                  {file ? <span className="text-emerald-600 truncate max-w-[120px]">{file.name}</span> : "Attach Portrait"}
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
                <button onClick={handlePublishOfficial} disabled={loading} className="bg-[#355E3B] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4b2f] disabled:opacity-50 shadow-lg transition-all">
                  {loading ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          )}

          <div className="p-5 space-y-4 flex-1">
            {officials.map((d) => (
              <div key={d.id} className="group flex gap-4 p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all bg-white">
                <div 
                  onClick={() => d.image_url && setPreviewImage(d.image_url)}
                  className="w-11 h-11 rounded-full bg-[#355E3B]/10 border border-[#C5A059]/30 overflow-hidden flex-shrink-0 cursor-pointer relative group/img"
                >
                  {d.image_url ? (
                    <>
                      <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye size={14} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#355E3B] font-bold text-sm">{d.name?.charAt(0) || "U"}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-[#355E3B] text-sm leading-tight">{d.name}</h3>
                      <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mt-0.5">{d.designation}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Pencil size={12} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-3 mt-2 line-clamp-2">"{d.mandate_body}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — Our Mandate */}
        <section className="bg-[#2d5233] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <Scale size={16} />
              <h2 className="font-bold text-xs uppercase tracking-[0.2em]">Our Mandate</h2>
            </div>
            <button onClick={() => setShowMandateForm(!showMandateForm)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <Plus size={16} className={`transition-transform duration-300 ${showMandateForm ? 'rotate-45 text-red-400' : 'text-white'}`} />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {showMandateForm && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 animate-in zoom-in-95 duration-200">
                <input value={mandateForm.title} onChange={(e) => setMandateForm({ ...mandateForm, title: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C5A059] placeholder:text-slate-400" placeholder="Pillar Title..." />
                <textarea value={mandateForm.detail} onChange={(e) => setMandateForm({ ...mandateForm, detail: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#C5A059] placeholder:text-slate-400 resize-none min-h-[70px]" placeholder="Description..." />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase cursor-pointer">
                    <input type="checkbox" checked={mandateForm.is_primary} onChange={(e) => setMandateForm({ ...mandateForm, is_primary: e.target.checked })} className="accent-[#C5A059]" />
                    Primary Pillar
                  </label>
                  <button onClick={handlePublishMandate} disabled={loading} className="bg-[#C5A059] text-slate-900 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-[#d4b06a] transition-colors">
                    {loading ? "Adding..." : "Add Pillar"}
                  </button>
                </div>
              </div>
            )}

            {mandates.map((m, idx) => (
              <div key={m.id} className={`group relative pl-4 border-l-2 ${m.is_primary ? 'border-emerald-400' : 'border-[#C5A059]/50'} py-1`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${m.is_primary ? 'text-emerald-400' : 'text-[#C5A059]'}`}>
                      {m.is_primary ? 'Primary Authority' : `Pillar ${idx + 1}`}
                    </p>
                    <h3 className="text-white font-serif italic text-sm mb-1 leading-snug">{m.title}</h3>
                    <p className="text-xs text-slate-300 leading-snug line-clamp-2">{m.detail}</p>
                    <button 
                      onClick={() => setViewingMandate({ title: m.title, detail: m.detail })}
                      className="text-[9px] text-[#C5A059] uppercase font-black mt-2 hover:underline"
                    >
                      View Full Detail
                    </button>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FAQs */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#355E3B]" />
            <h2 className="font-bold text-xs uppercase tracking-widest text-[#355E3B]">Frequently Asked Questions</h2>
          </div>
          <button onClick={() => setShowFaqForm(!showFaqForm)} className="text-[10px] font-black text-[#C5A059] border border-[#C5A059] px-3 py-1 rounded-full hover:bg-[#C5A059] transition-all">
            {showFaqForm ? "CANCEL" : "+ ADD FAQ"}
          </button>
        </div>

        {showFaqForm && (
          <div className="p-5 bg-slate-50 border-b border-slate-100 space-y-3 animate-in slide-in-from-top duration-300">
            <input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#355E3B]" placeholder="Question..." />
            <textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[90px] outline-none focus:border-[#355E3B] resize-none" placeholder="Answer..." />
            <button onClick={handlePublishFaq} disabled={loading} className="w-full bg-[#355E3B] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              {loading ? "Saving..." : "Save FAQ Entry"}
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-50">
          {faqs.map((f, idx) => (
            <div key={f.id} className="group">
              <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left gap-4" onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                <span className="text-sm font-semibold text-slate-800">{f.question}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => e.stopPropagation()} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Pencil size={13} /></button>
                  </div>
                  {expandedFaq === idx ? <ChevronUp size={16} className="text-[#355E3B]" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </button>
              {expandedFaq === idx && (
                <div className="px-6 pb-5 animate-in slide-in-from-top duration-200">
                  <p className="text-sm text-slate-500 leading-relaxed border-l-2 border-[#355E3B]/20 pl-4">{f.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── MODALS ── */}
      {/* Image Preview Modal */}
      <AdminModal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title="Portrait Preview">
        <div className="flex justify-center bg-slate-100 rounded-xl overflow-hidden p-2">
          <img src={previewImage || ""} alt="Preview" className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg" />
        </div>
      </AdminModal>

      {/* Mandate Detail Modal */}
      <AdminModal isOpen={!!viewingMandate} onClose={() => setViewingMandate(null)} title="Full Mandate Detail">
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-[#355E3B] italic">{viewingMandate?.title}</h3>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line font-serif">{viewingMandate?.detail}</p>
        </div>
      </AdminModal>

    </div>
  );
};

export default AdminInfo;