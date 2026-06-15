import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { FellowRecord } from "../../types";

type FellowLinkRecord = Pick<FellowRecord, "id" | "name" | "initials"> & Partial<FellowRecord>;

const sizeClasses = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-7 w-7 text-[10px]",
  lg: "h-9 w-9 text-xs",
  xl: "h-20 w-20 text-2xl",
};

type Tone = "brand" | "slate" | "emerald";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-600 text-white",
  slate: "bg-slate-400 text-white",
  emerald: "bg-emerald-600 text-white",
};

export function adminFellowProfilePath(fellowId: number) {
  return `/admin/fellows/${fellowId}`;
}

export function FellowAvatar({
  fellow,
  size = "md",
  tone = "brand",
  className,
}: {
  fellow: FellowLinkRecord;
  size?: keyof typeof sizeClasses;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        sizeClasses[size],
        toneClasses[tone],
        className
      )}
      aria-hidden="true"
    >
      {fellow.initials}
    </span>
  );
}

export function FellowNameLink({
  fellow,
  children,
  className,
}: {
  fellow: FellowLinkRecord;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={adminFellowProfilePath(fellow.id)}
      state={{ fellow }}
      title={`View ${fellow.name} profile`}
      className={cn("font-semibold text-slate-900 transition hover:text-brand-700", className)}
    >
      {children ?? fellow.name}
    </Link>
  );
}
