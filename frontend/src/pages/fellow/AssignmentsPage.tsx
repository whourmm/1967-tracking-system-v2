import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { assignments, caseAssignments, currentSprint } from "../../data/mock";
import { deadlineLabel, formatDate, formatShortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type {
  Assignment,
  AssignmentStatus,
  CaseAssignment,
  CaseAssignmentStatus,
} from "../../types";

type QueueItem =
  | {
      kind: "learning";
      id: string;
      title: string;
      description: string;
      meta: string;
      deadline: string;
      status: AssignmentStatus;
      actionUrl: string;
      secondaryUrl?: never;
      deliverable?: never;
      raw: Assignment;
    }
  | {
      kind: "case";
      id: string;
      title: string;
      description: string;
      meta: string;
      deadline: string;
      status: CaseAssignmentStatus;
      actionUrl: string;
      secondaryUrl: string;
      deliverable: string;
      raw: CaseAssignment;
    };

type QueueFilter =
  | "all"
  | "upcoming"
  | "overdue"
  | "pending"
  | "submitted"
  | "completed";

const queueFilters: { key: QueueFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Graded/Reviewed" },
];

function assignmentPriority(item: QueueItem) {
  if (item.kind === "learning") {
    if (item.status === "overdue") return 0;
    if (item.status === "pending") return 1;
    return 3;
  }

  if (item.status === "pending") return 1;
  if (item.status === "submitted") return 2;
  return 3;
}

function sortByActionDate(a: QueueItem, b: QueueItem) {
  const priority = assignmentPriority(a) - assignmentPriority(b);
  if (priority !== 0) return priority;

  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
}

function matchesFilter(item: QueueItem, filter: QueueFilter) {
  if (filter === "all") return true;
  if (filter === "upcoming") return item.status === "pending";
  if (filter === "overdue") {
    return item.kind === "learning" && item.status === "overdue";
  }
  if (filter === "pending") return item.status === "pending";
  if (filter === "submitted") return item.status === "submitted";
  return (
    (item.kind === "learning" && item.status === "graded") ||
    (item.kind === "case" && item.status === "reviewed")
  );
}

function filterCount(items: QueueItem[], filter: QueueFilter) {
  return items.filter((item) => matchesFilter(item, filter)).length;
}

function displayStatus(item: QueueItem): AssignmentStatus {
  if (item.kind === "learning") return item.status;
  if (item.status === "reviewed") return "graded";
  return item.status;
}

function CurrentSprintCaseCard({
  assignment,
}: {
  assignment: CaseAssignment;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/15">
                <CalendarClock className="h-3.5 w-3.5" />
                Current sprint case
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                {currentSprint.name}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                Due {formatShortDate(assignment.deadline)}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-white">
              {assignment.caseTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-brand-100">
              {assignment.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                {assignment.company}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                {assignment.assignedTeam}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                {assignment.deliverable}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={assignment.briefUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Brief
            </a>
            <a
              href={assignment.submissionUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-950/25 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-brand-950/35"
            >
              Submit
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  const isLearning = item.kind === "learning";
  const actionable =
    (isLearning && (item.status === "pending" || item.status === "overdue")) ||
    (!isLearning && item.status === "pending");

  return (
    <div className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
        {isLearning ? (
          <ClipboardList className="h-5 w-5" />
        ) : (
          <Building2 className="h-5 w-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-600"
          >
            {isLearning ? item.meta : "Case"}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {item.description}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:w-44">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <div>
          <p
            className={cn(
              "font-semibold",
              actionable ? "text-brand-600" : "text-slate-700"
            )}
          >
            {deadlineLabel(item.deadline)}
          </p>
          <p className="text-slate-400">{formatDate(item.deadline)}</p>
        </div>
      </div>

      <div className="sm:w-28">
        <StatusBadge status={displayStatus(item)} />
      </div>

      <div className="flex gap-2 sm:w-40 sm:justify-end">
        {actionable ? (
          <a
            href={item.actionUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-500"
          >
            Submit
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            Done
          </span>
        )}
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("all");
  const currentSprintCase = caseAssignments.find(
    (assignment) => assignment.sprint === currentSprint.name
  );

  const queueItems = useMemo<QueueItem[]>(() => {
    const learningItems: QueueItem[] = assignments.map((assignment) => ({
      kind: "learning",
      id: `learning:${assignment.id}`,
      title: assignment.title,
      description: assignment.description,
      meta: `Block ${assignment.block}`,
      deadline: assignment.deadline,
      status: assignment.status,
      actionUrl: assignment.formUrl,
      raw: assignment,
    }));

    const otherCaseItems: QueueItem[] = caseAssignments
      .filter((assignment) => assignment.sprint !== currentSprint.name)
      .map((assignment) => ({
        kind: "case",
        id: `case:${assignment.id}`,
        title: `${assignment.company} · ${assignment.caseTitle}`,
        description: assignment.description,
        meta: assignment.sprint,
        deadline: assignment.deadline,
        status: assignment.status,
        actionUrl: assignment.submissionUrl,
        secondaryUrl: assignment.briefUrl,
        deliverable: assignment.deliverable,
        raw: assignment,
      }));

    return [...learningItems, ...otherCaseItems].sort(sortByActionDate);
  }, []);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return queueItems
      .filter((item) => matchesFilter(item, filter))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [
          item.title,
          item.description,
          item.meta,
          item.kind === "case" ? item.deliverable : "",
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      });
  }, [filter, query, queueItems]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sprint case work is highlighted first. Learning tasks and other
            case assignments are queued below by action date.
          </p>
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments..."
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {currentSprintCase ? (
        <CurrentSprintCaseCard assignment={currentSprintCase} />
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {queueFilters.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              filter === item.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {item.label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                filter === item.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {filterCount(queueItems, item.key)}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Assignment queue"
          subtitle="Sorted by action date"
        />
        {visible.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {visible.map((item) => (
              <QueueRow key={item.id} item={item} />
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
              Try a different search term.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
