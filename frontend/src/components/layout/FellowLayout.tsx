import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Home,
  Megaphone,
  Menu,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { currentFellow, notifications as mockNotifications, sprints } from "../../data/mock";
import { getCurrentUser } from "../../lib/auth";
import { cn } from "../../lib/cn";
import type { NotificationKind, Sprint } from "../../types";

export interface FellowOutletContext {
  selectedSprint: Sprint;
}

const notificationIcon: Record<NotificationKind, typeof Bell> = {
  submission: CheckCircle2,
  resource: BookOpen,
  team: Users,
  announcement: Megaphone,
  deadline: CalendarClock,
};

const mainNav = [
  { to: "/fellow", label: "Home", mobileLabel: "Home", icon: Home, end: true },
  {
    to: "/fellow/assignments",
    label: "Assignments",
    mobileLabel: "Tasks",
    icon: ClipboardList,
  },
  {
    to: "/fellow/learning",
    label: "Learning System",
    mobileLabel: "Learn",
    icon: BookOpen,
  },
  { to: "/fellow/teams", label: "My Team", mobileLabel: "Team", icon: Users },
  {
    to: "/fellow/roster",
    label: "Fellows Roster",
    mobileLabel: "Roster",
    icon: GraduationCap,
  },
];

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
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
        <div className="fixed left-3 right-3 top-14 z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
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

function SprintSwitcher({
  selectedSprint,
  sprintIndex,
  onPrevious,
  onNext,
  onSelect,
}: {
  selectedSprint: Sprint;
  sprintIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  const atStart = sprintIndex === 0;
  const atEnd = sprintIndex === sprints.length - 1;
  const sprintLabel = selectedSprint.name.split(" · ")[0];

  return (
    <div
      className="min-w-0 justify-self-center lg:justify-self-auto"
      title={selectedSprint.name}
    >
      {/* Hamburger sizes: arrows are fiddly without a pointer, so the same
          label + dots becomes a transparent trigger that opens the native
          picker and jumps straight to any sprint. */}
      <div className="relative rounded-md px-2 py-1 transition hover:bg-slate-100/70 lg:hidden">
        <div className="flex min-h-10 items-center justify-center gap-1">
          <p className="truncate text-sm font-semibold leading-tight text-slate-900">
            {sprintLabel}
          </p>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </div>
        <select
          value={sprintIndex}
          onChange={(e) => onSelect(Number(e.target.value))}
          aria-label="Select sprint"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {sprints.map((s, i) => (
            <option key={s.id} value={i}>
              {s.name}
              {s.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop (sidebar visible): previous/next arrows with progress dots */}
      <div className="hidden min-h-10 items-center justify-center gap-2 lg:flex">
        <button
          type="button"
          onClick={onPrevious}
          disabled={atStart}
          aria-label="Previous sprint"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 px-2 text-center">
          <p className="w-20 truncate text-sm font-semibold leading-tight text-slate-900">
            {sprintLabel}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1">
            {sprints.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === sprintIndex ? "w-5 ring-1 ring-offset-1" : "w-1.5",
                  s.isCurrent
                    ? "bg-brand-500 ring-brand-200"
                    : "bg-slate-300 ring-slate-200"
                )}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          aria-label="Next sprint"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Topbar({
  selectedSprint,
  sprintIndex,
  onPreviousSprint,
  onNextSprint,
  onSelectSprint,
  mobileMenuOpen,
  onOpenMobileMenu,
}: {
  selectedSprint: Sprint;
  sprintIndex: number;
  onPreviousSprint: () => void;
  onNextSprint: () => void;
  onSelectSprint: (index: number) => void;
  mobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
}) {
  const user = getCurrentUser();
  const displayName = user?.role === "fellow" ? user.name : currentFellow.name;
  const initials =
    user?.role === "fellow" ? user.initials : currentFellow.avatarInitials;

  return (
    <header className="fixed top-0 right-0 left-0 z-20 grid min-h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur sm:px-4 lg:left-64 lg:flex lg:min-h-16 lg:px-8">
      <div className="flex min-w-0 items-center lg:hidden">
        <MobileFellowMenuButton
          open={mobileMenuOpen}
          onOpen={onOpenMobileMenu}
        />
      </div>
      <SprintSwitcher
        selectedSprint={selectedSprint}
        sprintIndex={sprintIndex}
        onPrevious={onPreviousSprint}
        onNext={onNextSprint}
        onSelect={onSelectSprint}
      />
      <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        <NotificationBell />
        <NavLink
          to="/fellow/profile"
          className={({ isActive }) =>
            cn(
              "hidden items-center gap-2.5 rounded-md border py-1.5 pl-1.5 pr-3 transition-colors lg:flex",
              isActive
                ? "border-brand-300 bg-brand-50"
                : "border-slate-200 hover:border-brand-200 hover:bg-brand-50/50"
            )
          }
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">
            {displayName}
          </span>
        </NavLink>
      </div>
    </header>
  );
}

function MobileFellowMenuButton({
  open,
  onOpen,
}: {
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
      aria-label="Open menu"
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

function MobileFellowDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const menuItems = [
    ...mainNav,
    { to: "/fellow/profile", label: "Profile", mobileLabel: "Profile", icon: User },
    { to: "/fellow/settings", label: "Settings", mobileLabel: "Settings", icon: Settings },
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 top-0 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-2xl lg:hidden"
        aria-label="Fellow menu"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">
              <span className="text-brand-600">1967</span> Fellowship
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Fellow Portal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Fellow navigation">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
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
                          isActive ? "text-brand-600" : "text-slate-400"
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
      </aside>
    </>
  );
}

export default function FellowLayout() {
  const location = useLocation();
  const currentIndex = Math.max(
    sprints.findIndex((s) => s.isCurrent),
    0
  );
  const [sprintIndex, setSprintIndex] = useState(currentIndex);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedSprint = sprints[sprintIndex];
  const goPreviousSprint = () => setSprintIndex((i) => Math.max(i - 1, 0));
  const goNextSprint = () =>
    setSprintIndex((i) => Math.min(i + 1, sprints.length - 1));

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
      <Sidebar />
      <div className="min-w-0 lg:pl-64">
        <Topbar
          selectedSprint={selectedSprint}
          sprintIndex={sprintIndex}
          onPreviousSprint={goPreviousSprint}
          onNextSprint={goNextSprint}
          onSelectSprint={setSprintIndex}
          mobileMenuOpen={mobileMenuOpen}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="mx-auto max-w-6xl px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-24">
          <Outlet context={{ selectedSprint } satisfies FellowOutletContext} />
        </main>
      </div>
      <MobileFellowDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
