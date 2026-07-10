import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-semibold animate-pulse">Loading BloodConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized, redirect to their role's dashboard
    if (user.role === 'donor') {
      return <Navigate to="/donor/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'bloodbank') {
      return <Navigate to="/bloodbank/dashboard" replace />;
    } else {
      return <Navigate to="/requester/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
