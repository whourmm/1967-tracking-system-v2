import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { assignments, learningBlocks, specialCurriculum } from "../../data/mock";
import { cn } from "../../lib/cn";
import type { LearningLink } from "../../types";

// A single checkable item in the Learning System. `id` is a stable key used to
// persist completion; `defaultDone` seeds completion from existing data (e.g. a
// Google Form already submitted) before the fellow toggles anything.
interface Item extends LearningLink {
  id: string;
  defaultDone?: boolean;
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
function assignmentItems(blockId: string): Item[] {
  return assignments
    .filter((a) => a.block === blockId)
    .map((a) => ({
      id: `form:${a.id}`,
      label: a.title,
      url: a.formUrl,
      kind: "form" as const,
      meta: "Google Form",
      defaultDone: a.status === "submitted" || a.status === "graded",
    }));
}

// Turn a plain LearningLink (video/article/special) into a checkable Item.
function toItems(scope: string, links?: LearningLink[]): Item[] {
  return (links ?? []).map((l, i) => ({
    ...l,
    id: `${scope}:${i}:${l.url}`,
  }));
}

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
  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border px-3 py-3 transition",
        // Completed items recede into muted gray so attention goes to what's
        // left to do; pending items stay white with a colored accent.
        done
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
      )}
    >
      {/* Completion toggle */}
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
        <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
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

export default function LearningSystemPage() {
  const { isDone, toggle } = useCompletion();

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

      {/* Special sources live outside the block sequence. */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Special Sources
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Standalone materials that support the whole program.
          </p>
        </div>

        {specialCurriculum.map((item) => {
          const items = toItems(`special:${item.title}`, item.links);
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

      {/* Blocks */}
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

        {learningBlocks.map((block) => {
          const videos = toItems(`block:${block.id}:v`, block.videos);
          const articles = toItems(`block:${block.id}:a`, block.articles);
          const resources = [...videos, ...articles];
          const forms = assignmentItems(block.id);
          const all = [...resources, ...forms];
          const completed = all.filter(isDone).length;
          const allDone = all.length > 0 && completed === all.length;

          return (
            <Card key={block.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold",
                    allDone
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-brand-600 text-white"
                  )}
                >
                  {block.id}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                    Block {block.id}
                  </span>
                  <h3 className="text-base font-semibold leading-snug text-slate-900">
                    {block.title}
                  </h3>
                  {block.description && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {block.description}
                    </p>
                  )}
                </div>
                {/* Per-block progress */}
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold",
                    allDone
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {allDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {completed}/{all.length} done
                </span>
              </div>

              <div className="space-y-5 p-5">
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
            </Card>
          );
        })}
      </section>
    </div>
  );
}
