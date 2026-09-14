import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const RequireRole = ({ allowedRoles = [], children }) => {
  const { currentUser, isAuthenticated } = useApp() || {};
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!currentUser || !allowedRoles.includes(currentUser.id))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireRole;
