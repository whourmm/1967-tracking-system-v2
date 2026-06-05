import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Search,
  Users,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { currentFellow } from "../../data/mock";

const mainNav = [
  { to: "/fellow", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/fellow/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/fellow/learning", label: "Learning System", icon: BookOpen },
];

const soonNav = [
  { label: "My Team", icon: Users },
  { label: "Fellows Roster", icon: GraduationCap },
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
          Fellow Portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <ul className="space-y-1">
          {mainNav.map((item) => (
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

        <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Coming soon
        </p>
        <ul className="space-y-1">
          {soonNav.map((item) => (
            <li key={item.label}>
              <span className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400">
                <item.icon className="h-5 w-5 shrink-0 text-slate-300" />
                {item.label}
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                  Soon
                </span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Help + profile */}
      <div className="border-t border-slate-100 p-3">
        <a
          href="#"
          className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LifeBuoy className="h-5 w-5 text-slate-400" />
          Help & Support
        </a>
        <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {currentFellow.avatarInitials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentFellow.name}
            </p>
            <p className="truncate text-xs text-slate-500">{currentFellow.team}</p>
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
      <div className="relative hidden w-full max-w-sm md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search assignments, resources…"
          className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2.5 rounded-md border border-slate-200 py-1.5 pl-1.5 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
            {currentFellow.avatarInitials}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            {currentFellow.name}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function FellowLayout() {
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
