import { useEffect, useState } from "react";
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
import {
  api,
  mapFellowAssignment,
  type FellowAssignmentResponse,
  type FellowLearning,
  type FellowLearningResource,
  type FellowLearningSection,
} from "../../lib/api";
import { cn } from "../../lib/cn";
import type { AssignmentStatus, LearningLinkKind } from "../../types";

type Item =
  | {
      source: "resource";
      id: string;
      resourceId: number;
      label: string;
      url: string;
      kind: LearningLinkKind;
      meta?: string;
      description?: string;
      done: boolean;
    }
  | {
      source: "form";
      id: string;
      assignmentId: number;
      label: string;
      url: string;
      kind: "form";
      meta?: string;
      description?: string;
      status: AssignmentStatus;
      done: boolean;
    };

const kindLabels: Record<LearningLinkKind, string> = {
  video: "Video",
  article: "Article",
  form: "Form",
  pdf: "PDF",
  external: "External link",
};

const kindMeta: Record<
  LearningLinkKind,
  { icon: typeof FileText; classes: string }
> = {
  video: { icon: PlayCircle, classes: "bg-rose-50 text-rose-600" },
  article: { icon: BookOpen, classes: "bg-amber-50 text-amber-600" },
  form: { icon: ClipboardList, classes: "bg-emerald-50 text-emerald-600" },
  pdf: { icon: FileText, classes: "bg-sky-50 text-sky-600" },
  external: { icon: ExternalLink, classes: "bg-slate-100 text-slate-500" },
};

function resourceKind(type?: string | null): LearningLinkKind {
  switch ((type ?? "").toUpperCase()) {
    case "VIDEO":
    case "LECTURE":
      return "video";
    case "ARTICLE":
    case "GUIDE":
      return "article";
    case "PDF":
      return "pdf";
    default:
      return "external";
  }
}

function resourceItem(resource: FellowLearningResource): Item {
  return {
    source: "resource",
    id: `resource:${resource.id}`,
    resourceId: resource.id,
    label: resource.name ?? "Untitled resource",
    url: resource.url ?? "",
    kind: resourceKind(resource.type),
    meta: [resource.duration, resource.author, resource.tag].filter(Boolean).join(" · "),
    description: resource.description ?? undefined,
    done: Boolean(resource.read_at),
  };
}

function assignmentItem(item: FellowAssignmentResponse): Item {
  const assignment = mapFellowAssignment(item);
  return {
    source: "form",
    id: `form:${assignment.id}`,
    assignmentId: assignment.id,
    label: assignment.title,
    url: assignment.formUrl,
    kind: "form",
    meta: assignment.deadline ? `Due ${assignment.deadline}` : "Google Form",
    description: assignment.description,
    status: assignment.status,
    done: assignment.status === "submitted" || assignment.status === "graded",
  };
}

function sectionCode(section: FellowLearningSection) {
  return section.code ?? (section.id ? String(section.id) : "shared");
}

function sectionItems(section: FellowLearningSection) {
  return {
    resources: section.resources.map(resourceItem),
    forms: section.assignments.map(assignmentItem),
  };
}

function matchesItem(item: Item, query: string, kind: string, status: StatusFilter) {
  const q = query.toLowerCase().trim();
  if (
    q &&
    !item.label.toLowerCase().includes(q) &&
    !(item.meta ?? "").toLowerCase().includes(q) &&
    !(item.description ?? "").toLowerCase().includes(q)
  ) {
    return false;
  }
  if (kind && item.kind !== kind) return false;
  if (status && (status === "done") !== item.done) return false;
  return true;
}

function statusLabel(status?: AssignmentStatus) {
  if (status === "submitted") return "Submitted";
  if (status === "graded") return "Graded";
  if (status === "overdue") return "Overdue";
  return "Pending";
}

function statusClasses(status?: AssignmentStatus) {
  if (status === "submitted") return "bg-emerald-50 text-emerald-700";
  if (status === "graded") return "bg-sky-50 text-sky-700";
  if (status === "overdue") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function LinkRow({
  item,
  marking,
  onMarkRead,
}: {
  item: Item;
  marking: boolean;
  onMarkRead: (resourceId: number) => void;
}) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;
  const canOpen = Boolean(item.url);

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-3 transition",
        item.done
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40",
      )}
    >
      {item.source === "resource" && (
        <button
          type="button"
          onClick={() => onMarkRead(item.resourceId)}
          disabled={item.done || marking}
          aria-pressed={item.done}
          aria-label={item.done ? "Resource completed" : "Mark resource complete"}
          className="shrink-0 disabled:cursor-default"
        >
          {item.done ? (
            <CheckCircle2 className="h-5 w-5 text-slate-400" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300 transition group-hover:text-brand-400" />
          )}
        </button>
      )}

      {canOpen ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <LinkContent item={item} icon={Icon} classes={meta.classes} />
        </a>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 opacity-70">
          <LinkContent item={item} icon={Icon} classes={meta.classes} />
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
            No link
          </span>
        </div>
      )}

      {item.source === "form" && item.status && (
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", statusClasses(item.status))}>
          {statusLabel(item.status)}
        </span>
      )}
      {item.source === "resource" && !item.done && (
        <button
          type="button"
          onClick={() => onMarkRead(item.resourceId)}
          disabled={marking}
          className="shrink-0 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:cursor-wait disabled:text-slate-400 disabled:ring-slate-200"
        >
          {marking ? "Saving..." : "Mark read"}
        </button>
      )}
    </div>
  );
}

