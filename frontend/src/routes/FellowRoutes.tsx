import type { RouteObject } from "react-router-dom";
import FellowLayout from "../components/layout/FellowLayout";
import FellowDashboard from "../pages/fellow/FellowDashboard";
import AssignmentsPage from "../pages/fellow/AssignmentsPage";
import LearningSystemPage from "../pages/fellow/LearningSystemPage";
import TeamPage from "../pages/fellow/team/TeamPage";
import ProfilePage from "../pages/fellow/profile/ProfilePage";
import SettingPage from "../pages/fellow/setting/SettingPage";
import RosterPage from "../pages/fellow/roster/RosterPage";
import FellowDetailPage from "../pages/fellow/roster/FellowDetailPage";

export const fellowRoutes: RouteObject = {
  path: "/fellow",
  element: <FellowLayout />,
  children: [
    { index: true, element: <FellowDashboard /> },
    { path: "assignments", element: <AssignmentsPage /> },
    { path: "learning", element: <LearningSystemPage /> },
    { path: "teams", element: <TeamPage /> },
    { path: "roster", element: <RosterPage /> },
    { path: "roster/:fellowId", element: <FellowDetailPage /> },
    { path: "profile", element: <ProfilePage /> },
    { path: "settings", element: <SettingPage /> },
  ],
};
