import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import FellowRoutes from "./routes/FellowRoutes";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/fellow/*" element={<FellowRoutes />} />
      <Route path="*" element={<Navigate to="/fellow" replace />} />
    </Routes>
  );
}
