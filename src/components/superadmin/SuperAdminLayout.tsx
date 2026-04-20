import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './SuperAdminSidebar';
import AdminHeader from './SuperAdminHeader';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subscribe } = usePushNotifications();

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full">
        <AdminHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] scroll-smooth">
          <div className="min-h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>

          <footer className="p-6 text-center uppercase font-serif text-slate-400 text-[10px] border-t border-slate-200 bg-white/50 mt-auto">
            &copy; {new Date().getFullYear()} Office of the Registrar High Court —{" "}
            <button
              onClick={subscribe}
              className="underline hover:text-slate-600 transition-colors"
            >
              Enable Notifications
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;