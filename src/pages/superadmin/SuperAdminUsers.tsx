import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  UserPlus, Search, Trash2, UserCheck,
  Loader2, ChevronLeft, ChevronRight, X, ShieldAlert,
  CheckCircle, Clock, Lock, Edit3,
  AlertTriangle, Mail, Shield, Hash,
  Activity, LogOut, AlertCircle,
  Wifi, WifiOff, TrendingUp,
  RefreshCw, 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchAllUsers, removeUser, onboardUser, modifyUser, clearUserStatus
} from '../../redux/slices/userSlice';
import { UserRole, type IUser } from '../../interfaces/user.interface';
import debounce from 'lodash/debounce';

/* ─── TYPES ───────────────────────────────────────────────────────────── */

export type LoginActivityStatus =
  | 'logged_in'      // currently active session
  | 'logged_out'     // logged out cleanly
  | 'never_logged_in'// account created, never accessed
  | 'login_error'    // repeated failed attempts / locked
  | 'pending_reset'; // mustResetPassword = true, hasn't done it yet

export interface IUserActivity {
  user_id: string;
  status: LoginActivityStatus;
  last_seen?: string | null;          // ISO timestamp
  last_login_attempt?: string | null; // ISO timestamp
  failed_attempts?: number;
  session_count?: number;             // total successful sessions ever
  ip_address?: string | null;
}

type ActivityFilter = 'all' | LoginActivityStatus;

/* ─── HELPERS ─────────────────────────────────────────────────────────── */

const getInitials = (name: string): string =>
  name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : '??';

const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.JUDGE:       return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case UserRole.ADMIN:       return 'bg-blue-100 text-blue-700 border-blue-200';
    case UserRole.REGISTRAR:   return 'bg-violet-100 text-violet-700 border-violet-200';
    case UserRole.SUPER_ADMIN: return 'bg-rose-100 text-rose-700 border-rose-200';
    default:                   return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getActivityConfig = (status: LoginActivityStatus) => {
  switch (status) {
    case 'logged_in':
      return {
        label: 'Active',
        icon: Wifi,
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ring: 'ring-2 ring-emerald-400 ring-offset-2',
      };
    case 'logged_out':
      return {
        label: 'Logged Out',
        icon: LogOut,
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        ring: '',
      };
    case 'never_logged_in':
      return {
        label: 'Never Logged In',
        icon: WifiOff,
        dot: 'bg-amber-400',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        ring: '',
      };
    case 'login_error':
      return {
        label: 'Login Issues',
        icon: AlertCircle,
        dot: 'bg-red-500',
        badge: 'bg-red-50 text-red-700 border-red-200',
        ring: 'ring-2 ring-red-300 ring-offset-2',
      };
    case 'pending_reset':
      return {
        label: 'Reset Pending',
        icon: Lock,
        dot: 'bg-orange-400',
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        ring: '',
      };
  }
};