function LinkContent({
  item,
  icon: Icon,
  classes,
}: {
  item: Item;
  icon: typeof FileText;
  classes: string;
}) {
  return (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
          item.done ? "bg-slate-100 text-slate-400" : classes,
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            item.done
              ? "text-slate-400 line-through"
              : "text-slate-800 group-hover:text-brand-700",
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
      {item.source === "resource" && item.url && (
        <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
      )}
    </>
  );
}

function LinkGroup({
  label,
  icon: Icon,
  items,
  markingId,
  onMarkRead,
}: {
  label: string;
  icon: typeof FileText;
  items: Item[];
  markingId: number | null;
  onMarkRead: (resourceId: number) => void;
}) {
  if (items.length === 0) return null;
  const completed = items.filter((item) => item.done).length;
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
            marking={item.source === "resource" && markingId === item.resourceId}
            onMarkRead={onMarkRead}
          />
        ))}
      </div>
    </div>
  );
}

type StatusFilter = "" | "todo" | "done";

const emptyLearning: FellowLearning = { blocks: [], special_sections: [] };

export default function LearningSystemPage() {
  const [learning, setLearning] = useState<FellowLearning>(emptyLearning);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [blockFilter, setBlockFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  async function loadLearning() {
    setLoading(true);
    setError("");
    try {
      const next = await api.fellow.learning();
      setLearning(next);
      setExpandedBlocks(new Set(next.blocks.map(sectionCode)));
    } catch (err) {
      setLearning(emptyLearning);
      setError(err instanceof Error ? err.message : "Could not load learning system");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLearning();
  }, []);

  async function markRead(resourceId: number) {
    setMarkingId(resourceId);
    setError("");
    try {
      const response = await api.fellow.markResourceRead(resourceId);
      setLearning((current) => ({
        blocks: current.blocks.map((section) => updateResourceRead(section, resourceId, response.read_at)),
        special_sections: current.special_sections.map((section) => updateResourceRead(section, resourceId, response.read_at)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark resource read");
    } finally {
      setMarkingId(null);
    }
  }

  const allSections = [...learning.special_sections, ...learning.blocks];
  const allKinds = [
    ...new Set<LearningLinkKind>(
      allSections.flatMap((section) => {
        const { resources, forms } = sectionItems(section);
        return [...resources, ...forms].map((item) => item.kind);
      }),
    ),
  ];

  const specialSections = learning.special_sections
    .filter((section) => !blockFilter || blockFilter === "special" || blockFilter === sectionCode(section))
    .map((section) => filteredSection(section, query, kind, status))
    .filter((section) => section.resources.length + section.forms.length > 0);

  const blockSections = learning.blocks
    .filter((section) => !blockFilter || blockFilter === sectionCode(section))
    .map((section) => filteredSection(section, query, kind, status))
    .filter((section) => section.resources.length + section.forms.length > 0);

  const nothingVisible = specialSections.length === 0 && blockSections.length === 0;

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
      label: `Type: ${kindLabels[kind as LearningLinkKind]}`,
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

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Loading learning system...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Learning System
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Work through resources, then complete the forms inside each block.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 ring-1 ring-slate-200">
          <GraduationCap className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold text-slate-700">
            {learning.blocks.length} blocks
          </span>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos, articles, forms..."
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
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
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
                  ...learning.blocks.map((section) => ({
                    value: sectionCode(section),
                    label: `Block ${sectionCode(section)} · ${section.title}`,
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

          {specialSections.map(({ source: section, resources, forms }) => (
            <Card
              key={sectionCode(section)}
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
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="mt-0.5 max-w-xl text-sm text-slate-500">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-5 border-t border-brand-100 p-4 pt-4 sm:p-5">
                <LinkGroup
                  label="Resources"
                  icon={BookOpen}
                  items={resources}
                  markingId={markingId}
                  onMarkRead={markRead}
                />
                <LinkGroup
                  label="Submit"
                  icon={ClipboardList}
                  items={forms}
                  markingId={markingId}
                  onMarkRead={markRead}
                />
              </div>
            </Card>
          ))}
        </section>
      )}

      {blockSections.length > 0 && (
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Learning Blocks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Each block keeps its resources and submission forms in separate sections.
            </p>
          </div>

          {blockSections.map(({ source: section, all, resources, forms }) => {
            const completed = all.filter((item) => item.done).length;
            const allDone = all.length > 0 && completed === all.length;
            const code = sectionCode(section);
            const isExpanded = expandedBlocks.has(code);

            return (
              <Card key={code} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleBlock(code)}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? `Collapse block ${code}` : `Expand block ${code}`}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-5"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition",
                      allDone ? "text-emerald-600" : "text-brand-600",
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                        Block {code}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          allDone
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {allDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {completed}/{all.length} done
                      </span>
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-slate-900">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {section.description}
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
                      markingId={markingId}
                      onMarkRead={markRead}
                    />
                    <LinkGroup
                      label="Submit"
                      icon={ClipboardList}
                      items={forms}
                      markingId={markingId}
                      onMarkRead={markRead}
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

function updateResourceRead(section: FellowLearningSection, resourceId: number, readAt: string): FellowLearningSection {
  return {
    ...section,
    resources: section.resources.map((resource) =>
      resource.id === resourceId ? { ...resource, read_at: resource.read_at ?? readAt } : resource,
    ),
  };
}

function filteredSection(section: FellowLearningSection, query: string, kind: string, status: StatusFilter) {
  const { resources, forms } = sectionItems(section);
  const filteredResources = resources.filter((item) => matchesItem(item, query, kind, status));
  const filteredForms = forms.filter((item) => matchesItem(item, query, kind, status));
  return {
    source: section,
    resources: filteredResources,
    forms: filteredForms,
    all: [...filteredResources, ...filteredForms],
  };
}
