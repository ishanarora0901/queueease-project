import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/StatCard';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking campus credentials..." />;
  }

  if (!user) {
    const isTryingAdmin = location.pathname.startsWith('/admin');
    return <Navigate to={isTryingAdmin ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If student tries admin, send to student dashboard
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // If staff tries admin, send to staff dashboard
    if (user.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

