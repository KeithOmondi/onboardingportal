import { useState } from "react";
import { Outlet } from "react-router-dom";
import JudgeSidebar from "./JudgeSidebar";
import JudgeHeader from "./JudgeHeader";

const JudgeLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <JudgeSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN CONTENT — offset by sidebar on large screens only */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        <JudgeHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default JudgeLayout;