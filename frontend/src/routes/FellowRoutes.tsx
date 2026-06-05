import { Navigate, Route, Routes } from "react-router-dom";
import FellowLayout from "../components/layout/FellowLayout";
import FellowDashboard from "../pages/fellow/FellowDashboard";
import AssignmentsPage from "../pages/fellow/AssignmentsPage";
import LearningSystemPage from "../pages/fellow/LearningSystemPage";

export default function FellowRoutes() {
  return (
    <Routes>
      <Route path="/fellow" element={<FellowLayout />}>
        <Route index element={<FellowDashboard />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="learning" element={<LearningSystemPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/fellow" replace />} />
    </Routes>
  );
}
