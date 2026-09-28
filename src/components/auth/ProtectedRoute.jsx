import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../../utils/api';

export default function ProtectedRoute() {
  const token = getAuthToken();

  // If no auth token in localStorage, redirect immediately to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise render child routes
  return <Outlet />;
}
