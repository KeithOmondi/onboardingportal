import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchDocuments, deleteDocument, clearDocumentStatus } from "../../redux/slices/documentsSlice";
import { 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  Calendar, 
  FileSearch, 
  BookOpen, 
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import type { IDocument } from "../../interfaces/documents.interface";
import PreviewModal from "../PreviewModal";
import ProgramFlipbook from "./ProgramFlipbook";

const JudgesDocuments = () => {
  const dispatch = useAppDispatch();
  const { documents, loading, success } = useAppSelector((state) => state.documents);
  
  const [activeTab, setActiveTab] = useState<"grid" | "handbook">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);

  /**
   * SECURITY ENFORCEMENT
   * Disables Context Menu, Print, and Common Save shortcuts.
   */
  useEffect(() => {
    const preventActions = (e: KeyboardEvent) => {
      // Disable Ctrl+P (Print), Ctrl+S (Save), Ctrl+U (View Source)
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === "p" || e.key === "s" || e.key === "u")
      ) {
        e.preventDefault();
        alert("Action restricted: This document must remain within the system registry.");
      }
      
      // Disable PrintScreen / Snipping Tool triggers (Best effort)
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText(""); // Clear clipboard
        alert("Screenshots are disabled for judicial records.");
      }
    };

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", preventActions);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("keydown", preventActions);
      window.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  useEffect(() => {
    dispatch(fetchDocuments({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  useEffect(() => {
    if (success) {
      dispatch(clearDocumentStatus());
    }
  }, [success, dispatch]);

  const handleDelete = useCallback((id: number) => {
    if (window.confirm("Are you sure you want to remove this record from the registry?")) {
      dispatch(deleteDocument(id));
    }
  }, [dispatch]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#f9faf9] min-h-screen font-sans select-none">
      {/* CSS STYLES FOR SCREENSHOT PROTECTION 
          - print:hidden: Hides everything if a user manages to open the print dialog.
          - blur-on-focus: Optional: blurs content if the user switches apps.
      */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
        .no-select {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#1a3a32] border-b-4 border-[#c2a336] inline-block uppercase tracking-tight">
            DOCUMENTS
          </h1>
         
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-1 mb-8 bg-[#e8ede9]/50 p-1 rounded-2xl w-fit border border-[#e2e8e4]">
        <button
          onClick={() => setActiveTab("grid")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "grid" 
            ? "bg-white text-[#1a3a32] shadow-sm border border-[#c2a336]/20" 
            : "text-[#5c7a6b] hover:bg-white/50"
          }`}
        >
          <LayoutGrid size={14} />
          Documents
        </button>
        <button
          onClick={() => setActiveTab("handbook")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "handbook" 
            ? "bg-white text-[#1a3a32] shadow-sm border border-[#c2a336]/20" 
            : "text-[#5c7a6b] hover:bg-white/50"
          }`}
        >
          <BookOpen size={14} />
          Information Handbook
        </button>
      </div>

      {activeTab === "grid" ? (
        <>
          <div className="mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c2a336]" size={18} />
              <input 
                type="text"
                placeholder="Search by case title or keywords..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e2e8e4] focus:ring-2 focus:ring-[#c2a336] outline-none text-sm shadow-sm transition-all bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-select">
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
                          onClick={() => setSelectedDocument(doc)} 
                          className="p-1.5 text-[#5c7a6b] hover:text-[#c2a336]"
                          title="View only"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="p-1.5 text-[#5c7a6b] hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-md font-bold font-serif uppercase text-[#1a3a32] mt-1 line-clamp-1">
                      {doc.title}
                    </h3>
                    <div className="flex items-center text-[11px] text-[#5c7a6b] mt-2">
                      <Calendar size={12} className="mr-1" />
                      Filed: {format(new Date(doc.created_at), "PPP")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e2e8e4] shadow-sm overflow-hidden no-select">
           <ProgramFlipbook />
        </div>
      )}

      {selectedDocument && (
        <PreviewModal 
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default JudgesDocuments;