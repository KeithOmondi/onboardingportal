import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../interfaces/user.interface';
import type { RootState } from '../redux/store';

interface Props {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user, mustResetPassword } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  // 1. Wait for loadUser() to finish
  if (loading === "auth") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#355E3B] border-t-transparent" />
          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest animate-pulse">
            Verifying Credentials...
          </p>
        </div>
      </div>
    );
  }

  // 2. Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Force password reset
  if (mustResetPassword && location.pathname !== '/update-password') {
    return <Navigate to="/update-password" replace />;
  }

  // 4. Wrong role
  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. ✅ Render nested routes
  return <Outlet />;
};

export default ProtectedRoute;