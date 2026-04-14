import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  UserPlus, Search, Trash2, UserCheck, 
  Loader2, ChevronLeft, ChevronRight, X, ShieldAlert,
  Edit, CheckCircle, Clock
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { 
  fetchAllUsers, removeUser, onboardUser, modifyUser, clearUserStatus 
} from '../../redux/slices/userSlice';
import { UserRole, type IUser } from '../../interfaces/user.interface';
import debounce from 'lodash/debounce';

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const { users, loading, totalUsers, totalPages, currentPage, error, message } = useAppSelector((state) => state.user);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: UserRole.STAFF as UserRole,
  });

  // 1. Data Loading Logic
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

  // Clear success/error messages after 3 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => dispatch(clearUserStatus()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  // 2. Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleOpenModal = (user?: IUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({ full_name: user.full_name, email: user.email, role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ full_name: '', email: '', role: UserRole.STAFF });
    }
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

  const handleDelete = (id: string) => {
    if (window.confirm("Revoke all system access for this officer? This is permanent.")) {
      dispatch(removeUser(id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase font-serif text-slate-900 tracking-tight">Judiciary Directory</h2>
          <p className="text-slate-500 text-sm italic">Secure management of judicial personnel and administrative credentials.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-[#1a3a32] hover:bg-[#2a5a4d] text-[#c2a336] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          <UserPlus size={18} />
          <span>Onboard New Officer</span>
        </button>
      </div>

      {/* Notifications */}
      {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm font-bold animate-pulse">{message}</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm font-bold">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="bg-slate-100 p-3 rounded-xl text-[#1a3a32]"><UserCheck size={24}/></div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Active Records</p>
            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, email or role..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none transition-all text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
            Page {currentPage} / {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Officer Identity</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Registry Access</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" size={32} /></td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1a3a32] flex items-center justify-center text-[#c2a336] font-black text-xs shadow-inner">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter border ${
                      user.role === UserRole.JUDGE ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      user.role === UserRole.ADMIN ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleVerification(user)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        user.is_verified 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {user.is_verified ? <CheckCircle size={12}/> : <Clock size={12}/>}
                      {user.is_verified ? 'VERIFIED' : 'PENDING'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase">Records: {totalUsers}</span>
          <div className="flex gap-2">
            <button onClick={() => loadUsers(currentPage - 1, searchTerm)} disabled={currentPage === 1 || loading} className="p-2 border rounded-lg bg-white disabled:opacity-30"><ChevronLeft size={16}/></button>
            <button onClick={() => loadUsers(currentPage + 1, searchTerm)} disabled={currentPage === totalPages || loading} className="p-2 border rounded-lg bg-white disabled:opacity-30"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      {/* Onboarding / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-serif font-bold text-slate-900 uppercase">{editingUser ? 'Update Profile' : 'New Onboarding'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Full Legal Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Official Email Address</label>
                <input 
                  required
                  disabled={!!editingUser}
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm disabled:bg-slate-50"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Assigned Role</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a3a32] outline-none font-bold text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role.toUpperCase().replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight">New users will be prompted to set their permanent password on first login.</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1a3a32] text-[#c2a336] py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : editingUser ? 'Apply Changes' : 'Confirm Onboarding'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;