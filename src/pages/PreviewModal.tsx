import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileText, X, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import type { IDocument } from "../interfaces/documents.interface";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchStreamFile, revokeBlobUrl } from "../redux/slices/streamSlice";

interface PreviewModalProps {
  document: IDocument;
  onClose: () => void;
}

const PreviewModal = ({ document, onClose }: PreviewModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  
  const { blobUrl, loading, error } = useSelector(
    (state: RootState) => state.streamFile
  );

  useEffect(() => {
    if (document.id) {
      dispatch(fetchStreamFile(String(document.id)));
    }

    // Security: Handle window focus to prevent screen captures/snips
    const handleBlur = () => setIsWindowFocused(false);
    const handleFocus = () => setIsWindowFocused(true);
    const preventCapture = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p")) {
        e.preventDefault();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("keydown", preventCapture);

    return () => {
      dispatch(revokeBlobUrl());
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keydown", preventCapture);
    };
  }, [dispatch, document.id]);

  return (
    <div className="fixed inset-0 bg-[#1a3a32]/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl w-full h-full max-w-6xl flex flex-col shadow-2xl overflow-hidden border border-white/20 relative">
        
        {/* Anti-Screenshot Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] flex flex-wrap gap-20 p-10 rotate-12 overflow-hidden uppercase font-black text-64 text-black">
          {Array(20).fill(0).map((_, i) => (
            <span key={i}>JUDICIAL RECORD - DO NOT COPY</span>
          ))}
        </div>

        {/* Header */}
        <div className="p-5 border-b border-[#e2e8e4] flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#f2f4f2] rounded-lg text-[#1a3a32]">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1a3a32] leading-tight uppercase">
                {document.title}
              </h2>
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-[#c2a336]" />
                <p className="text-xs text-[#c2a336] font-bold uppercase tracking-widest">
                  Secure Viewing Mode
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-red-600 rounded-full transition-all"
          >
            <X size={28} />
          </button>
        </div>

        {/* Viewer Content */}
        <div className={`flex-1 bg-[#ebeceb] flex items-center justify-center relative transition-all duration-500 ${!isWindowFocused ? 'blur-2xl grayscale' : ''}`}>
          
          {/* Security Alert for Focus Loss */}
          {!isWindowFocused && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/40 text-white font-bold p-10 text-center">
              <p className="bg-red-600 px-6 py-3 rounded-full shadow-2xl animate-pulse">
                VIEWER LOCKED: Please return focus to the window to view.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#c2a336]" size={40} />
              <p className="text-[#1a3a32] font-medium">Encrypting Stream...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertCircle className="text-red-500" size={48} />
              <h3 className="text-lg font-bold text-gray-800 font-serif uppercase">Access Denied</h3>
              <p className="text-gray-600 max-w-md">{error}</p>
              <button 
                onClick={onClose}
                className="mt-2 px-8 py-3 bg-[#1a3a32] text-white rounded-xl hover:bg-[#264d42] transition-all text-xs font-black uppercase tracking-widest"
              >
                Close Connection
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <div className="w-full h-full flex items-center justify-center p-6">
              {document.mime_type?.startsWith("image/") ? (
                <img
                  src={blobUrl}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in duration-500"
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full border-none bg-white shadow-2xl rounded-lg"
                  title="Secure System Viewer"
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer - No Download Button */}
        <div className="p-4 bg-[#f9faf9] border-t border-[#e2e8e4] flex justify-between items-center relative z-10">
          <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Electronic copy for viewing only.
          </p>
          <p className="text-[9px] font-serif text-[#5c7a6b] uppercase tracking-[0.2em]">
            OFFICE OF THE REGISTRAR HIGH COURT
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;