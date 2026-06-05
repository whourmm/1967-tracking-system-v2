import type { RouteObject } from "react-router-dom";
import FellowLayout from "../components/layout/FellowLayout";
import FellowDashboard from "../pages/fellow/FellowDashboard";
import AssignmentsPage from "../pages/fellow/AssignmentsPage";
import LearningSystemPage from "../pages/fellow/LearningSystemPage";
import TeamsPage from "../pages/fellow/TeamsPage";

export const fellowRoutes: RouteObject = {
  path: "/fellow",
  element: <FellowLayout />,
  children: [
    { index: true, element: <FellowDashboard /> },
    { path: "assignments", element: <AssignmentsPage /> },
    { path: "learning", element: <LearningSystemPage /> },
    { path: "teams", element: <TeamsPage /> },
  ],
};
