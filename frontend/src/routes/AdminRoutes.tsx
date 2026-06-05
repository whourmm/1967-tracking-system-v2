import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import CaseFormPage from "../pages/admin/CaseFormPage";
import CaseManagement from "../pages/admin/CaseManagement";
import ResourceFormPage from "../pages/admin/ResourceFormPage";
import ResourcesPage from "../pages/admin/ResourcesPage";
import SprintManagement from "../pages/admin/SprintManagement";
// [Anda]-owned admin pages.
import FellowManagement from "../pages/admin/FellowManagement";
import TeamBuilder from "../pages/admin/TeamBuilder";
import EventManagement from "../pages/admin/EventManagement";
import FormTracker from "../pages/admin/FormTracker";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="cases" element={<CaseManagement />} />
        <Route path="cases/new" element={<CaseFormPage />} />
        <Route path="cases/:caseId/edit" element={<CaseFormPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="resources/new" element={<ResourceFormPage />} />
        <Route path="resources/:resourceId/edit" element={<ResourceFormPage />} />
        <Route path="teams" element={<TeamBuilder />} />
        <Route path="fellows" element={<FellowManagement />} />
        <Route path="sprints" element={<SprintManagement />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="assignments" element={<FormTracker />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
