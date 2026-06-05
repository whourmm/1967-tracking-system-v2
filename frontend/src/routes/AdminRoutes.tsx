import type { RouteObject } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import AdminPlaceholder from "../pages/admin/AdminPlaceholder";

// Mock admin routes — every section renders a placeholder for now. The real
// pages are another teammate's task; this just establishes the path + layout.
export const adminRoutes: RouteObject = {
  path: "/admin",
  element: <AdminLayout />,
  children: [
    { index: true, element: <AdminPlaceholder title="Overview" /> },
    { path: "fellows", element: <AdminPlaceholder title="Fellows" /> },
    { path: "teams", element: <AdminPlaceholder title="Teams" /> },
    { path: "cases", element: <AdminPlaceholder title="Cases" /> },
    { path: "sprints", element: <AdminPlaceholder title="Sprints" /> },
    { path: "resources", element: <AdminPlaceholder title="Resources" /> },
    { path: "events", element: <AdminPlaceholder title="Upcoming Events" /> },
    { path: "assignments", element: <AdminPlaceholder title="Assignments" /> },
    {
      path: "announcement",
      element: <AdminPlaceholder title="Announcement" />,
    },
  ],
};
