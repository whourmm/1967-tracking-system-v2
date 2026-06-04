import type { SprintStatus } from "./sprintTypes";

function statusClass(status: SprintStatus) {
  if (status === "Current") return "status-badge success";
  if (status === "Upcoming") return "status-badge info";
  if (status === "Complete") return "status-badge muted";
  return "status-badge draft";
}

export default function StatusBadge({ status }: { status: SprintStatus }) {
  return <span className={statusClass(status)}>{status}</span>;
}
