import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import FellowRoutes from "./routes/FellowRoutes";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/fellow/*" element={<FellowRoutes />} />
      <Route path="*" element={<Navigate to="/fellow" replace />} />
    </Routes>
  );
}
