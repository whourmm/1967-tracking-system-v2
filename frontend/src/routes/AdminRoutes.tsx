import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import CaseFormPage from "../pages/admin/CaseFormPage";
import CaseManagement from "../pages/admin/CaseManagement";
import ResourceFormPage from "../pages/admin/ResourceFormPage";
import ResourcesPage from "../pages/admin/ResourcesPage";
import SprintManagement from "../pages/admin/SprintManagement";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">This admin screen is ready for the next implementation pass.</p>
      </header>
      <div className="card placeholder-page">No data connected yet.</div>
    </div>
  );
}

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
        <Route path="teams" element={<PlaceholderPage title="Teams" />} />
        <Route path="fellows" element={<PlaceholderPage title="Members" />} />
        <Route path="sprints" element={<SprintManagement />} />
        <Route path="events" element={<SprintManagement />} />
        <Route path="assignments" element={<PlaceholderPage title="Assignments" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
