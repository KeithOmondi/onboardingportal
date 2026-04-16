import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchDocuments, deleteDocument, clearDocumentStatus } from "../../redux/slices/documentsSlice";
import { Search, FileText, Trash2, Eye, Calendar, FileSearch, Loader2 } from "lucide-react";
import { format } from "date-fns";
import api from "../../api/api"; 
import type { IDocument } from "../../interfaces/documents.interface";
import PreviewModal from "../PreviewModal";
import axios, { AxiosError } from "axios";

const JudgesDocuments = () => {
  const dispatch = useAppDispatch();
  const { documents, loading, success } = useAppSelector((state) => state.documents);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isFetchingBlob, setIsFetchingBlob] = useState(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    dispatch(fetchDocuments({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  // 2. Success Status Cleanup
  useEffect(() => {
    if (success) {
      dispatch(clearDocumentStatus());
    }
  }, [success, dispatch]);

  /**
   * Handles secure document retrieval via proxy
   */
  const handleViewDocument = async (doc: IDocument) => {
    console.log(`[Registry] Initiating secure view for Document ID: ${doc.id}`);
    setSelectedDocument(doc);
    setBlobUrl(null);
    setIsFetchingBlob(true);
    
    try {
      const response = await api.get(`/documents/view/${doc.id}`, {
        responseType: 'blob' 
      });

      console.log("[Registry] Stream received. Type:", response.data.type);

      // Handle cases where the backend returns a JSON error wrapped in a Blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || "Unauthorized access to judicial record");
      }

      const fileType = response.data.type || doc.mime_type || 'application/pdf';
      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      
      console.log("[Registry] Blob URL generated successfully");
      setBlobUrl(url);

    } catch (err: unknown) {
      console.error("[Registry] Document Load Error:", err);
      
      let errorMessage = "Failed to retrieve record.";

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message: string }>;
        errorMessage = axiosError.response?.data?.message || axiosError.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
        
      alert(`Access Denied: ${errorMessage}`);
      setSelectedDocument(null);
    } finally {
      setIsFetchingBlob(false);
    }
  };

  /**
   * Cleanup resources when closing the viewer
   */
  const closeViewer = () => {
    if (blobUrl) {
      console.log("[Registry] Revoking Blob URL to free memory");
      window.URL.revokeObjectURL(blobUrl);
    }
    setBlobUrl(null);
    setSelectedDocument(null);
  };

  const handleDelete = useCallback((id: number) => {
    if (window.confirm("Are you sure you want to remove this record from the registry?")) {
      console.log(`[Registry] Deleting document ID: ${id}`);
      dispatch(deleteDocument(id));
    }
  }, [dispatch]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#f9faf9] min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-serif text-[#1a3a32] border-b-4 border-[#c2a336] inline-block uppercase tracking-tight">
          Judicial Document Registry
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c2a336]" size={18} />
          <input 
            type="text"
            placeholder="Search by case title or keywords..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e2e8e4] focus:ring-2 focus:ring-[#c2a336] outline-none text-sm shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5c7a6b]">
          <FileSearch size={48} className="mb-4 opacity-20" />
          <p className="italic">No records match your current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-[#e2e8e4] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group flex gap-4 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-[#e8ede9] rounded-xl flex items-center justify-center text-[#1a3a32]">
                <FileText size={32} />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f2f4f2] text-[#1a3a32] border border-[#c2a336]/20 uppercase">
                    {doc.document_type}
                  </span>
                  <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleViewDocument(doc)} 
                      disabled={isFetchingBlob}
                      className="p-1.5 text-[#5c7a6b] hover:text-[#c2a336] disabled:opacity-50"
                    >
                      {isFetchingBlob && selectedDocument?.id === doc.id ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-[#5c7a6b] hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-md font-bold font-serif uppercase text-[#1a3a32] mt-1 line-clamp-1">{doc.title}</h3>
                <div className="flex items-center text-[11px] text-[#5c7a6b] mt-2">
                  <Calendar size={12} className="mr-1" />
                  Filed: {format(new Date(doc.created_at), "PPP")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedDocument && (
        <PreviewModal 
          document={selectedDocument}
          blobUrl={blobUrl}
          onClose={closeViewer}
        />
      )}
    </div>
  );
};

export default JudgesDocuments;