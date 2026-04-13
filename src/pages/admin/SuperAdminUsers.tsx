import { useEffect, useState, useMemo, useCallback } from 'react'; // Swapped useCallback for useMemo
import { 
  UserPlus, Search, MoreVertical, Trash2, UserCheck, 
  Loader2, Mail, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {  fetchAllUsers, removeUser } from '../../redux/slices/userSlice';
import debounce from 'lodash/debounce';

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const { users, loading, totalUsers, totalPages, currentPage } = useAppSelector((state) => state.user);
  
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Memoized load function
 const loadUsers = useCallback((page: number, search: string) => {
    dispatch(fetchAllUsers({ page, search, limit: 10 }));
  }, [dispatch]);

  // 2. Fix for "Expected an inline function expression"
  // useMemo returns the debounced function and satisfies the linter
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        loadUsers(1, query);
      }, 500),
    [loadUsers]
  );

  // 3. Initial load and cleanup
  useEffect(() => {
    loadUsers(1, '');
    
    return () => { 
      debouncedSearch.cancel(); 
    };
  }, [dispatch, loadUsers, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadUsers(newPage, searchTerm);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to revoke this user's access? This action is recorded.")) {
      dispatch(removeUser(id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase font-serif text-slate-900 tracking-tight">Judiciary Directory</h2>
          <p className="text-slate-500 text-sm">Official records of judicial officers and administrative staff.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
          <UserPlus size={18} />
          <span>Onboard New Officer</span>
        </button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-700"><UserCheck size={24}/></div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Personnel</p>
            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Query by name, email or role..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm placeholder:text-slate-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Showing page {currentPage} of {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-tighter font-black border-b border-slate-100">
                <th className="px-6 py-4">Full Identity</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Auth Status</th>
                <th className="px-6 py-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-700 mb-3" size={40} />
                    <p className="text-sm font-medium text-slate-500">Syncing with High Court records...</p>
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold border border-slate-200 uppercase">
                        {user.full_name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user.full_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> {user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                      user.role === 'judge' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      user.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" /> VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                        <div className="w-1 h-1 rounded-full bg-amber-500" /> ACCESS PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Total Results: <span className="font-bold text-slate-700">{totalUsers}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-3">Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;