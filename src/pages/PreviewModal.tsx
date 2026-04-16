import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileText, X, Loader2, AlertCircle, Download } from "lucide-react";
import type { IDocument } from "../interfaces/documents.interface";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchStreamFile, revokeBlobUrl } from "../redux/slices/streamSlice";

interface PreviewModalProps {
  document: IDocument;
  onClose: () => void;
}

const PreviewModal = ({ document, onClose }: PreviewModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Select state from the streamFile slice
  const { blobUrl, loading, error } = useSelector(
    (state: RootState) => state.streamFile
  );

  useEffect(() => {
    // 1. Trigger the secure stream fetch when modal opens
    // Converting number ID to string to resolve TS2345
    if (document.id) {
      dispatch(fetchStreamFile(String(document.id)));
    }

    // 2. Cleanup: Revoke the Blob URL when the component unmounts
    // This prevents memory leaks by freeing the blob from browser RAM
    return () => {
      dispatch(revokeBlobUrl());
    };
  }, [dispatch, document.id]);

  return (
    <div className="fixed inset-0 bg-[#1a3a32]/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full h-full max-w-6xl flex flex-col shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e2e8e4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#f2f4f2] rounded-lg text-[#1a3a32]">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-[#1a3a32] leading-tight uppercase">
                {document.title}
              </h2>
              <p className="text-xs text-[#5c7a6b] font-medium uppercase tracking-widest">
                {document.document_type}
              </p>
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
        <div className="flex-1 bg-[#ebeceb] flex items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#c2a336]" size={40} />
              <p className="text-[#1a3a32] font-medium">
                Retrieving Secure Document...
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertCircle className="text-red-500" size={48} />
              <h3 className="text-lg font-bold text-gray-800 font-serif">Access Restricted</h3>
              <p className="text-gray-600 max-w-md">{error}</p>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-[#1a3a32] text-white rounded-xl hover:bg-[#264d42] transition-colors text-sm font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {document.mime_type?.startsWith("image/") ? (
                <img
                  src={blobUrl}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain shadow-2xl p-4 animate-in fade-in zoom-in duration-300"
                />
              ) : (
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none bg-white shadow-inner"
                  title="Viewer"
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-[#e2e8e4] flex justify-between items-center">
          <p className="text-[10px] font-serif text-[#5c7a6b] hidden md:block uppercase tracking-[0.2em]">
            Office of the registrar high court • Document Preview
          </p>
          <div className="flex gap-4 w-full md:w-auto">
            
            {!loading && !error && blobUrl && (
              <a
                href={blobUrl}
                download={`${document.title.replace(/\s+/g, '_')}.pdf`}
                className="flex-1 md:flex-none bg-[#c2a336] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-[#b0922e] transition-all text-center"
              >
                <Download size={20}/>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;