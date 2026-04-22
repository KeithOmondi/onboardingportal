import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Gavel, Map, Settings, LogOut, Users, X, Group,
  Pen, ShowerHeadIcon, Camera, MessageCircle, PaperclipIcon
} from 'lucide-react';
import { useAppDispatch } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';
import { useAdminChat } from '../../hooks/useAdminChat';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // fetchRecipients is part of useAdminChat to pull data from DB
  const { recipients } = useAdminChat();

  // Calculate total unread count from the recipients list provided by the hook
  const totalUnreadCount = useMemo(() => {
    return recipients.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
  }, [recipients]);

  const menuItems = [
    { title: 'Dashboard',             icon: <LayoutDashboard size={20} />, path: '/superadmin/dashboard' },
    { title: 'High Court Information', icon: <Map size={20} />,             path: '/superadmin/highcourtinformation' },
    { title: 'Oath Details',           icon: <Gavel size={20} />,           path: '/superadmin/oath' },
    { title: 'Guest List',             icon: <Group size={20} />,           path: '/superadmin/guest-list' },
    { title: 'Notice Board',           icon: <Pen size={20} />,             path: '/superadmin/notice-board' },
    { title: 'Documents',              icon: <PaperclipIcon size={20} />,   path: '/superadmin/orhc-documents' },
    { title: 'Events Board',           icon: <ShowerHeadIcon size={20} />,  path: '/superadmin/events-board' },
    { title: 'Gallery',                icon: <Camera size={20} />,          path: '/superadmin/admin-gallery' },
    { title: 'All Judges',             icon: <Users size={20} />,           path: '/superadmin/users' },
    { 
      title: 'Messages', 
      icon: <MessageCircle size={20} />, 
      path: '/superadmin/messages',
      count: totalUnreadCount 
    },
    { title: 'Notifications',               icon: <Settings size={20} />,        path: '/superadmin/notifications' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-64 text-white flex flex-col h-screen fixed left-0 top-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ backgroundColor: '#1a3a2a' }}
      >
        <div
          className="p-6 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(201,146,42,0.3)' }}
        >
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
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative"
                style={
                  isActive
                    ? { backgroundColor: '#C9922A', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.55)' }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(201,146,42,0.15)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.title}</span>
                </div>

                {/* The Persistent Unread Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-bold bg-red-600 text-white rounded-full shadow-lg border border-white/10 animate-pulse">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(201,146,42,0.3)' }}>
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff6b6b';
              e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
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