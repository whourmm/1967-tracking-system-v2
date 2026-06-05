import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Search,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { assignments } from "../../data/mock";
import { daysUntil, deadlineLabel, formatDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { Assignment, AssignmentStatus } from "../../types";

type Filter = "all" | AssignmentStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
  { key: "submitted", label: "Submitted" },
  { key: "graded", label: "Graded" },
];

function count(status: Filter) {
  if (status === "all") return assignments.length;
  return assignments.filter((a) => a.status === status).length;
}

function AssignmentRow({ a }: { a: Assignment }) {
  const overdue = a.status === "overdue";
  const actionable = a.status === "pending" || a.status === "overdue";

  return (
    <div className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
          overdue ? "bg-brand-50 text-brand-600" : "bg-brand-50 text-brand-600"
        )}
      >
        <ClipboardList className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{a.title}</p>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            {a.sprint}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {a.description}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:w-44">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <div>
          <p className={cn("font-semibold", overdue ? "text-brand-600" : "text-slate-700")}>
            {deadlineLabel(a.deadline)}
          </p>
          <p className="text-slate-400">{formatDate(a.deadline)}</p>
        </div>
      </div>

      <div className="sm:w-28">
        <StatusBadge status={a.status} />
      </div>

      <div className="sm:w-32 sm:text-right">
        {actionable ? (
          <a
            href={a.formUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-500"
          >
            Submit
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : a.grade ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Grade: {a.grade}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400">Submitted</span>
        )}
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return assignments
      .filter((a) => (filter === "all" ? true : a.status === filter))
      .filter((a) =>
        a.title.toLowerCase().includes(query.trim().toLowerCase())
      )
      .sort((a, b) => daysUntil(a.deadline) - daysUntil(b.deadline));
  }, [filter, query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Assignments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your deliverables, deadlines, and submissions across all sprints.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(["pending", "overdue", "submitted", "graded"] as AssignmentStatus[]).map(
          (s) => (
            <Card key={s} className="p-4">
              <p className="text-2xl font-bold text-slate-900">{count(s)}</p>
              <div className="mt-1">
                <StatusBadge status={s} />
              </div>
            </Card>
          )
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                filter === f.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  filter === f.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {count(f.key)}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments…"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* List */}
      <Card>
        {visible.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {visible.map((a) => (
              <AssignmentRow key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              No assignments found
            </p>
            <p className="text-xs text-slate-400">
              Try a different filter or search term.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
