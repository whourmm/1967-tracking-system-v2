import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import FellowRoutes from "./routes/FellowRoutes";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { getCurrentUser, homeForRole } from "./lib/auth";

function AuthEntry({ children }: { children: ReactNode }) {
  const user = getCurrentUser();

  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}

function FallbackRoute() {
  const user = getCurrentUser();
  return <Navigate to={user ? homeForRole(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthEntry><LoginPage /></AuthEntry>} />
      <Route path="/register" element={<AuthEntry><RegisterPage /></AuthEntry>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fellow/*"
        element={
          <ProtectedRoute allowedRoles={["fellow"]}>
            <FellowRoutes />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<FallbackRoute />} />
    </Routes>
  );
}
