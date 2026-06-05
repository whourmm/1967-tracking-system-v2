import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Home,
  LifeBuoy,
  Megaphone,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { currentFellow, notifications as mockNotifications } from "../../data/mock";
import type { NotificationKind } from "../../types";

const notificationIcon: Record<NotificationKind, typeof Bell> = {
  submission: CheckCircle2,
  resource: BookOpen,
  team: Users,
  announcement: Megaphone,
  deadline: CalendarClock,
};

const mainNav = [
  { to: "/fellow", label: "Home", icon: Home, end: true },
  { to: "/fellow/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/fellow/learning", label: "Learning System", icon: BookOpen },
  { to: "/fellow/teams", label: "My Team", icon: Users },
  { to: "/fellow/roster", label: "Fellows Roster", icon: GraduationCap },
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

      </nav>

      {/* Help + profile */}
      <div className="border-t border-slate-100 p-3">
        <NavLink
          to="/fellow/settings"
          className={({ isActive }) =>
            cn(
              "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-brand-600" : "text-slate-400"
                )}
              />
              Settings
            </>
          )}
        </NavLink>
        <a
          href="#"
          className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LifeBuoy className="h-5 w-5 text-slate-400" />
          Help & Support
        </a>
      </div>
    </aside>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative rounded-md p-2 transition-colors",
          open
            ? "bg-slate-100 text-slate-700"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        )}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Notifications
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
                  {unread} new
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-slate-400">
                You’re all caught up.
              </li>
            ) : (
              items.map((n) => {
                const Icon = notificationIcon[n.kind];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50",
                        !n.read && "bg-brand-50/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          n.read
                            ? "bg-slate-100 text-slate-500"
                            : "bg-brand-100 text-brand-600"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500">{n.body}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {n.time}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
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
        <NotificationBell />
        <NavLink
          to="/fellow/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md border py-1.5 pl-1.5 pr-3 transition-colors",
              isActive
                ? "border-brand-300 bg-brand-50"
                : "border-slate-200 hover:border-brand-200 hover:bg-brand-50/50"
            )
          }
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
            {currentFellow.avatarInitials}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            {currentFellow.name}
          </span>
        </NavLink>
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
