import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full">
        <AdminHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] scroll-smooth flex flex-col">
          <div className="p-4 sm:p-8 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>

          <footer className="p-6 text-center uppercase font-serif text-slate-400 text-[10px] border-t border-slate-200 bg-white/50 mt-auto">
            &copy; {new Date().getFullYear()} Office of the Registrar High Court
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;