import {
  BookOpen,
  Box,
  CalendarDays,
  ChevronDown,
  Download,
  FileText,
  FolderOpen,
  Grid2X2,
  Plus,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const navGroups = [
  {
    label: "Program",
    items: [
      { label: "Overview", to: "/admin", icon: Grid2X2 },
      { label: "Teams", to: "/admin/teams", icon: Users, count: 6 },
      { label: "Members", to: "/admin/fellows", icon: Users, count: 24 },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Cases", to: "/admin/cases", icon: FileText, count: 3 },
      { label: "Resources", to: "/admin/resources", icon: BookOpen, count: 4 },
    ],
  },
  {
    label: "Schedule",
    items: [
      { label: "Sprints", to: "/admin/sprints", icon: CalendarDays, count: 3 },
      { label: "Assignments", to: "/admin/assignments", icon: FolderOpen, count: 2 },
    ],
  },
];

const routeLabels: Record<string, string> = {
  "/admin": "Overview",
  "/admin/cases": "Cases",
  "/admin/cases/new": "Add case",
  "/admin/resources": "Resources",
  "/admin/resources/new": "Add resource",
  "/admin/teams": "Teams",
  "/admin/fellows": "Members",
  "/admin/sprints": "Sprint & Schedule",
  "/admin/events": "Sprint & Schedule",
  "/admin/assignments": "Assignments",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const pageLabel = routeLabels[pathname]
    ?? (pathname.startsWith("/admin/cases/") ? "Edit case" : undefined)
    ?? (pathname.startsWith("/admin/resources/") ? "Edit resource" : undefined)
    ?? "Overview";

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Box size={18} />
          </span>
          <div>
            <p className="brand-title">Catalyst</p>
            <p className="brand-subtitle">COHORT ADMIN</p>
          </div>
        </div>

        {navGroups.map((group) => (
          <nav className="nav-section" key={group.label} aria-label={group.label}>
            <div className="nav-heading">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  end={item.to === "/admin"}
                  key={item.to}
                  to={item.to}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.count ? <span className="nav-badge">{item.count}</span> : null}
                </NavLink>
              );
            })}
          </nav>
        ))}

        <div className="submission-window">
          <strong>Submission window</strong>
          <span>Closes in 9 days - Sprint 3 deliverable</span>
          <div className="progress-track" style={{ marginTop: 12 }}>
            <span className="progress-fill" style={{ width: "61%" }} />
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div className="breadcrumb">
            Program <span aria-hidden="true">&gt;</span> <strong>{pageLabel}</strong>
          </div>
          <div className="topbar-actions">
            <button className="select-button" type="button">
              <span className="select-kicker">Cohort</span>
              Spring 2026
              <ChevronDown size={14} />
            </button>
            <button className="button" type="button">
              <Plus size={14} />
              New cohort
            </button>
            <button className="button primary" type="button">
              <Download size={14} />
              Export
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
