import { BrowserRouter, Navigate, useRoutes } from "react-router-dom";
import { fellowRoutes } from "./routes/FellowRoutes";
import { adminRoutes } from "./routes/AdminRoutes";

function AppRoutes() {
  return useRoutes([
    fellowRoutes,
    adminRoutes,
    { path: "*", element: <Navigate to="/fellow" replace /> },
  ]);
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
