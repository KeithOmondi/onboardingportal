import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { clearMessages, clearErrors, updatePassword, logout } from "../../redux/slices/authSlice";
import JOB_LOGO from "../../assets/JOB_LOGO.jpg";

const UpdatePasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error, message, tempUserId, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Guard: no tempUserId and not authenticated = redirect to login
  useEffect(() => {
    if (!tempUserId && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [tempUserId, isAuthenticated, navigate]);

  // Handle API error toast
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "update-error" });
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // FIX: Redirect based on the success message alone
  useEffect(() => {
    if (message) {
      toast.success(message, { id: "update-success" });
      
      const timer = setTimeout(() => {
        dispatch(clearMessages());
        // Force logout to clear any stale temp sessions and go to login
        dispatch(logout()); 
        navigate("/login", { replace: true });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [message, navigate, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (tempUserId) {
      dispatch(updatePassword({ userId: tempUserId, newPassword }));
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontWeight: "700",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
          success: {
            style: { background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" },
            iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
          },
          error: {
            style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" },
            iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
          },
        }}
      />

      <div className="min-h-screen flex bg-white overflow-hidden">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1a3a2a] relative items-center justify-center p-12 overflow-hidden border-r border-[#C9922A]/20">
          <div className="absolute inset-0">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#C9922A] rounded-full blur-[140px] opacity-10"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-black rounded-full blur-[120px] opacity-40"></div>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9922A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
            <div className="mb-10 drop-shadow-2xl">
              <img src={JOB_LOGO} alt="Judiciary Logo" className="w-50 h-auto rounded object-contain mx-auto" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-serif font-bold tracking-tight text-white">
                ONBOARDING <span className="text-[#C9922A]">PORTAL</span>
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-[#C9922A]/40"></div>
                <div className="w-2 h-2 rotate-45 bg-[#C9922A]"></div>
                <div className="h-[1px] w-12 bg-[#C9922A]/40"></div>
              </div>
              <p className="text-[#C9922A] text-sm md:text-base font-serif uppercase tracking-[0.25em] leading-relaxed font-semibold opacity-90">
                Office of the Registrar <br />
                <span className="text-white/80">High Court of Kenya</span>
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-[#C9922A]/60 text-[10px] font-bold uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-[1px] bg-[#C9922A]/30"></span>
              &copy; {new Date().getFullYear()} Republic of Kenya
            </div>
            <div className="flex gap-4">
              <span>Justice</span>
              <span className="text-[#C9922A]/30">|</span>
              <span>Efficiency</span>
              <span className="text-[#C9922A]/30">|</span>
              <span>Integrity</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif capitalize font-bold text-slate-900 tracking-tight">
                Honorable <span className="text-[#1a3a2a]">Judge</span>
              </h2>
              <p className="mt-3 font-serif text-slate-500 font-medium">
                For security purposes, we kindly advise resetting your password before accessing your dashboard.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* New Password Input */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] block mb-2 ml-1">
                  New Secure Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1a3a2a] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-4 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10 focus:border-[#1a3a2a] focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#1a3a2a] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] block mb-2 ml-1">
                  Confirm Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1a3a2a] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-4 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/10 focus:border-[#1a3a2a] focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="bg-[#1a3a2a]/5 p-4 rounded-2xl border border-[#1a3a2a]/10">
                <h4 className="text-[10px] font-black text-[#1a3a2a] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-[#1a3a2a]/30"></span>
                  Protocol Requirements
                </h4>
                <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#C9922A]"></div>
                    Minimum 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#C9922A]"></div>
                    Alpha-numeric &amp; Special characters
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading === "auth" || !!message}
                className="relative w-full font-bold font-serif flex justify-center py-4 px-4 rounded-xl text-white bg-[#1a3a2a] hover:bg-[#132b1f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3a2a] uppercase tracking-widest text-xs transition-all shadow-xl shadow-[#1a3a2a]/20 disabled:opacity-70 active:scale-[0.98] mt-8"
              >
                {loading === "auth" ? <Loader2 className="animate-spin" size={20} /> : "Confirm"}
              </button>
            </form>

            <div className="text-center pt-12">
              <div className="flex justify-center gap-1.5">
                <div className="h-1 w-6 bg-slate-100 rounded-full"></div>
                <div className="h-1 w-10 bg-[#C9922A] rounded-full"></div>
                <div className="h-1 w-6 bg-slate-100 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdatePasswordPage;