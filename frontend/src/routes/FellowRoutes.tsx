import { Routes, Route } from "react-router-dom";
import FellowLayout from "../components/layout/FellowLayout";
import FellowDashboard from "../pages/fellow/FellowDashboard";
import AssignmentsPage from "../pages/fellow/AssignmentsPage";
import LearningSystemPage from "../pages/fellow/LearningSystemPage";
import TeamsPage from "../pages/fellow/TeamsPage";

export default function FellowRoutes() {
  return (
    <Routes>
      <Route element={<FellowLayout />}>
        <Route index element={<FellowDashboard />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="learning" element={<LearningSystemPage />} />
        <Route path="teams" element={<TeamsPage />} />
      </Route>
    </Routes>
  );
}
