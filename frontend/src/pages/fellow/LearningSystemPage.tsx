import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  PlayCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { learningBlocks, specialCurriculum } from "../../data/mock";
import { cn } from "../../lib/cn";
import { useFellowAssignments } from "../../lib/assignmentStore";
import type { Assignment, LearningLink } from "../../types";

// A single checkable item in the Learning System. `id` is a stable key used to
// persist completion; `defaultDone` seeds completion from existing data (e.g. a
// Google Form already submitted) before the fellow toggles anything.
interface Item extends LearningLink {
  id: string;
  defaultDone?: boolean;
  status?: "pending" | "submitted" | "overdue" | "graded";
}

// --- Completion persistence --------------------------------------------------
// There's no backend/auth wired yet, so a fellow's "what I've completed" is kept
// in localStorage. The store holds explicit overrides; when an id is absent we
// fall back to the item's defaultDone.
const STORE_KEY = "learning-completion-v1";

function loadStore(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function useCompletion() {
  const [store, setStore] = useState<Record<string, boolean>>(loadStore);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  const isDone = useCallback(
    (item: Item) =>
      item.id in store ? store[item.id] : Boolean(item.defaultDone),
    [store]
  );

  const toggle = useCallback(
    (item: Item) =>
      setStore((s) => ({
        ...s,
        [item.id]: !(item.id in s ? s[item.id] : Boolean(item.defaultDone)),
      })),
    []
  );

  return { isDone, toggle };
}

// Build the "Submit" items for a block from the shared assignments list, so the
// Learning System and Assignments pages stay in sync. A form starts complete if
// it has already been submitted/graded.
function assignmentItems(blockId: string, assignments: Assignment[]): Item[] {
  return assignments
    .filter((a) => a.block === blockId)
    .map((a) => ({
      id: `form:${a.id}`,
      label: a.title,
      url: a.formUrl,
      kind: "form" as const,
      meta: "Google Form",
      defaultDone: a.status === "submitted" || a.status === "graded",
      status: a.status,
    }));
}

// Turn a plain LearningLink (video/article/special) into a checkable Item.
function toItems(scope: string, links?: LearningLink[]): Item[] {
  return (links ?? []).map((l, i) => ({
    ...l,
    id: `${scope}:${i}:${l.url}`,
  }));
}

const kindLabels: Record<LearningLink["kind"], string> = {
  video: "Video",
  article: "Article",
  form: "Form",
  pdf: "PDF",
  external: "External link",
};

// Item kinds that actually appear in the data, so the Type filter only offers
// meaningful options.
const kindMeta: Record<
  LearningLink["kind"],
  { icon: typeof FileText; classes: string }
> = {
  video: { icon: PlayCircle, classes: "bg-rose-50 text-rose-600" },
  article: { icon: BookOpen, classes: "bg-amber-50 text-amber-600" },
  form: { icon: ClipboardList, classes: "bg-emerald-50 text-emerald-600" },
  pdf: { icon: FileText, classes: "bg-sky-50 text-sky-600" },
  external: { icon: ExternalLink, classes: "bg-slate-100 text-slate-500" },
};

function LinkRow({
  item,
  done,
  onToggle,
}: {
  item: Item;
  done: boolean;
  onToggle: () => void;
}) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;
  const isForm = item.kind === "form";

  const statusLabel = item.status === "submitted" ? "Submitted" :
                      item.status === "graded" ? "Graded" :
                      item.status === "overdue" ? "Overdue" : "Pending";
  const statusColor = item.status === "submitted" ? "bg-emerald-50 text-emerald-700" :
                      item.status === "graded" ? "bg-sky-50 text-sky-700" :
                      item.status === "overdue" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600";

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-3 transition",
        // Completed items recede into muted gray so attention goes to what's
        // left to do; pending items stay white with a colored accent.
        done
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
      )}
    >
      {/* Completion toggle - only for non-form items */}
      {!isForm && (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? "Mark as not done" : "Mark as complete"}
          className="shrink-0"
        >
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-slate-400" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300 transition group-hover:text-brand-400" />
          )}
        </button>
      )}

      {/* Link area */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
            done ? "bg-slate-100 text-slate-400" : meta.classes
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              done
                ? "text-slate-400 line-through"
                : "text-slate-800 group-hover:text-brand-700"
            )}
          >
            {item.label}
          </span>
          {item.meta && (
            <span className="block truncate text-xs text-slate-400">
              {item.meta}
            </span>
          )}
        </span>
        {isForm && item.status && (
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", statusColor)}>
            {statusLabel}
          </span>
        )}
        {!isForm && (
          <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
        )}
      </a>
    </div>
  );
}

function LinkGroup({
  label,
  icon: Icon,
  items,
  isDone,
  toggle,
}: {
  label: string;
  icon: typeof FileText;
  items: Item[];
  isDone: (item: Item) => boolean;
  toggle: (item: Item) => void;
}) {
  if (items.length === 0) return null;
  const completed = items.filter(isDone).length;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </h4>
        <span className="text-xs text-slate-300">
          {completed}/{items.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <LinkRow
            key={item.id}
            item={item}
            done={isDone(item)}
            onToggle={() => toggle(item)}
          />
        ))}
      </div>
    </div>
  );
}

type StatusFilter = "" | "todo" | "done";

