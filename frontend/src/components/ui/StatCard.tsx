import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../lib/cn";

// Compact KPI tile used across the admin pages — an icon chip beside a
// label/value pair. `color` carries both text + background (e.g.
// "text-brand-600 bg-brand-50").
export function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <p className="text-base font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
