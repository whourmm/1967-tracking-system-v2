import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Rocket,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "../../lib/cn";

// Admin portal sections. Owners noted for the team — not shown in the UI.
const adminNav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true }, // [Arm]
  { to: "/admin/fellows", label: "Fellows", icon: Users }, // [Anda]
  { to: "/admin/teams", label: "Teams", icon: UsersRound }, // [Anda]
  { to: "/admin/cases", label: "Cases", icon: Briefcase }, // [Arm]
  { to: "/admin/sprints", label: "Sprints", icon: Rocket }, // [Arm]
  { to: "/admin/resources", label: "Resources", icon: ClipboardList }, // [Arm]
  { to: "/admin/events", label: "Upcoming Events", icon: CalendarDays }, // [Anda]
  { to: "/admin/assignments", label: "Assignments", icon: ClipboardList }, // [Anda]
  { to: "/admin/announcement", label: "Announcement", icon: Megaphone }, // optional
];

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 flex-col justify-center border-b border-slate-100 px-6">
        <p className="text-base font-bold tracking-tight text-slate-900">
          <span className="text-brand-600">1967</span> Fellowship
        </p>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Admin Portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Manage
        </p>
        <ul className="space-y-1">
          {adminNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive
                          ? "text-brand-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            AD
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">
              Admin
            </p>
            <p className="truncate text-xs text-slate-500">Program Office</p>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-8 backdrop-blur">
      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 rounded-md border border-slate-200 py-1.5 pl-1.5 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
            AD
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
