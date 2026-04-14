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
      style={{ backgroundColor: '#1a3a2a', borderBottom: '1px solid rgba(201,146,42,0.3)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg transition-colors text-white/50 hover:text-[#C9922A] hover:bg-[#C9922A]/10"
        >
          <Menu size={22} />
        </button>

        <div className="font-medium text-sm font-serif uppercase sm:text-base text-white/60">
          Welcome back,{' '}
          <span className="font-bold text-[#C9922A]">
            {user?.full_name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 transition-colors text-white/50 hover:text-[#C9922A]">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-[#C9922A]/30">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold font-serif uppercase text-[#C9922A]">
              {user?.role?.replace('_', ' ')}
            </p>
            <p className="text-xs truncate max-w-[140px] font-serif text-white/45">
              {user?.email}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#C9922A]/20 text-[#C9922A]">
            <User size={22} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;