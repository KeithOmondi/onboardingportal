import { LayoutDashboard, Scale, LogOut, Award, X, User, Book, Info, Camera } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface JudgeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const JudgeSidebar = ({ isOpen, onClose }: JudgeSidebarProps) => {
  const { pathname } = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/judge/dashboard" },
    { icon: <Info size={20} />, label: "High Court Information", path: "/judge/info" },
    { icon: <Book size={20} />, label: "Oath Information", path: "/judge/oath" },
    { icon: <User size={20} />, label: "Guest Registration", path: "/judge/guest-registration" },
    { icon: <Award size={20} />, label: "Notice Board", path: "/judge/notices" },
    { icon: <Award size={20} />, label: "Documents", path: "/judge/orhc-documents" },
    { icon: <Award size={20} />, label: "Events", path: "/judge/events" },
    { icon: <Camera size={20} />, label: "Gallery", path: "/judge/gallery" },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-72 h-screen flex flex-col fixed top-0 left-0 z-50
          bg-[#1a3320] border-r border-[#C5A059]/15
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky
        `}
      >
        {/* Gold accent line at top */}
        <div className="h-1 w-full bg-gradient-to-r from-[#C5A059] via-[#e2c07a] to-[#C5A059]" />

        {/* BRANDING */}
        <div className="px-6 py-5 border-b border-[#C5A059]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C5A059] rounded-xl flex items-center justify-center shadow-lg shadow-[#C5A059]/20 flex-shrink-0">
              <Scale className="text-[#1a3320]" size={22} />
            </div>
            <div>
              <h1 className="text-white font-serif font-bold tracking-tight">ORHC</h1>
              <p className="text-[10px] font-serif uppercase text-[#C5A059] font-black uppercase tracking-widest">
                Judge Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-[#C5A059] text-[#1a3320] shadow-lg shadow-[#C5A059]/20"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={isActive ? "text-[#1a3320]" : "text-white/40 group-hover:text-[#C5A059] transition-colors"}>
                  {item.icon}
                </span>
                <span className={`text-sm font-bold tracking-wide ${isActive ? "text-[#1a3320]" : ""}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a3320]/40" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="px-4 py-5 border-t border-[#C5A059]/15">
          {/* Version badge */}
          <div className="flex items-center gap-2 px-4 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span className="text-[9px] font-black text-[#C5A059]/60 uppercase tracking-widest">
              Secure Session Active
            </span>
          </div>
          <button className="flex items-center gap-4 px-4 py-3 w-full text-white/40 hover:text-red-400 transition-colors rounded-xl hover:bg-white/5 group">
            <LogOut size={20} />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default JudgeSidebar;