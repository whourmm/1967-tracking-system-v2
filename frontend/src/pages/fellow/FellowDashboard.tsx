import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Megaphone,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  assignments,
  currentFellow,
  currentSprint,
  recentActivity,
  resources,
  teamMembers,
} from "../../data/mock";
import {
  daysUntil,
  deadlineLabel,
  formatDate,
  formatShortDate,
} from "../../lib/format";
import { cn } from "../../lib/cn";
import type { ActivityItem } from "../../types";

const stats = [
  {
    label: "Assignments due",
    value: assignments.filter((a) => a.status === "pending").length,
    sub: "this sprint",
    icon: ClipboardList,
    color: "text-amber-600 bg-amber-50",
  },
  {
    label: "Completed",
    value: assignments.filter(
      (a) => a.status === "graded" || a.status === "submitted"
    ).length,
    sub: "all time",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Learning progress",
    value:
      Math.round(
        resources.reduce((s, r) => s + r.progress, 0) / resources.length
      ) + "%",
    sub: "across resources",
    icon: BookOpen,
    color: "text-brand-600 bg-brand-50",
  },
  {
    label: "Overdue",
    value: assignments.filter((a) => a.status === "overdue").length,
    sub: "needs attention",
    icon: Clock,
    color: "text-brand-600 bg-brand-50",
  },
];

const activityIcon: Record<ActivityItem["kind"], typeof CheckCircle2> = {
  submission: CheckCircle2,
  resource: BookOpen,
  team: UserPlus,
  announcement: Megaphone,
};

export default function FellowDashboard() {
  const sprintTotal = daysUntil(currentSprint.deadline) + 18; // mock span
  const sprintLeft = Math.max(daysUntil(currentSprint.deadline), 0);
  const sprintProgress = Math.min(
    Math.round(((sprintTotal - sprintLeft) / sprintTotal) * 100),
    100
  );

  const upcoming = [...assignments]
    .filter((a) => a.status === "pending" || a.status === "overdue")
    .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline))
    .slice(0, 3);

  const continueLearning = resources
    .filter((r) => r.progress > 0 && r.progress < 100)
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {currentFellow.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {currentFellow.cohort} · {currentFellow.team} — here’s what’s
            happening this sprint.
          </p>
        </div>
        <Link
          to="/fellow/assignments"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500"
        >
          View assignments
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md",
                  s.color
                )}
              >
                <s.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {s.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">{s.label}</p>
            <p className="text-xs text-slate-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current sprint */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
              <div className="flex items-center gap-2 text-brand-100">
                <CalendarClock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Current sprint
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold">{currentSprint.name}</h2>
              <p className="mt-1 max-w-xl text-sm text-brand-100">
                {currentSprint.description}
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-brand-100">
                  <span>Progress</span>
                  <span>{sprintProgress}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-brand-100">
                  <span>Started {formatShortDate(currentSprint.startsOn)}</span>
                  <span className="h-1 w-1 rounded-full bg-brand-300" />
                  <span className="font-semibold text-white">
                    {sprintLeft} days left · due{" "}
                    {formatShortDate(currentSprint.deadline)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Upcoming assignments */}
          <Card>
            <CardHeader
              title="Upcoming assignments"
              subtitle="Sorted by nearest deadline"
              action={
                <Link
                  to="/fellow/assignments"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  See all
                </Link>
              }
            />
            <ul className="divide-y divide-slate-100">
              {upcoming.map((a) => {
                const overdue = a.status === "overdue";
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                        overdue
                          ? "bg-brand-50 text-brand-600"
                          : "bg-brand-50 text-brand-600"
                      )}
                    >
                      <ClipboardList className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-500">Block {a.block}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          overdue ? "text-brand-600" : "text-slate-600"
                        )}
                      >
                        {deadlineLabel(a.deadline)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(a.deadline)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Team */}
          <Card>
            <CardHeader title={currentFellow.team} subtitle="Your team" />
            <ul className="space-y-1 p-3">
              {teamMembers.map((m) => (
                <li
                  key={m.name}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {m.name}
                    </p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Continue learning */}
          <Card>
            <CardHeader
              title="Continue learning"
              action={
                <Link
                  to="/fellow/learning"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Library
                </Link>
              }
            />
            <div className="space-y-3 p-4">
              {continueLearning.map((r) => (
                <Link
                  key={r.id}
                  to="/fellow/learning"
                  className="block rounded-md border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-brand-600" />
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {r.name}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${r.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {r.progress}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader title="Recent activity" />
            <ul className="space-y-4 p-5">
              {recentActivity.map((item) => {
                const Icon = activityIcon[item.kind];
                return (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm text-slate-700">{item.text}</p>
                      <p className="text-xs text-slate-400">{item.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="flex items-center gap-2 rounded-lg bg-brand-50 p-4 text-brand-700">
            <TrendingUp className="h-5 w-5" />
            <p className="text-xs font-medium">
              You’re on track this sprint. Keep the momentum going!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
