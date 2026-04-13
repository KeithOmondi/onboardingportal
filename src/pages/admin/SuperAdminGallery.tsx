import React, { useEffect, useState, useRef } from "react";
import { 
  Plus, Upload, Trash2, X, Loader2, 
  AlignLeft, FilePlus
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { 
  fetchAlbums, 
  createNewAlbum, 
  deleteAlbum, 
  clearGalleryMessage 
} from "../../redux/slices/gallerySlice";
import { type IGalleryAlbum } from "../../interfaces/gallery.interface";
import toast from "react-hot-toast";

const SuperAdminGallery = () => {
  const dispatch = useAppDispatch();
  const { albums, loading, message } = useAppSelector((state) => state.gallery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "", 
    description: "",
    event_date: "",
    location: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAlbums());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      toast.success(message);
      const timer = setTimeout(() => dispatch(clearGalleryMessage()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setThumbnail(selected);

    if (selected) {
      // Auto-fill title with filename if title is empty
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selected.name.split('.')[0] }));
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", category: "General", description: "", event_date: new Date().toISOString().split('T')[0], location: "Default" });
    setThumbnail(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbnail) return toast.error("Please select a cover image");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append("thumbnail", thumbnail);

    const result = await dispatch(createNewAlbum(data));
    
    if (createNewAlbum.fulfilled.match(result)) {
      setIsModalOpen(false);
      resetForm();
    }
  };

  return (
    <div className="p-8 bg-stone-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#1a3a2a] font-serif uppercase tracking-tight">
            Gallery Management
          </h1>
          <p className="text-stone-500 text-sm">Registry and Asset Control Panel</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1a3a2a] text-[#c2a336] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#2a4a3a] transition-all shadow-lg"
        >
          <Plus size={18} /> New Archive
        </button>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-[2rem] border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-stone-50/50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Registry Item</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {albums.map((album: IGalleryAlbum) => (
              <tr key={album.id} className="hover:bg-stone-50/80 transition-colors group">
                <td className="px-6 py-4 text-sm font-bold text-[#1a3a2a]">
                  <div className="flex items-center gap-4">
                    <img src={album.thumbnail_url} className="h-12 w-12 rounded-lg object-cover border border-stone-200" alt="" />
                    {album.title}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => window.confirm("Delete?") && dispatch(deleteAlbum(album.id))} className="text-stone-300 hover:text-red-600 p-2 transition-all">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1a3a2a]/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1a3a2a]/10 rounded-lg text-[#1a3a2a]">
                  <FilePlus size={20} />
                </div>
                <h2 className="text-xl font-black text-[#1a3a2a] uppercase tracking-tight">Register Archive</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-stone-200 text-stone-500 p-2 rounded-full hover:bg-stone-300"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              {/* HIDDEN LOGIC FIELDS (Prevents UI clutter but keeps API happy) */}
              <div className="hidden">
                <input name="title" value={formData.title} onChange={handleInputChange} />
                <input name="category" value={formData.category || "Archive"} onChange={handleInputChange} />
                <input name="event_date" value={formData.event_date || new Date().toISOString().split('T')[0]} onChange={handleInputChange} />
                <input name="location" value={formData.location || "Judiciary HQ"} onChange={handleInputChange} />
              </div>

              {/* 1. FILE UPLOAD BOX */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Asset Upload</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                    preview ? "border-[#1a3a2a] bg-white" : "border-stone-200 hover:border-[#c2a336] bg-stone-50/50"
                  }`}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-xl p-2" />
                  ) : (
                    <div className="text-center">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100 mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload size={24} className="text-stone-400 group-hover:text-[#c2a336]" />
                      </div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Drop cover asset here</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} accept="image/*" />
                </div>
              </div>

              {/* 2. DESCRIPTION BOX */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Registry Notes</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-stone-300"><AlignLeft size={16}/></span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#c2a336]/20 outline-none transition-all placeholder:text-stone-400 resize-none"
                    placeholder="Provide detailed information regarding this asset..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !thumbnail}
                className="w-full bg-[#1a3a2a] text-[#c2a336] py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:opacity-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Finalize Publication"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminGallery;