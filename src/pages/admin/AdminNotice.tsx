import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, Edit3, Search, X,
  Megaphone, Loader2, CheckCircle, AlertTriangle, Paperclip, FileText
} from "lucide-react";
import { 
  adminFetchNotices, 
  createNotice,
  updateNotice,
  clearNoticeMessage 
} from "../../redux/slices/noticeSlice";
import type { AppDispatch, RootState } from "../../redux/store";
import type { IAdminNotice, ICreateNoticeRequest, NoticeCategory } from "../../interfaces/notices.interface";

const AdminNotice = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { adminNotices, loading, message, error } = useSelector((state: RootState) => state.notices);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<IAdminNotice | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ICreateNoticeRequest>({
    title: "",
    body: "", 
    category: "INFO",
  });

  useEffect(() => {
    dispatch(adminFetchNotices());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => dispatch(clearNoticeMessage()), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleOpenModal = (notice?: IAdminNotice) => {
    setSelectedFile(null);
    if (notice) {
      const noticeWithBody = notice as IAdminNotice & { body?: string };
      setEditingNotice(notice);
      setFormData({ 
        title: notice.title, 
        body: noticeWithBody.body || "", 
        category: notice.category || "INFO" 
      });
    } else {
      setEditingNotice(null);
      setFormData({ title: "", body: "", category: "INFO" });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("body", formData.body);
    data.append("category", formData.category);
    if (selectedFile) {
      data.append("file", selectedFile);
    }

    if (editingNotice) {
      await dispatch(updateNotice({ id: editingNotice.id, formData: data }));
    } else {
      await dispatch(createNotice(data));
    }
    
    if (!error) setIsModalOpen(false);
  };

  const filteredNotices = adminNotices.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#1a3a2a]">Notice Management</h1>
          <p className="text-sm text-stone-500">Official Communication Hub for the High Court of Kenya.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#C9922A] hover:bg-[#b07d20] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} />
          Create New Notice
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl">
          <CheckCircle size={18} />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text"
              placeholder="Search by title..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-200">
                <th className="px-6 py-4">Notice Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Engagement</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredNotices.map((notice) => (
                <tr key={notice.id} className="group hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Megaphone size={16} className="text-[#C9922A]" />
                      <span className="text-sm font-bold text-stone-800 line-clamp-1">{notice.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-stone-100 text-[9px] font-black text-stone-600 uppercase tracking-widest border border-stone-200">
                      {notice.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-stone-500">{notice.read_count} Views</span>
                      <div className="w-24 h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1a3a2a]" style={{ width: `${Math.min(100, (notice.read_count / 100) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${notice.is_active ? 'text-emerald-600' : 'text-stone-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${notice.is_active ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      {notice.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(notice)} className="p-2 text-stone-400 hover:text-[#1a3a2a] rounded-lg transition-all">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 className="font-serif font-bold text-[#1a3a2a] text-lg">
                {editingNotice ? "Update Official Notice" : "Draft New Notice"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 p-1"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">Notice Title</label>
                  <input 
                    required type="text"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9922A]/20 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">Category</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as NoticeCategory })}
                  >
                    <option value="INFO">Information</option>
                    <option value="URGENT">Urgent</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="WELCOME">Welcome</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">Attachment (Optional)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:border-[#C9922A] hover:bg-stone-100/50 transition-all"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.mp4,.mov"
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-2 text-[#1a3a2a]">
                        <FileText size={18} />
                        <span className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                        <X size={14} className="text-red-500" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-stone-400">
                        <Paperclip size={18} />
                        <span className="text-xs font-medium">Click to upload Document, Image, or Video</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">Communication Body</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none resize-none"
                    value={formData.body}
                    onChange={(e) => setFormData({...formData, body: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold text-sm">Cancel</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-[#1a3a2a] text-white px-4 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {editingNotice ? "Save Changes" : "Publish Communication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotice;