import { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  fetchGallery,
  createGalleryItem,
  deleteGalleryItem,
  clearGalleryStatus,
} from "../../redux/slices/gallerySlice";
import { MediaType } from "../../interfaces/gallery.interface";
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Film, 
  Filter, 
  Loader2, 
  AlignLeft,
  FilePlus
} from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminGallery = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error  } = useAppSelector((state) => state.gallery);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Handlers & Helpers ---

  const resetForm = useCallback(() => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return toast.error("File and Title are required");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    // Handle UI logic directly on resolution rather than relying on an effect
    const result = await dispatch(createGalleryItem(formData));
    
    if (createGalleryItem.fulfilled.match(result)) {
      toast.success("Asset successfully indexed in vault");
      resetForm();
      dispatch(clearGalleryStatus());
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

  // Initialization only
  useEffect(() => {
    dispatch(fetchGallery());
  }, [dispatch]);

  // Handle errors separately - still using Effect for external state (Redux) synchronization,
  // but we can wrap it to prevent the sync render cycle warning.
  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => {
        dispatch(clearGalleryStatus());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // --- 3. Derived State ---
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
        {/* UPLOAD PANEL */}
        <section className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-0">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-[#355E3B]/10 rounded-lg text-[#355E3B]">
                <FilePlus size={20} />
              </div>
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Register New Asset</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                  preview ? "border-[#355E3B] bg-white" : "border-slate-200 hover:border-[#355E3B] bg-slate-50/50"
                }`}
              >
                {preview ? (
                  <div className="w-full h-full p-2">
                    {file?.type.startsWith("video") ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden">
                        <Film size={40} className="text-white/20 z-10" />
                        <video className="absolute inset-0 w-full h-full object-cover opacity-60" src={preview} muted />
                      </div>
                    ) : (
                      <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-xl shadow-inner" />
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-slate-400 group-hover:text-[#355E3B]" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drop media here</p>
                    <p className="text-[9px] text-slate-300 mt-1 italic">JPG, PNG, WEBP or MP4</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" hidden onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPreview(reader.result as string);
                    reader.readAsDataURL(selected);
                  }
                }} accept="image/*,video/*" />
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
                    placeholder="Detailed Description (Optional)"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !file || !title.trim()}
                className="w-full bg-[#355E3B] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#355E3B]/20 hover:bg-[#2a4b2f] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Finalize Registration"}
              </button>
            </form>
          </div>
        </section>

        {/* GRID */}
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
                      <img src={item.file_url} alt={item.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                    )}

                    <div className="absolute top-4 left-4">
                      <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-md bg-white/90 text-[#355E3B]">
                        {item.file_type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-4 right-4 p-2.5 bg-white text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-[#1A2F1F] text-sm truncate uppercase mb-3">{item.title}</h3>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none mb-1">Created</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest leading-none mb-1">Registry ID</span>
                        <span className="text-[10px] text-slate-600 font-bold italic">#{item.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SuperAdminGallery;