const formatRelativeTime = (iso?: string | null): string => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/* ─── MOCK ACTIVITY GENERATOR (replace with real API data) ────────────── */
// In production, replace this with a Redux thunk: fetchUserActivities()
const MOCK_STATUSES: LoginActivityStatus[] = [
  'logged_in', 'logged_out', 'never_logged_in', 'login_error', 'pending_reset',
];
const generateMockActivity = (userId: string, index: number): IUserActivity => {
  const status = MOCK_STATUSES[index % MOCK_STATUSES.length];
  const now = new Date();
  return {
    user_id: userId,
    status,
    last_seen: status === 'logged_in'
      ? new Date(now.getTime() - Math.random() * 600000).toISOString()
      : status === 'logged_out'
        ? new Date(now.getTime() - Math.random() * 86400000 * 5).toISOString()
        : null,
    last_login_attempt: status === 'login_error'
      ? new Date(now.getTime() - Math.random() * 3600000).toISOString()
      : null,
    failed_attempts: status === 'login_error' ? Math.floor(Math.random() * 8) + 3 : 0,
    session_count: status === 'never_logged_in' ? 0 : Math.floor(Math.random() * 50) + 1,
    ip_address: status === 'logged_in' ? `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : null,
  };
};

/* ─── STAT CARD ───────────────────────────────────────────────────────── */
const StatCard = ({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; accent: string;
}) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${accent}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em]">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── ACTIVITY TIMELINE DOT ───────────────────────────────────────────── */
const ActivityPulse = ({ status }: { status: LoginActivityStatus }) => {
  const cfg = getActivityConfig(status);
  return (
    <span className="relative flex h-3 w-3">
      {status === 'logged_in' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${cfg.dot}`} />
    </span>
  );
};

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────── */

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const { users, loading, totalUsers, totalPages, currentPage, error, message } =
    useAppSelector((state) => state.user);

  // UI States
  const [searchTerm, setSearchTerm]                 = useState('');
  const [isModalOpen, setIsModalOpen]               = useState(false);
  const [editingUser, setEditingUser]               = useState<IUser | null>(null);
  const [selectedUser, setSelectedUser]             = useState<IUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activityFilter, setActivityFilter]         = useState<ActivityFilter>('all');
  const [viewMode, setViewMode]                     = useState<'grid' | 'activity'>('grid');



  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email:     '',
    password:  '',
    role:      UserRole.STAFF as UserRole,
  });

  /* ─── Data Loading ──────────────────────────────────────────────── */

  const loadUsers = useCallback((page: number, search: string) => {
    dispatch(fetchAllUsers({ page, search, limit: 10 }));
  }, [dispatch]);

  const debouncedSearch = useMemo(
    () => debounce((query: string) => loadUsers(1, query), 500),
    [loadUsers]
  );

  useEffect(() => {
    loadUsers(1, '');
    return () => { debouncedSearch.cancel(); };
  }, [loadUsers, debouncedSearch]);

 // 1. Calculate the map directly in the component body
const activities = useMemo(() => {
  if (users.length === 0) return {};

  const map: Record<string, IUserActivity> = {};
  users.forEach((user, i) => {
    map[user.id] = generateMockActivity(user.id, i);
  });
  return map;
}, [users]); // Only re-calculates when 'users' changes

