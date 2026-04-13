import { useState } from "react";
import { Outlet } from "react-router-dom";
import RegistrarSidebar from "./RegistrarSidebar";
import RegistrarHeader from "./RegistrarHeader";

const RegistrarLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <RegistrarSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <RegistrarHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {/* All Registrar-specific read-only views will render here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegistrarLayout;