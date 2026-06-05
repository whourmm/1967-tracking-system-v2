import type { AssignmentStatus } from "../types";

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

// Status pills follow DESIGN.md: success = green (#10B981), warning = amber
// (#F59E0B), error = brand red. Submitted is a neutral state. Backgrounds use
// ~10% tint of the status color per the spec.
export const statusMeta: Record<
  AssignmentStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-500/10 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  submitted: {
    label: "Submitted",
    classes: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
  overdue: {
    label: "Overdue",
    classes: "bg-brand-600/10 text-brand-700 ring-brand-600/20",
    dot: "bg-brand-600",
  },
  graded: {
    label: "Graded",
    classes: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
};
