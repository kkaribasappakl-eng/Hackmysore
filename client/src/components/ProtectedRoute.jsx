// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Enforces role-based route access.
 * Unauthenticated users are redirected to /login.
 * Authenticated users attempting to access unauthorized role dashboards
 * are securely redirected to their own role's dashboard.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-slate-400">Verifying role credentials...</span>
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Normalize roles to uppercase
  const userRole = (currentUser.role || '').toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());

  // Check if role is allowed
  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    // Determine the user's home dashboard based on their role
    let targetPath = '/builder';
    if (userRole === 'REVIEWER') targetPath = '/reviewer';
    if (userRole === 'RECRUITER') targetPath = '/recruiter';

    return <Navigate to={`${targetPath}?unauthorized=true`} replace />;
  }

  return children;
}