export default function LearningSystemPage() {
  const assignments = useFellowAssignments();
  const { isDone, toggle } = useCompletion();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [blockFilter, setBlockFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const allKinds = [
    ...new Set<LearningLink["kind"]>([
      ...specialCurriculum.flatMap((c) => (c.links ?? []).map((l) => l.kind)),
      ...learningBlocks.flatMap((b) =>
        [...(b.videos ?? []), ...(b.articles ?? [])].map((l) => l.kind)
      ),
      ...(assignments.length > 0 ? (["form"] as const) : []),
    ]),
  ];

  const matches = (item: Item) => {
    const q = query.toLowerCase().trim();
    if (
      q &&
      !item.label.toLowerCase().includes(q) &&
      !(item.meta ?? "").toLowerCase().includes(q)
    )
      return false;
    if (kind && item.kind !== kind) return false;
    if (status && (status === "done") !== isDone(item)) return false;
    return true;
  };

  // Sections are filtered up-front so empty cards/headings can be hidden and a
  // global empty state shown when nothing matches.
  const specialSections = (blockFilter && blockFilter !== "special"
    ? []
    : specialCurriculum
  )
    .map((item) => ({
      source: item,
      items: toItems(`special:${item.title}`, item.links).filter(matches),
    }))
    .filter((s) => s.items.length > 0);

  const blockSections = learningBlocks
    .filter((block) => !blockFilter || blockFilter === block.id)
    .map((block) => {
      const videos = toItems(`block:${block.id}:v`, block.videos);
      const articles = toItems(`block:${block.id}:a`, block.articles);
      const resources = [...videos, ...articles];
      const forms = assignmentItems(block.id, assignments);
      return {
        block,
        all: [...resources, ...forms],
        resources: resources.filter(matches),
        forms: forms.filter(matches),
      };
    })
    .filter((s) => s.resources.length + s.forms.length > 0);

  const nothingVisible =
    specialSections.length === 0 && blockSections.length === 0;

  const clearFilters = () => {
    setKind("");
    setStatus("");
    setBlockFilter("");
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const activeFilters = [
    kind && {
      label: `Type: ${kindLabels[kind as LearningLink["kind"]]}`,
      clear: () => setKind(""),
    },
    status && {
      label: status === "done" ? "Status: Completed" : "Status: To do",
      clear: () => setStatus(""),
    },
    blockFilter && {
      label:
        blockFilter === "special"
          ? "Section: Special sources"
          : `Block ${blockFilter}`,
      clear: () => setBlockFilter(""),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Learning System
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Work through special sources separately, then complete the resources
            and submissions inside each block.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 ring-1 ring-slate-200">
          <GraduationCap className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold text-slate-700">
            {learningBlocks.length} blocks
          </span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos, articles, forms…"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
              showFilters || activeFilters.length > 0
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            {[
              {
                label: "Type",
                value: kind,
                setter: setKind,
                options: allKinds.map((k) => ({
                  value: k,
                  label: kindLabels[k],
                })),
                placeholder: "All types",
              },
              {
                label: "Status",
                value: status,
                setter: (v: string) => setStatus(v as StatusFilter),
                options: [
                  { value: "todo", label: "To do" },
                  { value: "done", label: "Completed" },
                ],
                placeholder: "All statuses",
              },
              {
                label: "Block",
                value: blockFilter,
                setter: setBlockFilter,
                options: [
                  { value: "special", label: "Special sources" },
                  ...learningBlocks.map((b) => ({
                    value: b.id,
                    label: `Block ${b.id} · ${b.title}`,
                  })),
                ],
                placeholder: "All blocks",
              },
            ].map(({ label, value, setter, options, placeholder }) => (
              <div key={label}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                </label>
                <select
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300"
                >
                  <option value="">{placeholder}</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Active filters:</span>
            {activeFilters.map(({ label, clear }) => (
              <span
                key={label}
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200"
              >
                {label}
                <button type="button" onClick={clear}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-slate-500 transition hover:text-brand-600"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {nothingVisible && (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <Search className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            No learning items match your search
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              clearFilters();
            }}
            className="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Clear all filters
          </button>
        </Card>
      )}

      {/* Special sources live outside the block sequence. */}
      {specialSections.length > 0 && (
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Special Sources
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Standalone materials that support the whole program.
          </p>
        </div>

        {specialSections.map(({ source: item, items }) => {
          return (
            <Card
              key={item.title}
              className="overflow-hidden border-brand-200 bg-brand-50/40"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                      Special source
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-0.5 max-w-xl text-sm text-slate-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-2 border-t border-brand-100 p-4 pt-4 sm:grid-cols-2 sm:p-5">
                {items.map((it) => (
                  <LinkRow
                    key={it.id}
                    item={it}
                    done={isDone(it)}
                    onToggle={() => toggle(it)}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </section>
      )}

      {/* Blocks */}
      {blockSections.length > 0 && (
      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Learning Blocks
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Each block keeps its resources and submission forms in separate
            sections.
          </p>
        </div>

        {blockSections.map(({ block, all, resources, forms }) => {
          const completed = all.filter(isDone).length;
          const allDone = all.length > 0 && completed === all.length;
          const isExpanded = expandedBlocks.has(block.id);

          return (
            <Card key={block.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleBlock(block.id)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? `Collapse block ${block.id}` : `Expand block ${block.id}`}
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-5"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition",
                    allDone ? "text-emerald-600" : "text-brand-600"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                      Block {block.id}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        allDone
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {allDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {completed}/{all.length} done
                    </span>
                  </div>
                  <h3 className="text-base font-semibold leading-snug text-slate-900">
                    {block.title}
                  </h3>
                  {block.description && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {block.description}
                    </p>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-5 border-t border-slate-100 p-5">
                  <LinkGroup
                    label="Resources"
                    icon={BookOpen}
                    items={resources}
                    isDone={isDone}
                    toggle={toggle}
                  />
                  <LinkGroup
                    label="Submit"
                    icon={ClipboardList}
                    items={forms}
                    isDone={isDone}
                    toggle={toggle}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </section>
      )}
    </div>
  );
}
