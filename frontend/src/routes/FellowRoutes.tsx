import { Navigate, Routes, Route } from "react-router-dom";
import FellowLayout from "../components/layout/FellowLayout";
import FellowDashboard from "../pages/fellow/FellowDashboard";
import AssignmentsPage from "../pages/fellow/AssignmentsPage";
import LearningSystemPage from "../pages/fellow/LearningSystemPage";
import TeamPage from "../pages/fellow/team/TeamPage";
import SettingPage from "../pages/fellow/setting/SettingPage";
import RosterPage from "../pages/fellow/roster/RosterPage";
import FellowDetailPage from "../pages/fellow/roster/FellowDetailPage";

export default function FellowRoutes() {
  return (
    <Routes>
      <Route element={<FellowLayout />}>
        <Route index element={<FellowDashboard />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="learning" element={<LearningSystemPage />} />
        <Route path="teams" element={<TeamPage />} />
        <Route path="roster" element={<RosterPage />} />
        <Route path="roster/:fellowId" element={<FellowDetailPage />} />
        <Route path="profile" element={<Navigate to="/fellow/settings" replace />} />
        <Route path="settings" element={<SettingPage />} />
      </Route>
    </Routes>
  );
}
