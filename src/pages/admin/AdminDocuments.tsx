import React, { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { 
  fetchDocuments, 
  deleteDocument, 
  uploadDocument, 
  clearDocumentStatus 
} from "../../redux/slices/documentsSlice";
import { 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  FilePlus, 
  Loader2,
  BookOpen, // Added for Tab Icon
  Table as TableIcon // Added for Tab Icon
} from "lucide-react";
import { format } from "date-fns";
import type { ICreateDocumentPayload, IDocument } from "../../interfaces/documents.interface";
import ProgramFlipbook from "../judge/ProgramFlipbook";
import PreviewModal from "../PreviewModal";

type UploadFormState = Omit<ICreateDocumentPayload, 'file'> & { file: File | null };

const AdminDocuments = () => {
  const dispatch = useAppDispatch();
  const { documents, loading, uploading, success } = useAppSelector((state) => state.documents);
  
  // Tab State: 'registry' or 'handbook'
  const [activeTab, setActiveTab] = useState<"registry" | "handbook">("registry");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);

  const [uploadData, setUploadData] = useState<UploadFormState>({
    title: "",
    description: "",
    document_type: "GENERAL",
    file: null,
  });

  useEffect(() => {
    dispatch(fetchDocuments({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  useEffect(() => {
    if (success) {
      const resetForm = () => {
        setIsUploadModalOpen(false);
        setUploadData({ title: "", description: "", document_type: "GENERAL", file: null });
        dispatch(clearDocumentStatus());
      };
      const timer = setTimeout(resetForm, 0);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadData.file && uploadData.title) {
      dispatch(uploadDocument(uploadData as ICreateDocumentPayload));
    }
  };

  const handleDelete = useCallback((id: number) => {
    if (window.confirm("Permanently remove this judicial record from the registry?")) {
      dispatch(deleteDocument(id));
    }
  }, [dispatch]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#f9faf9] min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1a3a32] border-b-4 border-[#c2a336] inline-block">
            ORHC DOCUMENTS
          </h1>
          <p className="text-[10px] text-[#5c7a6b] font-black uppercase tracking-[0.2em] mt-2">
            Office of the Registrar High Court • Secure Registry
          </p>
        </div>
        
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-[#1a3a32] hover:bg-[#25443c] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1a3a32]/20 transition-all active:scale-95 text-sm"
        >
          <FilePlus size={18} />
          Add New Document
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-1 mb-6 bg-[#e8ede9]/50 p-1 rounded-2xl w-fit border border-[#e2e8e4]">
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "registry" 
            ? "bg-white text-[#1a3a32] shadow-sm border border-[#c2a336]/20" 
            : "text-[#5c7a6b] hover:bg-white/50"
          }`}
        >
          <TableIcon size={14} />
          Registry Table
        </button>
        <button
          onClick={() => setActiveTab("handbook")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "handbook" 
            ? "bg-white text-[#1a3a32] shadow-sm border border-[#c2a336]/20" 
            : "text-[#5c7a6b] hover:bg-white/50"
          }`}
        >
          <BookOpen size={14} />
          Information Handbook
        </button>
      </div>

      {/* CONDITIONAL RENDERING BASED ON TAB */}
      {activeTab === "registry" ? (
        <>
          {/* SEARCH/FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c2a336]" size={18} />
              <input 
                type="text"
                placeholder="Search judicial records by title or ID..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e2e8e4] focus:ring-2 focus:ring-[#c2a336]/20 focus:border-[#c2a336] outline-none text-sm transition-all bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white rounded-2xl border border-[#e2e8e4] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f2]/50 font-serif">
                  <th className="px-6 py-4 text-[10px] font-black text-[#25443c] uppercase tracking-widest">Document Registry</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#25443c] uppercase tracking-widest">Classification</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#25443c] uppercase tracking-widest">Filing Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#25443c] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f2]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-[#c2a336]" size={32} />
                        <p className="text-[10px] font-bold text-[#5c7a6b] uppercase tracking-widest">Synchronizing Registry...</p>
                      </div>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-[#5c7a6b] italic text-sm">
                      No records matching the search criteria found.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#f9faf9] group transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-[#e8ede9] rounded-xl text-[#1a3a32] group-hover:bg-[#1a3a32] group-hover:text-white transition-colors">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold font-serif uppercase text-[#1a3a32] tracking-tight">{doc.title}</p>
                            <p className="text-[11px] text-[#5c7a6b] max-w-xs truncate mt-0.5">{doc.description || "No description provided."}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#f2f4f2] text-[#1a3a32] border border-[#c2a336]/20 uppercase tracking-tighter">
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-[#5c7a6b] font-medium">
                        {format(new Date(doc.created_at), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedDocument(doc)} 
                            title="Open in Chamber"
                            className="p-2 text-[#5c7a6b] hover:text-[#c2a336] hover:bg-[#c2a336]/10 rounded-lg transition-all"
                          >
                            <Eye size={20} />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id)} 
                            title="Purge Record"
                            className="p-2 text-[#5c7a6b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* FLIPBOOK VIEW */
        <div className="bg-white rounded-2xl border border-[#e2e8e4] shadow-sm overflow-hidden min-h-[700px]">
           <ProgramFlipbook />
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-[#1a3a32]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/20">
            <h2 className="text-xl font-bold font-serif text-[#1a3a32] mb-1">New Record</h2>
            <p className="text-xs text-[#5c7a6b] mb-8 uppercase tracking-widest font-medium">Upload Document to Cloud</p>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5c7a6b] uppercase tracking-widest ml-1">Document Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-[#e2e8e4] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#c2a336]/20 focus:border-[#c2a336] outline-none transition-all"
                  placeholder="e.g. Appointment Letter 2024"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5c7a6b] uppercase tracking-widest ml-1">File Attachment</label>
                <div className="relative border-2 border-dashed border-[#e2e8e4] rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                   <input 
                    required
                    type="file" 
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#1a3a32] file:text-white hover:file:bg-[#25443c] cursor-pointer"
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files ? e.target.files[0] : null})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)} 
                  className="flex-1 py-3 text-xs font-black uppercase text-[#5c7a6b] tracking-widest hover:bg-gray-50 rounded-xl transition-all"
                >
                  Discard
                </button>
                <button 
                  disabled={uploading || !uploadData.file}
                  type="submit" 
                  className="flex-1 bg-[#c2a336] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#c2a336]/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  {uploading ? "Securing..." : "Commit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURE PREVIEW MODAL */}
      {selectedDocument && (
        <PreviewModal
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)} 
        />
      )}
    </div>
  );
};

export default AdminDocuments;