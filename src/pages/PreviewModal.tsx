import { FileText, X, Loader2 } from "lucide-react";
import type { IDocument } from "../interfaces/documents.interface";

interface PreviewModalProps {
  document: IDocument;
  blobUrl: string | null;
  onClose: () => void;
}

const PreviewModal = ({ document, blobUrl, onClose }: PreviewModalProps) => {
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
          {!blobUrl ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#c2a336]" size={40} />
              <p className="text-[#1a3a32] font-medium">
                Retrieving Secure Document...
              </p>
            </div>
          ) : document.mime_type?.startsWith("image/") ? (
            <img
              src={blobUrl}
              alt={document.title}
              className="max-w-full max-h-full object-contain shadow-2xl p-4"
            />
          ) : (
            <iframe
              src={`${blobUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-none bg-white shadow-inner"
              title="Judicial Viewer"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-[#e2e8e4] flex justify-between items-center">
          <p className="text-[10px] font-serif text-[#5c7a6b] hidden md:block uppercase tracking-[0.2em]">
            Registry of the High Court • Confidential Judicial Record
          </p>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold text-[#5c7a6b] hover:bg-gray-50 rounded-xl transition-colors"
            >
              Close Chamber
            </button>
            {blobUrl && (
              <a
                href={blobUrl}
                download={`${document.title}.pdf`}
                className="flex-1 md:flex-none bg-[#c2a336] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-[#b0922e] transition-all text-center"
              >
                Download Original
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;