import type { AssignmentStatus } from "../../types";
import { statusMeta } from "../../lib/format";
import { cn } from "../../lib/cn";

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider ring-1 ring-inset",
        meta.classes
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
