import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Bell, CheckCircle2, Gavel, Loader2,
  ExternalLink, FileText, Image as ImageIcon, Video,
  Calendar, ChevronDown, ChevronUp, User, AlertTriangle, Clock, Info
} from "lucide-react";
import { fetchNotices, markAsRead } from "../../redux/slices/noticeSlice";
import type { AppDispatch, RootState } from "../../redux/store";
import type { INotice } from "../../interfaces/notices.interface";

const categoryMeta: Record<INotice["category"], {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}> = {
  WELCOME: {
    label: "Welcome",
    icon: <User size={13} />,
    bg: "bg-[#f2f4f2]",
    text: "text-[#1a3a32]",
    border: "border-[#1a3a32]/10",
  },
  URGENT: {
    label: "Urgent",
    icon: <AlertTriangle size={13} />,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
  },
  DEADLINE: {
    label: "Deadline",
    icon: <Clock size={13} />,
    bg: "bg-[#fffbeb]",
    text: "text-[#c2a336]",
    border: "border-[#c2a336]/20",
  },
  INFO: {
    label: "Information",
    icon: <Info size={13} />,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
  },
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }) : "N/A";

const JudgeNotice = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notices, unreadCount, loading } = useSelector((state: RootState) => state.notices);
  
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchNotices());
  }, [dispatch]);

  const handleExpand = (id: number, isRead: boolean) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (!isRead) {
      dispatch(markAsRead(id));
    }
  };

  const getFileMetadata = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return { type: 'image', icon: <ImageIcon size={14} /> };
    if (['mp4', 'mov', 'webm', 'm3u8'].includes(extension || '')) return { type: 'video', icon: <Video size={14} /> };
    return { type: 'doc', icon: <FileText size={14} /> };
  };

  if (loading && notices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-[#f9faf9]">
        <Loader2 className="animate-spin text-[#c2a336]" size={32} />
        <p className="text-sm font-medium text-[#1a3a32]">Retrieving Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6 bg-[#f9faf9] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#c2a336]/30">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-[#1a3a32] rounded-lg">
               <Gavel size={22} className="text-[#c2a336]" />
            </div>
            <h1 className="text-3xl font-serif uppercase font-bold tracking-tight text-[#1a3a32]">
              orhc notice board
            </h1>
          </div>
          <p className="text-xs text-[#5c7a6b] font-serif font-bold uppercase tracking-widest ml-1">
            office of the registrar • High Court of Kenya
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a3a32] border border-[#c2a336] shadow-md transition-transform hover:scale-105">
            <Bell size={14} className="text-[#c2a336] animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-white">
              {unreadCount} New Update{unreadCount === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* Notice Feed */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#1a3a32]/10 shadow-sm">
             <Info size={40} className="mx-auto text-[#c2a336]/30 mb-4" />
             <p className="text-[#5c7a6b] font-medium">No official notices found at this time.</p>
          </div>
        ) : (
          notices.map((notice) => {
            const meta = categoryMeta[notice.category];
            const isExpanded = expandedId === notice.id;
            const isRead = notice.is_read;

            return (
              <div
                key={notice.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${
                  !isRead ? "shadow-md border-l-4 border-l-[#c2a336]" : "border-[#1a3a32]/10"
                }`}
              >
                <button
                  onClick={() => handleExpand(notice.id, isRead)}
                  className={`w-full flex items-center justify-between gap-4 p-5 text-left transition-colors ${
                    isExpanded ? "bg-[#f2f4f2]/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {!isRead ? (
                        <div className="w-3 h-3 rounded-full bg-[#c2a336] shadow-[0_0_10px_#c2a336]" />
                      ) : (
                        <CheckCircle2 size={18} className="text-[#1a3a32]/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[#5c7a6b] font-bold">
                          <Calendar size={12} className="text-[#c2a336]" />
                          {formatDate(notice.created_at)}
                        </span>
                      </div>
                      <p className={`text-base font-bold ${!isRead ? "text-[#1a3a32]" : "text-[#5c7a6b]"}`}>
                        {notice.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-[#c2a336]">
                    {isExpanded ? <ChevronUp size={20} strokeWidth={3} /> : <ChevronDown size={20} strokeWidth={3} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-[#1a3a32]/5 bg-white">
                    <div className="pt-6">
                      <p className="text-[15px] text-[#1a3a32] leading-relaxed whitespace-pre-wrap font-medium">
                        {notice.body}
                      </p>
                    </div>

                    {notice.attachment_url && (
                      <div className="mt-6 p-4 bg-[#f9faf9] rounded-xl border border-[#1a3a32]/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-[#1a3a32]">
                            {getFileMetadata(notice.attachment_url).icon}
                          </div>
                          <a 
                            href={notice.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-[#c2a336] hover:text-[#1a3a32] flex items-center gap-1 transition-colors"
                          >
                            Open Original <ExternalLink size={12} />
                          </a>
                        </div>

                        {getFileMetadata(notice.attachment_url).type === 'image' ? (
                          <img 
                            src={notice.attachment_url} 
                            alt="Judicial notice attachment" 
                            className="rounded-lg max-h-80 w-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : getFileMetadata(notice.attachment_url).type === 'video' ? (
                          <video 
                            src={notice.attachment_url} 
                            controls 
                            className="rounded-lg w-full max-h-80 bg-[#1a3a32]"
                          />
                        ) : (
                          <div className="flex items-center gap-4 p-4 bg-white border border-[#1a3a32]/10 rounded-lg shadow-sm">
                            <div className="p-3 bg-[#f2f4f2] rounded-lg">
                               <FileText className="text-[#1a3a32]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] text-[#5c7a6b] font-medium uppercase">Format: PDF / Digital Document</p>
                            </div>
                            <a 
                              href={notice.attachment_url} 
                              download 
                              className="px-4 py-2 bg-[#1a3a32] text-[#c2a336] rounded-lg text-xs font-bold hover:bg-[#25443c] transition-colors shadow-sm"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-8 pt-5 border-t border-[#1a3a32]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Gavel size={14} className="text-[#c2a336]" />
                        <p className="text-[10px] text-[#5c7a6b] font-black uppercase tracking-widest">
                          office of the registrar high court
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#1a3a32]">
                        <span className="px-2 py-1 bg-[#f2f4f2] rounded">Author: {notice.author}</span>
                        <span className="font-mono bg-[#1a3a32] text-[#c2a336] px-2 py-1 rounded">
                          REF: #{notice.id.toString().padStart(5, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JudgeNotice;