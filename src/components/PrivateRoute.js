// ===========================================================
// components/PrivateRoute.js
// ===========================================================
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
 
// ✅ PrivateRoute for Auth & Role-based protection
const PrivateRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");
 
  // 🔒 Not logged in → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
 
  // 🔒 Role-based restriction
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
 
  // ✅ Authorized → render child route
  return <Outlet />;
};
 
export default PrivateRoute;
 
 