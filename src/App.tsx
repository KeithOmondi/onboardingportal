import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { UserRole } from './interfaces/user.interface';
import JudgeLayout from './components/judge/JudgeLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import UpdatePassword from './pages/auth/UpdatePassword';
import AdminUsers from './pages/superadmin/SuperAdminUsers';
import SuperAdminInfo from './pages/superadmin/SuperAdminInfo';
import JudgeDashboard from './pages/judge/JudgeDashboard';
import JudgeInfo from './pages/judge/JudgeInfo';
import { loadUser } from './redux/slices/authSlice';
import JudgeOathInfo from './pages/judge/JudgeOathInfo';
import JudgeGuest from './pages/judge/JudgeGuest';
import SuperAdminGuests from './pages/superadmin/SuperAdminGuests';
import SuperAdminOath from './pages/superadmin/SuperAdminOath';
import SuperAdminNotice from './pages/superadmin/SuperAdminNotice';
import JudgeNotice from './pages/judge/JudgeNotice';
import JudgeEvents from './pages/judge/JudgeEvents';
import SuperAdminEvents from './pages/superadmin/SuperAdminEvents';
import JudgeGallery from './pages/judge/JudgeGallery';
import SuperAdminGallery from './pages/superadmin/SuperAdminGallery';
import ChatButton from './components/ChatButton';
import RegistrarLayout from './components/registrars/RegistrarLayout';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import RegistrarInfo from './pages/registrar/RegistrarInfo';
import RegistrarNotice from './pages/registrar/RegistrarNotice';
import RegistrarEvents from './pages/registrar/RegistrarEvents';
import RegistrarGallery from './pages/registrar/RegistrarGallery';
import SuperAdminMessages from './pages/superadmin/SuperAdminMessages';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import AdminInfo from './pages/admin/AdminInfo';
import AdminOath from './pages/admin/AdminOath';
import AdminGuests from './pages/admin/AdminGuest';
import AdminNotice from './pages/admin/AdminNotice';
import AdminEvents from './pages/admin/AdminEvents';
import AdminGallery from './pages/admin/AdminGallery';
import AdminMessages from './pages/admin/AdminMessages';
import SuperAdminDocuments from './pages/superadmin/SuperAdminDocuments';
import AdminDocuments from './pages/admin/AdminDocuments';
import JudgesDocuments from './pages/judge/JudgesDocuments';

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Helper to determine if the user is an admin
  const isAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

  return (
    <Router>
      <Routes>
        {/* --- Public --- */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
        />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* --- SuperAdmin Portal --- */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]} />
          }
        >
          <Route element={<SuperAdminLayout />}>
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/highcourtinformation" element={<SuperAdminInfo />} />
            <Route path="/superadmin/oath" element={<SuperAdminOath />} />
            <Route path="/superadmin/guest-list" element={<SuperAdminGuests />} />
            <Route path="/superadmin/notice-board" element={<SuperAdminNotice />} />
            <Route path="/superadmin/orhc-documents" element={<SuperAdminDocuments />} />
            <Route path="/superadmin/events-board" element={<SuperAdminEvents />} />
            <Route path="/superadmin/admin-gallery" element={<SuperAdminGallery />} />
            <Route path="/superadmin/messages" element={<SuperAdminMessages />} />
            <Route path="/superadmin/users" element={<AdminUsers />} />
            
          </Route>
        </Route>

        {/* --- Admin Portal --- */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />
          }
        >
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/info" element={<AdminInfo />} />
            <Route path="/admin/oath" element={<AdminOath />} />
            <Route path="/admin/guest-list" element={<AdminGuests />} />
            <Route path="/admin/notice-board" element={<AdminNotice />} />
            <Route path="/admin/events-board" element={<AdminEvents />} />
            <Route path="/admin/orhc-documents" element={<AdminDocuments />} />
            <Route path="/admin/admin-gallery" element={<AdminGallery />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
          </Route>
        </Route>

        {/* --- Judge Portal --- */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[UserRole.JUDGE]} />
          }
        >
          <Route element={<JudgeLayout />}>
            <Route path="/judge/dashboard" element={<JudgeDashboard />} />
            <Route path="/judge/info" element={<JudgeInfo />} />
            <Route path="/judge/oath" element={<JudgeOathInfo />} />
            <Route path="/judge/guest-registration" element={<JudgeGuest />} />
            <Route path="/judge/notices" element={<JudgeNotice />} />
            <Route path="/judge/events" element={<JudgeEvents />} />
            <Route path="/judge/events" element={<JudgeEvents />} />
            <Route path="/judge/orhc-documents" element={<JudgesDocuments />} />
            <Route path="/judge/gallery" element={<JudgeGallery />} />
          </Route>
        </Route>


         {/* --- Registrars Portal --- */}
        <Route
          element={
            <ProtectedRoute allowedRoles={[UserRole.REGISTRAR]} />
          }
        >
          <Route element={<RegistrarLayout />}>
            <Route path="/registrar/dashboard" element={<RegistrarDashboard />} />
            <Route path="/registrar/info" element={<RegistrarInfo />} />
            <Route path="/registrar/notices" element={<RegistrarNotice />} />
            <Route path="/registrar/events" element={<RegistrarEvents />} />
            <Route path="/registrar/gallery" element={<RegistrarGallery />} />
          </Route>
        </Route>

        {/* --- Root redirect --- */}
        {/* --- Root redirect --- */}
<Route
  path="/"
  element={
    !isAuthenticated ? (
      <Navigate to="/login" replace />
    ) : user?.role === UserRole.SUPER_ADMIN ? (
      <Navigate to="/superadmin/dashboard" replace />
    ) : user?.role === UserRole.ADMIN ? (
      <Navigate to="/admin/dashboard" replace />
    ) : user?.role === UserRole.JUDGE ? (
      <Navigate to="/judge/dashboard" replace />
    ) : user?.role === UserRole.REGISTRAR ? (
      <Navigate to="/registrar/dashboard" replace />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        {/* --- 404 --- */}
        <Route
          path="*"
          element={
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <h1 className="text-6xl font-black text-slate-200">404</h1>
              <p className="text-slate-500 mt-2 font-medium">
                The requested judicial resource is unavailable.
              </p>
              <button
                onClick={() => (window.location.href = '/')}
                className="mt-6 text-blue-600 font-bold hover:underline"
              >
                Return to Secure Area
              </button>
            </div>
          }
        />
      </Routes>

      {/* Logic: Show ONLY if authenticated AND user is NOT an admin */}
      {isAuthenticated && !isAdmin && <ChatButton />}
    </Router>
  );
};

export default App;