import type { AssignmentStatus, AssignmentSubmissionStatusName, AssignmentSubmitStatus } from "../types";

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Whole days from today until `iso` (negative if in the past). Uses a fixed
// "today" so the mock data always reads sensibly during the demo.
const TODAY = new Date("2026-06-05T00:00:00");

export function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const ms = target.getTime() - TODAY.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function deadlineLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d > 1) return `Due in ${d} days`;
  if (d === -1) return "1 day overdue";
  return `${Math.abs(d)} days overdue`;
}

export function assignmentSubmissionStatusName(
  submitStatus: AssignmentSubmitStatus,
  deadlineIso: string,
  now = TODAY
): AssignmentSubmissionStatusName {
  if (submitStatus === 1) return "submitted";

  const deadline = new Date(`${deadlineIso}T23:59:59`);
  return deadline.getTime() < now.getTime() ? "overdue" : "pending";
}

// Status pills follow DESIGN.md: success = green (#10B981), warning = amber
// (#F59E0B), error = brand red. Submitted is a neutral state. Backgrounds use
// ~10% tint of the status color per the spec.
export const statusMeta: Record<
  AssignmentStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30",
    dot: "bg-amber-500",
  },
  submitted: {
    label: "Submitted",
    classes: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/30",
    dot: "bg-slate-400",
  },
  overdue: {
    label: "Overdue",
    classes: "bg-brand-600/10 text-brand-700 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/30",
    dot: "bg-brand-600",
  },
  graded: {
    label: "Graded",
    classes: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    dot: "bg-emerald-500",
  },
};
