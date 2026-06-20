import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { assignments, caseAssignments } from "../../data/mock";
import { deadlineLabel, formatDate, formatShortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { FellowOutletContext } from "../../components/layout/FellowLayout";
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

type QueueFilter = "pending" | "submitted" | "overdue";

const queueFilters: { key: QueueFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "overdue", label: "Overdue" },
];

function displayStatus(item: QueueItem): AssignmentStatus {
  if (item.kind === "learning") {
    return item.status === "graded" ? "submitted" : item.status;
  }

  return item.status === "reviewed" ? "submitted" : item.status;
}

function assignmentPriority(item: QueueItem) {
  const status = displayStatus(item);
  if (status === "overdue") return 0;
  if (status === "pending") return 1;
  return 2;
}

function sortByActionDate(a: QueueItem, b: QueueItem) {
  const priority = assignmentPriority(a) - assignmentPriority(b);
  if (priority !== 0) return priority;

  return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
}

function matchesFilter(item: QueueItem, filter: QueueFilter) {
  return displayStatus(item) === filter;
}

function filterCount(items: QueueItem[], filter: QueueFilter) {
  return items.filter((item) => matchesFilter(item, filter)).length;
}

function CurrentSprintCaseCard({
  assignment,
  sprintName,
}: {
  assignment: CaseAssignment;
  sprintName: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 sm:flex">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-600">
                {sprintName}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {assignment.company}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {assignment.caseTitle}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {assignment.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {assignment.assignedTeam}
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {assignment.deliverable}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                <CalendarDays className="h-3 w-3" />
                Due {formatShortDate(assignment.deadline)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
          <a
            href={assignment.briefUrl}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 sm:flex-none"
          >
            <FileText className="h-3.5 w-3.5" />
            Brief
          </a>
          <a
            href={assignment.submissionUrl}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-500 sm:flex-none"
          >
            Submit
            <ExternalLink className="h-4 w-4" />
          </a>
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
    <div className="flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_10.5rem_7rem_9rem] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 sm:flex">
          {isLearning ? (
            <ClipboardList className="h-5 w-5" />
          ) : (
            <Building2 className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-600"
            >
              {isLearning ? item.meta : "Case"}
            </span>
            <span className="ml-auto lg:hidden">
              <StatusBadge status={displayStatus(item)} />
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 lg:line-clamp-1">
            {item.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:contents">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-semibold",
                actionable ? "text-brand-600" : "text-slate-700"
              )}
            >
              {deadlineLabel(item.deadline)}
            </p>
            <p className="truncate text-slate-400">{formatDate(item.deadline)}</p>
          </div>
        </div>

        <div className="hidden lg:flex lg:items-center">
          <StatusBadge status={displayStatus(item)} />
        </div>

        <div className="shrink-0 lg:flex lg:justify-end">
          {actionable ? (
            <a
              href={item.actionUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-500"
            >
              Submit
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-500">
              Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const { selectedSprint } = useOutletContext<FellowOutletContext>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const currentSprintCase = caseAssignments.find(
    (assignment) => assignment.sprint === selectedSprint.name
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
      .filter((assignment) => assignment.sprint !== selectedSprint.name)
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
  }, [selectedSprint.name]);

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sprint case work is highlighted first. Learning tasks and other
            case assignments are queued below by action date.
          </p>
        </div>

        <div className="relative lg:w-80">
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
        <CurrentSprintCaseCard
          assignment={currentSprintCase}
          sprintName={selectedSprint.name}
        />
      ) : null}

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {queueFilters.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition",
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
