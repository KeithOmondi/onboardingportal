import { Bell, User, Menu } from 'lucide-react';
import { useAppSelector } from '../../redux/hooks';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

const AdminHeader = ({ onMenuToggle }: AdminHeaderProps) => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header
      className="h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40"
      style={{
        backgroundColor: '#1a3a2a',
        borderBottom: '1px solid rgba(201,146,42,0.3)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#C9922A';
            e.currentTarget.style.backgroundColor = 'rgba(201,146,42,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="font-medium text-sm font-serif uppercase sm:text-base " style={{ color: 'rgba(255,255,255,0.6)' }}>
          Welcome back,{' '}
          <span className="font-bold font-serif uppercase" style={{ color: '#C9922A' }}>
            {user?.full_name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="p-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C9922A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <Bell size={20} />
        </button>

        <div
          className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4"
          style={{ borderLeft: '1px solid rgba(201,146,42,0.3)' }}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold font-serif uppercase" style={{ color: '#C9922A' }}>
              {user?.role.replace('_', ' ').toUpperCase()}
            </p>
            <p className="text-xs truncate max-w-[140px] font-serif" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {user?.email}
            </p>
          </div>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(201,146,42,0.2)', color: '#C9922A' }}
          >
            <User size={22} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;