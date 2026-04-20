import { useState, useRef, useEffect } from "react";
import { Bell, Search, UserCircle, Menu, Settings, LogOut, User, BellOff } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../redux/store";
import { logout } from "../../redux/slices/authSlice";

interface JudgeHeaderProps {
  onMenuToggle: () => void;
  onEnableNotifications: () => Promise<void>;
}

const JudgeHeader = ({ onMenuToggle, onEnableNotifications }: JudgeHeaderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track permission state so the button hides once granted
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnableNotifications = async () => {
    await onEnableNotifications();
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-16 lg:h-20 bg-[#355E3B] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50 gap-3 shadow-lg shadow-[#355E3B]/30">
      
      {/* LEFT: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="text"
            placeholder="Search files, indicators..."
            className="w-full bg-white/10 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#C5A059]/40 focus:bg-white/15 outline-none transition-all"
          />
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2 pr-5 border-r border-white/15">
          <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
            Secure Session Active
          </span>
        </div>

        <button className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
          <Search size={20} />
        </button>

        {/* Bell — doubles as enable-notifications button when not yet granted */}
        {notifPermission === "granted" ? (
          <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#C5A059] rounded-full border-2 border-[#355E3B]" />
          </button>
        ) : (
          <button
            onClick={handleEnableNotifications}
            title="Enable push notifications"
            className="relative p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <BellOff size={20} />
          </button>
        )}

        <div className="h-8 w-px bg-white/15 hidden sm:block" />

        {/* User Profile + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold font-serif uppercase text-white leading-none group-hover:text-[#C5A059] transition-colors">
                {user?.full_name || "Hon. Judge"}
              </p>
              <p className="text-[10px] font-bold text-[#C5A059] tracking-tighter mt-1">
                {user?.email}
              </p>
            </div>
            <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 p-0.5 transition-all ${isDropdownOpen ? 'border-[#C5A059] bg-[#C5A059]/20' : 'border-[#C5A059]/50 bg-white/10'}`}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-white">
                <UserCircle size={22} />
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">
              <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355E3B] transition-colors">
                <User size={18} className="text-gray-400" />
                My Profile
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#355E3B] transition-colors">
                <Settings size={18} className="text-gray-400" />
                Account Settings
              </button>

              {/* Enable notifications option in dropdown too */}
              {notifPermission !== "granted" && (
                <button
                  onClick={handleEnableNotifications}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Bell size={18} />
                  Enable Notifications
                </button>
              )}
              
              <div className="h-px bg-gray-100 my-1" />
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default JudgeHeader;