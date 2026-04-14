import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './SuperAdminSidebar';
import AdminHeader from './SuperAdminHeader';

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // 1. Keep h-screen and overflow-hidden on the wrapper to lock the viewport
    <div className="h-screen w-full flex overflow-hidden bg-slate-50">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full">
        <AdminHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        {/* FIX: Changed 'overflow-hidden' to 'overflow-y-auto'.
            This allows long pages (like Info) to scroll, while 
            the 'flex-1' still allows the Chat to fill the space.
        */}
        <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] scroll-smooth">
          <div className="min-h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>

          {/* PRO TIP: Move the footer INSIDE the scrollable main area. 
              If it's outside, it takes up fixed vertical space which 
              often cuts off the bottom of your forms.
          */}
          <footer className="p-6 text-center uppercase font-serif text-slate-400 text-[10px] border-t border-slate-200 bg-white/50 mt-auto">
            &copy; {new Date().getFullYear()} Office of the Registrar High Court
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;