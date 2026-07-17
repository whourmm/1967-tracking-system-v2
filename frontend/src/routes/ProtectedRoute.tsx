import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, homeForRole, type AppRole } from "../lib/auth";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: AppRole[];
  children: ReactNode;
}) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}
