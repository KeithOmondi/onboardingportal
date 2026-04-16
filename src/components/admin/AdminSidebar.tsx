import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Gavel, Map, Settings, LogOut, X, Group,
  Pen, Camera, MessageCircle, ShowerHeadIcon
} from 'lucide-react';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { title: 'High Court Information', icon: <Map size={20} />, path: '/admin/info' },
    { title: 'Oath Details', icon: <Gavel size={20} />, path: '/admin/oath' },
    { title: 'Guest List', icon: <Group size={20} />, path: '/admin/guest-list' },
    { title: 'Notice Board', icon: <Pen size={20} />, path: '/admin/notice-board' },
    { title: 'Documents', icon: <MessageCircle size={20} />, path: '/admin/orhc-documents' },
    { title: 'Events Board', icon: <ShowerHeadIcon size={20} />, path: '/admin/events-board' },
    { title: 'Gallery', icon: <Camera size={20} />, path: '/admin/admin-gallery' },
    { title: 'Messages', icon: <MessageCircle size={20} />, path: '/admin/messages' },
    { title: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`w-64 text-white flex flex-col h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ backgroundColor: '#1a3a2a' }}
      >
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(201,146,42,0.3)' }}>
          <div>
            <h1 className="text-[15px] font-serif font-bold tracking-tight" style={{ color: '#C9922A' }}>
              ONBOARDING PORTAL
            </h1>
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Administrator
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={location.pathname === item.path ? { backgroundColor: '#C9922A', color: '#fff' } : { color: 'rgba(255,255,255,0.55)' }}
            >
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(201,146,42,0.3)' }}>
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors text-white/40 hover:text-red-400 hover:bg-red-400/10"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;