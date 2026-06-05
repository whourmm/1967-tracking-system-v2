import { useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  PlayCircle,
  Search,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { resources } from "../../data/mock";
import { cn } from "../../lib/cn";
import type { Resource, ResourceType } from "../../types";

type Filter = "ALL" | ResourceType;

const typeMeta: Record<
  ResourceType,
  { label: string; icon: typeof FileText; classes: string; accent: string }
> = {
  CASE: {
    label: "Case Study",
    icon: FileText,
    classes: "bg-violet-50 text-violet-700 ring-violet-600/20",
    accent: "bg-violet-500",
  },
  LECTURE: {
    label: "Lecture",
    icon: PlayCircle,
    classes: "bg-sky-50 text-sky-700 ring-sky-600/20",
    accent: "bg-sky-500",
  },
  ARTICLE: {
    label: "Article",
    icon: BookOpen,
    classes: "bg-amber-50 text-amber-700 ring-amber-600/20",
    accent: "bg-amber-500",
  },
};

const filters: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "CASE", label: "Case Studies" },
  { key: "LECTURE", label: "Lectures" },
  { key: "ARTICLE", label: "Articles" },
];

function ResourceCard({ r }: { r: Resource }) {
  const meta = typeMeta[r.type];
  const Icon = meta.icon;
  const started = r.progress > 0;
  const done = r.progress === 100;

  return (
    <Card className="group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Cover */}
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Icon className="h-9 w-9 text-slate-300" />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
            meta.classes
          )}
        >
          {meta.label}
        </span>
        {done && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            Completed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium text-brand-600">{r.tag}</span>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">
          {r.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
          {r.description}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{r.author}</span>
          <span>{r.duration}</span>
        </div>

        {/* Progress */}
        {started && !done && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${r.progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          className={cn(
            "mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold transition",
            done
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-brand-600 text-white hover:bg-brand-500"
          )}
        >
          {done ? "Review" : started ? "Continue" : "Start learning"}
        </button>
      </div>
    </Card>
  );
}

export default function LearningSystemPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return resources
      .filter((r) => (filter === "ALL" ? true : r.type === filter))
      .filter((r) =>
        r.name.toLowerCase().includes(query.trim().toLowerCase())
      );
  }, [filter, query]);

  const inProgress = resources.filter((r) => r.progress > 0 && r.progress < 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Learning System
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Case studies, lectures, and articles curated for your fellowship
            journey.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 ring-1 ring-slate-200">
          <GraduationCap className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold text-slate-700">
            {resources.filter((r) => r.progress === 100).length}/
            {resources.length}
          </span>
          <span className="text-sm text-slate-400">completed</span>
        </div>
      </div>

      {/* Continue learning banner */}
      {inProgress.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10">
                <PlayCircle className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-300">
                  Pick up where you left off
                </p>
                <p className="mt-0.5 text-base font-semibold">
                  {inProgress[0].name}
                </p>
                <p className="text-xs text-slate-400">
                  {inProgress[0].progress}% complete · {inProgress[0].duration}
                </p>
              </div>
            </div>
            <button className="shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Resume
            </button>
          </div>
        </Card>
      )}

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
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the library…"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <ResourceCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              No resources found
            </p>
            <p className="text-xs text-slate-400">
              Try a different category or search term.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
