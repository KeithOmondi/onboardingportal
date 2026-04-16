import React, { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchDocuments, deleteDocument, uploadDocument, clearDocumentStatus } from "../../redux/slices/documentsSlice";
import { Search, FileText, Trash2, Eye, FilePlus, X } from "lucide-react";
import { format } from "date-fns";
import type { ICreateDocumentPayload, IDocument } from "../../interfaces/documents.interface";

// Define a type for our local form state that allows the file to be null initially
type UploadFormState = Omit<ICreateDocumentPayload, 'file'> & { file: File | null };

const SuperAdminDocuments = () => {
  const dispatch = useAppDispatch();
  const { documents, loading, uploading, success } = useAppSelector((state) => state.documents);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);

  const [uploadData, setUploadData] = useState<UploadFormState>({
    title: "",
    description: "",
    document_type: "GENERAL",
    file: null,
  });

  // 1. Fetching logic
  useEffect(() => {
    dispatch(fetchDocuments({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  // 2. Optimized Success Handling
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
    if (window.confirm("Permanently remove this document?")) {
      dispatch(deleteDocument(id));
    }
  }, [dispatch]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#f9faf9] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1a3a32] border-b-4 border-[#c2a336] inline-block">
            ORHC DOCUMENTS
          </h1>
          <p className="text-sm text-[#5c7a6b] font-serif mt-1">High Court Onboarding Portal.</p>
        </div>
        
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-[#1a3a32] hover:bg-[#25443c] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95"
        >
          <FilePlus size={18} />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c2a336]" size={18} />
          <input 
            type="text"
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e8e4] focus:ring-2 focus:ring-[#c2a336] outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8e4] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f4f2] font-serif">
              <th className="px-6 py-4 text-[11px] font-bold text-[#25443c] uppercase tracking-widest">Document</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#25443c] uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#25443c] uppercase tracking-widest">Uploaded Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#25443c] uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f2]">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center animate-pulse text-[#5c7a6b]">Fetching Data...</td></tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#f9faf9] group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#e8ede9] rounded-lg text-[#1a3a32]">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-serif uppercase text-[#1a3a32]">{doc.title}</p>
                        <p className="text-[11px] text-[#5c7a6b] max-w-xs truncate">{doc.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f2f4f2] text-[#1a3a32] border border-[#c2a336]/20">
                      {doc.document_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#5c7a6b]">
                    {format(new Date(doc.created_at), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setSelectedDocument(doc)} 
                        className="p-2 text-[#5c7a6b] hover:text-[#c2a336]"
                      >
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-2 text-[#5c7a6b] hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-[#1a3a32]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-[#e2e8e4]">
            <h2 className="text-xl font-bold text-[#1a3a32] mb-6">New Judicial Record</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#5c7a6b] uppercase tracking-wider">Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full border border-[#e2e8e4] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#c2a336] outline-none"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#5c7a6b] uppercase tracking-wider">File Attachment</label>
                <input 
                  required
                  type="file" 
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#e8ede9] file:text-[#1a3a32] hover:file:bg-[#d1ddd3]"
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files ? e.target.files[0] : null})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-[#5c7a6b]">
                  Cancel
                </button>
                <button 
                  disabled={uploading}
                  type="submit" 
                  className="flex-1 bg-[#c2a336] text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-opacity"
                >
                  {uploading ? "Uploading..." : "Record Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 md:p-10">
          <div className="bg-white rounded-2xl w-full h-full max-w-5xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#e2e8e4] flex items-center justify-between bg-[#f9faf9]">
              <div>
                <h2 className="text-lg font-bold text-[#1a3a32]">{selectedDocument.title}</h2>
                <p className="text-xs text-[#5c7a6b]">{selectedDocument.document_type} — Filed on {format(new Date(selectedDocument.created_at), "PPP")}</p>
              </div>
              <button 
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center">
              {selectedDocument.mime_type?.startsWith("image/") ? (
                <img 
                  src={selectedDocument.file_url} 
                  alt={selectedDocument.title} 
                  className="max-w-full max-h-full object-contain p-4"
                />
              ) : (
                <iframe 
                  src={selectedDocument.file_url} 
                  className="w-full h-full border-none bg-white"
                  title="Document Preview"
                />
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-[#e2e8e4] flex justify-end gap-3">
              <a 
                href={selectedDocument.file_url} 
                download 
                target="_blank"
                rel="noreferrer"
                className="bg-[#1a3a32] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#25443c] transition-all"
              >
                Download Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDocuments;