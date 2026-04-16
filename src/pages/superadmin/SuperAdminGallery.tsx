import { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  fetchGallery,
  createGalleryItems,
  deleteGalleryItem,
  clearGalleryStatus,
} from "../../redux/slices/gallerySlice";
import { MediaType, type IGalleryItem } from "../../interfaces/gallery.interface";
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Film, 
  Filter, 
  Loader2, 
  AlignLeft,
  Maximize2,
  X,
  Files
} from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminGallery = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.gallery);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<string>("all");
  
  const [selectedAsset, setSelectedAsset] = useState<IGalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Handlers ---

  const resetForm = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setTitle("");
    setDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 10) {
      toast.error("Maximum 10 files allowed per batch");
      return;
    }
    setFiles(selectedFiles);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !title.trim()) {
      return toast.error("Please provide a Title and at least one File");
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    // Fix: Handle success logic locally to avoid "cascading render" effects
    try {
      const resultAction = await dispatch(createGalleryItems(formData));
      if (createGalleryItems.fulfilled.match(resultAction)) {
        toast.success(`${files.length} asset(s) successfully indexed`);
        resetForm();
        dispatch(clearGalleryStatus());
      }
    } catch {
      toast.error("An unexpected error occurred during upload");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Purge this media from the cloud and registry?")) return;
    const result = await dispatch(deleteGalleryItem(id));
    if (deleteGalleryItem.fulfilled.match(result)) {
      toast.success("Entry deleted");
    }
  };

  // --- 2. Effects ---

  useEffect(() => {
    dispatch(fetchGallery());
  }, [dispatch]);

  // Fix: Optimized Error effect to avoid synchronous cascading renders
  useEffect(() => {
    if (error) {
      toast.error(error);
      // We use a micro-task (setTimeout 0) to push the dispatch to the end of the event loop
      const timer = setTimeout(() => {
        dispatch(clearGalleryStatus());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedAsset(null); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const filteredItems = filter === "all" 
    ? items 
    : items.filter(item => item.file_type === filter);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] font-sans p-8 overflow-y-auto">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A2F1F] tracking-tight">
            Asset <span className="text-[#355E3B]">Management</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">
            Centralized Evidence & Media Control
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs font-bold text-slate-600 outline-none bg-transparent cursor-pointer uppercase tracking-wider"
            >
              <option value="all">View All Registry</option>
              <option value={MediaType.IMAGE}>Images Only</option>
              <option value={MediaType.VIDEO}>Videos Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-0">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-[#355E3B]/10 rounded-lg text-[#355E3B]">
                <Files size={20} />
              </div>
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Register Batch Assets</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl min-h-[14rem] flex flex-col items-center justify-center cursor-pointer transition-all group ${
                  previews.length > 0 ? "border-[#355E3B] bg-white" : "border-slate-200 hover:border-[#355E3B] bg-slate-50/50"
                }`}
              >
                {previews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 p-4 w-full">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        {files[idx]?.type.startsWith("video") ? (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Film size={16} className="text-white/40" />
                          </div>
                        ) : (
                          <img src={src} className="w-full h-full object-cover" alt="prev" />
                        )}
                      </div>
                    ))}
                    <div className="aspect-square flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 bg-slate-50">
                       <Upload size={14} />
                       <span className="text-[8px] mt-1 font-bold">ADD MORE</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-slate-400 group-hover:text-[#355E3B]" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select multiple files</p>
                    <p className="text-[9px] text-slate-300 mt-1 italic">Max 10 per upload</p>
                  </div>
                )}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  hidden 
                  onChange={handleFileChange}
                  accept="image/*,video/*" 
                />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><ImageIcon size={16}/></span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#355E3B]/20 outline-none transition-all placeholder:text-slate-400"
                    placeholder="Document Title"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-300"><AlignLeft size={16}/></span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#355E3B]/20 outline-none transition-all placeholder:text-slate-400 resize-none"
                    placeholder="Shared Description (Optional)"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || files.length === 0 || !title.trim()}
                className="w-full bg-[#355E3B] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#355E3B]/20 hover:bg-[#2a4b2f] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Processing Batch...</span>
                  </div>
                ) : (
                  `Register ${files.length > 0 ? files.length : ""} Asset(s)`
                )}
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-300">
              <Loader2 size={40} className="animate-spin mb-4 text-[#355E3B]/20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Syncing Secure Database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    {item.file_type === MediaType.VIDEO ? (
                      <video className="absolute inset-0 w-full h-full object-cover opacity-60" src={item.file_url} muted />
                    ) : (
                      <img src={item.file_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-md bg-white/90 text-[#355E3B]">
                        {item.file_type}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-[#1A2F1F]/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                      <button onClick={() => setSelectedAsset(item)} className="p-3 bg-white text-[#1A2F1F] rounded-full hover:scale-110 transition-transform shadow-xl"><Maximize2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-xl"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[#1A2F1F] text-sm truncate uppercase mb-1">{item.title}</h3>
                    <p className="text-[10px] text-slate-400 truncate mb-4 italic">{item.description || "No description"}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px]">
                      <span className="text-slate-500 font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="text-slate-600 font-bold italic">#{item.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A2F1F]/90 backdrop-blur-md" onClick={() => setSelectedAsset(null)} />
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="md:w-2/3 h-[50vh] md:h-full bg-slate-900 flex items-center justify-center">
              {selectedAsset.file_type === MediaType.VIDEO ? (
                <video controls autoPlay className="max-w-full max-h-full" src={selectedAsset.file_url} />
              ) : (
                <img src={selectedAsset.file_url} alt={selectedAsset.title} className="max-w-full max-h-full object-contain" />
              )}
            </div>
            <div className="md:w-1/3 p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-[#355E3B]/10 text-[#355E3B]">Resource</span>
                  <button onClick={() => setSelectedAsset(null)} className="p-2 text-slate-400"><X size={24} /></button>
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1A2F1F] uppercase mb-4">{selectedAsset.title}</h2>
                <p className="text-sm text-slate-600 italic">{selectedAsset.description || "No registry description."}</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="bg-[#355E3B] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminGallery;