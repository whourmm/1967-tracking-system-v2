import { useState } from "react";
import {
  BookOpen,
  Box,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Grid2X2,
  Plus,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { adminInitials, adminProfile, COHORTS } from "../../data/adminMock";
import { getCurrentUser } from "../../lib/auth";

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
      { label: "Assignments", to: "/admin/assignments", icon: FolderOpen, count: 2 },
    ],
  },
  {
    label: "Schedule",
    items: [
      { label: "Sprints", to: "/admin/sprints", icon: CalendarDays, count: 3 },
      { label: "Upcoming Events", to: "/admin/events", icon: CalendarClock, count: 4 },
    ],
  },
];

const routeLabels: Record<string, string> = {
  "/admin": "Overview",
  "/admin/cases": "Cases",
  "/admin/resources": "Resources",
  "/admin/teams": "Teams",
  "/admin/fellows": "Members",
  "/admin/sprints": "Sprint & Schedule",
  "/admin/events": "Upcoming Events",
  "/admin/assignments": "Assignments",
  "/admin/profile": "My Profile",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const user = getCurrentUser();
  const avatarInitials = user?.role === "admin" ? user.initials : adminInitials;
  const displayName = user?.role === "admin" ? user.name : adminProfile.name;
  const pageLabel = routeLabels[pathname]
    ?? (pathname.startsWith("/admin/cases/") ? "Edit case" : undefined)
    ?? (pathname.startsWith("/admin/resources/") ? "Edit resource" : undefined)
    ?? "Overview";

  // Cohort selector + creation (cosmetic mock — scopes nothing yet).
  const [cohorts, setCohorts] = useState<string[]>(COHORTS);
  const [cohort, setCohort] = useState(COHORTS[0]);
  const [cohortMenuOpen, setCohortMenuOpen] = useState(false);

  function addCohort() {
    const name = window.prompt("Name the new cohort:", "Summer 2026");
    if (name && name.trim()) {
      const trimmed = name.trim();
      setCohorts((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]));
      setCohort(trimmed);
    }
  }

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
            <div className="relative">
              <button className="select-button" type="button" onClick={() => setCohortMenuOpen((o) => !o)}>
                <span className="select-kicker">Cohort</span>
                {cohort}
                <ChevronDown size={14} />
              </button>
              {cohortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCohortMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-md border border-admin-border bg-white py-1 shadow-lg">
                    {cohorts.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setCohort(c); setCohortMenuOpen(false); }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${c === cohort ? "font-semibold text-admin-red" : "text-slate-700"}`}
                      >
                        {c}
                        {c === cohort && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="button" type="button" onClick={addCohort}>
              <Plus size={14} />
              New cohort
            </button>
            <NavLink
              to="/admin/profile"
              aria-label="My profile"
              title="My profile"
              className={({ isActive }) =>
                `flex h-9 items-center gap-2 rounded-full border px-1.5 pr-3 transition ${
                  isActive ? "border-admin-red bg-admin-red-soft" : "border-admin-border bg-white hover:bg-admin-red-soft/50"
                }`
              }
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-red text-[11px] font-bold text-white">
                {avatarInitials}
              </span>
              <span className="hidden text-xs font-bold text-admin-text sm:block">
                {displayName}
              </span>
            </NavLink>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