// 2. Remove the useEffect and the 'activities' state entirely!

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => dispatch(clearUserStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  /* ─── Derived Stats ─────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const vals = Object.values(activities);
    return {
      active:       vals.filter(a => a.status === 'logged_in').length,
      loggedOut:    vals.filter(a => a.status === 'logged_out').length,
      neverLoggedIn:vals.filter(a => a.status === 'never_logged_in').length,
      loginErrors:  vals.filter(a => a.status === 'login_error').length,
      pendingReset: vals.filter(a => a.status === 'pending_reset').length,
    };
  }, [activities]);

  const filteredUsers = useMemo(() => {
    if (activityFilter === 'all') return users;
    return users.filter(u => activities[u.id]?.status === activityFilter);
  }, [users, activities, activityFilter]);

  /* ─── Handlers ──────────────────────────────────────────────────── */

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', password: '', role: UserRole.STAFF });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedUser) return;
    setEditingUser(selectedUser);
    setFormData({
      full_name: selectedUser.full_name,
      email:     selectedUser.email,
      role:      selectedUser.role,
      password:  '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      dispatch(modifyUser({ id: editingUser.id, ...formData }));
    } else {
      dispatch(onboardUser(formData));
    }
    setIsModalOpen(false);
  };

  const handleToggleVerification = (user: IUser) => {
    dispatch(modifyUser({ id: user.id, is_verified: !user.is_verified }));
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    dispatch(removeUser(selectedUser.id));
    setIsDeleteConfirmOpen(false);
    setSelectedUser(null);
  };

  /* ─── RENDER ─────────────────────────────────────────────────────── */

  const FILTER_TABS: { key: ActivityFilter; label: string; count?: number }[] = [
    { key: 'all',             label: 'All',           count: totalUsers },
    { key: 'logged_in',       label: 'Active',        count: stats.active },
    { key: 'logged_out',      label: 'Logged Out',    count: stats.loggedOut },
    { key: 'never_logged_in', label: 'Never Accessed',count: stats.neverLoggedIn },
    { key: 'login_error',     label: 'Login Issues',  count: stats.loginErrors },
    { key: 'pending_reset',   label: 'Reset Pending', count: stats.pendingReset },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcf7] p-6 md:p-10 text-[#1a1c1e] font-sans space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase font-serif text-slate-900 tracking-tight">
            Judiciary Directory
          </h2>
          <p className="text-slate-500 text-sm italic">
            Personnel management, credentials & live activity monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#1a3a32] text-[#c2a336]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setViewMode('activity')}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                viewMode === 'activity'
                  ? 'bg-[#1a3a32] text-[#c2a336]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Activity size={12} />
              Activity
              {stats.loginErrors > 0 && (
                <span className="bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                  {stats.loginErrors}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-[#1a3a32] hover:bg-[#2a5a4d] text-[#c2a336] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={16} />
            <span>Onboard Officer</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm font-bold flex items-center gap-2">
          <CheckCircle size={16} /> {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={UserCheck}    label="Total Officers"  value={totalUsers}             accent="bg-slate-100 text-[#1a3a32]" />
        <StatCard icon={Wifi}         label="Active Now"      value={stats.active}           accent="bg-emerald-100 text-emerald-700" sub="Live sessions" />
        <StatCard icon={WifiOff}      label="Never Accessed"  value={stats.neverLoggedIn}    accent="bg-amber-100 text-amber-700"  sub="Invite not used" />
        <StatCard icon={AlertCircle}  label="Login Issues"    value={stats.loginErrors}      accent="bg-red-100 text-red-700"      sub="Needs attention" />
        <StatCard icon={Lock}         label="Reset Pending"   value={stats.pendingReset}     accent="bg-orange-100 text-orange-700" sub="First login req." />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a3a32]" size={16} />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none transition-all text-sm bg-white shadow-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Activity Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => {
            const cfg = tab.key !== 'all' ? getActivityConfig(tab.key) : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActivityFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                  activityFilter === tab.key
                    ? 'bg-[#1a3a32] text-[#c2a336] border-[#1a3a32]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cfg && (
                  <span className={`w-2 h-2 rounded-full ${activityFilter === tab.key ? 'bg-[#c2a336]' : cfg.dot}`} />
                )}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    activityFilter === tab.key ? 'bg-[#c2a336]/20 text-[#c2a336]' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
          {activityFilter !== 'all'
            ? `${filteredUsers.length} results filtered`
            : `Page ${currentPage} / ${totalPages}`
          }
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadUsers(currentPage - 1, searchTerm)} disabled={currentPage === 1 || loading} className="p-2 border rounded-lg bg-white disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => loadUsers(currentPage + 1, searchTerm)} disabled={currentPage === totalPages || loading} className="p-2 border rounded-lg bg-white disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── GRID VIEW ──────────────────────────────────────────────── */}
      {loading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#1a3a32] mb-4" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Registry...</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => {
            const activity = activities[user.id];
            const cfg = activity ? getActivityConfig(activity.status) : null;
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group hover:border-[#1a3a32]/30 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] flex flex-col ${cfg?.ring ?? ''}`}
              >
                {/* Activity pulse indicator */}
                {activity && (
                  <div className="absolute top-4 right-4">
                    <ActivityPulse status={activity.status} />
                  </div>
                )}

                <div className="flex justify-between items-start mb-6 pr-5">
                  <div className="w-12 h-12 rounded-full bg-[#1a3a32] text-[#c2a336] flex items-center justify-center font-bold text-lg shadow-inner">
                    {getInitials(user.full_name)}
                  </div>
                  <div className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${getRoleColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-[#1a3a32] leading-tight mb-1">{user.full_name}</h4>
                  <div className="flex items-center text-[11px] text-slate-500 mb-3">
                    <Mail size={11} className="mr-2 text-slate-300 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {/* Activity badge */}
                  {cfg && (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-tight mb-3 ${cfg.badge}`}>
                      <cfg.icon size={10} />
                      {cfg.label}
                      {activity?.status === 'login_error' && activity.failed_attempts && (
                        <span className="ml-0.5">· {activity.failed_attempts} attempts</span>
                      )}
                    </div>
                  )}

                  {activity?.last_seen && (
                    <p className="text-[10px] text-slate-400">
                      Last seen {formatRelativeTime(activity.last_seen)}
                    </p>
                  )}
                  {activity?.status === 'never_logged_in' && (
                    <p className="text-[10px] text-amber-500 font-bold">Account not yet accessed</p>
                  )}
                  {activity?.status === 'login_error' && activity.last_login_attempt && (
                    <p className="text-[10px] text-red-500 font-bold">
                      Last attempt {formatRelativeTime(activity.last_login_attempt)}
                    </p>
                  )}
                </div>

                <div className="w-full border-t border-slate-50 pt-4 mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleVerification(user); }}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                      user.is_verified
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {user.is_verified ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {user.is_verified ? 'VERIFIED' : 'PENDING'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── ACTIVITY TABLE VIEW ───────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1a3a32] uppercase tracking-widest">Live Activity Monitor</h3>
              <p className="text-[11px] text-slate-400 mt-1">Real-time login status for all registered officers</p>
            </div>
            <button
              onClick={() => loadUsers(currentPage, searchTerm)}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-[#1a3a32] hover:border-[#1a3a32]/30 transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Officer', 'Role', 'Status', 'Last Seen', 'Sessions', 'Failed Attempts', 'IP Address', 'Access'].map(h => (
                    <th key={h} className="text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] px-6 py-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const activity = activities[user.id];
                  const cfg = activity ? getActivityConfig(activity.status) : null;
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors group"
                    >
                      {/* Officer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a3a32] text-[#c2a336] flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="font-bold text-[#1a3a32] text-[13px]">{user.full_name}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {cfg ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-tight ${cfg.badge}`}>
                            <ActivityPulse status={activity!.status} />
                            {cfg.label}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Last Seen */}
                      <td className="px-6 py-4 text-[12px] text-slate-500 whitespace-nowrap">
                        {activity?.status === 'never_logged_in'
                          ? <span className="text-amber-500 font-bold text-[11px]">Never</span>
                          : formatRelativeTime(activity?.last_seen)
                        }
                      </td>

                      {/* Sessions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-slate-300" />
                          <span className="text-[12px] font-bold text-slate-600">{activity?.session_count ?? 0}</span>
                        </div>
                      </td>

                      {/* Failed Attempts */}
                      <td className="px-6 py-4">
                        {(activity?.failed_attempts ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black">
                            <AlertTriangle size={10} />
                            {activity!.failed_attempts} failed
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[12px]">—</span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {activity?.ip_address ?? '—'}
                      </td>

                      {/* Access toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleVerification(user); }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide transition-all ${
                            user.is_verified
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {user.is_verified ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {user.is_verified ? 'Verified' : 'Pending'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Alert banner for login errors */}
          {stats.loginErrors > 0 && (
            <div className="m-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-black text-red-700 uppercase tracking-widest">Security Alert</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  {stats.loginErrors} officer{stats.loginErrors > 1 ? 's have' : ' has'} repeated login failures.
                  Review their accounts or reset credentials immediately.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto flex flex-col">
            <div className="bg-[#1a3a32] p-8 text-[#c2a336] flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-xl uppercase">
                  {editingUser ? 'Update Profile' : 'New Onboarding'}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#c2a336]/70 font-bold mt-1">
                  User Access Management
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 flex-1">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Full Legal Name</label>
                <input required type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Official Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input required disabled={!!editingUser} type="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm disabled:bg-slate-50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                  {editingUser ? 'New Password (Optional)' : 'Temporary Access Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input required={!editingUser} type="password" placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Assigned Role</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>{role.toUpperCase().replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight">
                    Officers will be required to change this password upon their first secure registry access.
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#1a3a32] text-[#c2a336] py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="animate-spin mx-auto" size={18} />
                  : editingUser ? 'Apply Changes' : 'Confirm Onboarding'
                }
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────── */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#1a3a32]/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a32] mb-3">Revoke Access</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to remove <b>{selectedUser?.full_name}</b>? This will permanently revoke all system access.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                Go Back
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Side Panel ──────────────────────────────────────── */}
      {selectedUser && !isModalOpen && !isDeleteConfirmOpen && (() => {
        const activity = activities[selectedUser.id];
        const cfg = activity ? getActivityConfig(activity.status) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-150">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[0.5rem] shadow-2xl overflow-hidden flex flex-col">

              <div className="bg-[#1a3a32] p-6 flex justify-between items-center text-[#c2a336]">
                <h3 className="font-serif font-bold text-lg px-2">Officer Profile</h3>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">

                {/* Identity */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                  <div className="flex items-center space-x-6">
                    <div className={`w-16 h-16 rounded-full bg-[#1a3a32] text-[#c2a336] flex items-center justify-center font-bold text-xl shadow-lg ${cfg?.ring ?? ''}`}>
                      {getInitials(selectedUser.full_name)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-[#1a3a32]">{selectedUser.full_name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${getRoleColor(selectedUser.role)}`}>
                          {selectedUser.role.replace('_', ' ')}
                        </span>
                        {cfg && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${cfg.badge}`}>
                            <ActivityPulse status={activity!.status} />
                            {cfg.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-6 border-b border-slate-100 pb-8 mb-8">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Email</p>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <p className="text-sm font-bold text-[#1a3a32]">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Officer ID</p>
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-slate-400" />
                      <p className="text-sm font-bold text-[#1a3a32] font-mono">{selectedUser.id}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registry Access</p>
                    <button
                      onClick={() => handleToggleVerification(selectedUser)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        selectedUser.is_verified
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {selectedUser.is_verified ? <><CheckCircle size={12} /> VERIFIED</> : <><Clock size={12} /> PENDING</>}
                    </button>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Role</p>
                    <p className="text-sm font-bold text-[#1a3a32] capitalize">{selectedUser.role.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Activity Detail Block */}
                {activity && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity size={12} /> Login Activity
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Sessions</p>
                        <p className="text-2xl font-bold text-[#1a3a32]">{activity.session_count ?? 0}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Last Seen</p>
                        <p className="text-sm font-bold text-[#1a3a32]">{formatRelativeTime(activity.last_seen)}</p>
                      </div>
                      <div className={`rounded-2xl p-4 text-center ${(activity.failed_attempts ?? 0) > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Failed Logins</p>
                        <p className={`text-2xl font-bold ${(activity.failed_attempts ?? 0) > 0 ? 'text-red-600' : 'text-[#1a3a32]'}`}>
                          {activity.failed_attempts ?? 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">IP Address</p>
                        <p className="text-sm font-bold text-[#1a3a32] font-mono">{activity.ip_address ?? '—'}</p>
                      </div>
                    </div>

                    {/* Warning if login errors */}
                    {activity.status === 'login_error' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-black text-red-700 uppercase tracking-widest">Action Required</p>
                          <p className="text-[11px] text-red-600 mt-0.5">
                            This officer has {activity.failed_attempts} failed login attempts.
                            Consider resetting their password or temporarily revoking access pending investigation.
                          </p>
                        </div>
                      </div>
                    )}

                    {activity.status === 'never_logged_in' && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                        <WifiOff size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Invite Not Used</p>
                          <p className="text-[11px] text-amber-600 mt-0.5">
                            This officer has never logged in. Consider resending their onboarding credentials.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="p-8 bg-slate-50 flex flex-col md:flex-row gap-4 md:justify-between border-t border-slate-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="flex items-center justify-center px-5 py-3 border-2 border-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" /> Revoke Access
                  </button>
                  <button
                    onClick={handleOpenEditModal}
                    className="flex items-center justify-center px-5 py-3 border-2 border-slate-200 text-[#1a3a32] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-colors"
                  >
                    <Edit3 size={16} className="mr-2" /> Edit Profile
                  </button>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-10 py-3 bg-white border border-[#1a3a32] text-[#1a3a32] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#1a3a32] hover:text-[#c2a336] transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminUsers;