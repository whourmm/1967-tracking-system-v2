import {
  BookOpen,
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

// Build the "Submit" links for a block from the shared assignments list so the
// Learning System and Assignments pages stay in sync. The meta shows whether
// the Google Form has already been submitted.
function assignmentLinks(blockId: string): LearningLink[] {
  return assignments
    .filter((a) => a.block === blockId)
    .map((a) => {
      const done = a.status === "submitted" || a.status === "graded";
      return {
        label: a.title,
        url: a.formUrl,
        kind: "form" as const,
        meta: done ? "Submitted ✓" : "Google Form · to submit",
      };
    });
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

function LinkRow({ link }: { link: LearningLink }) {
  const meta = kindMeta[link.kind];
  const Icon = meta.icon;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          meta.classes
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-brand-700">
          {link.label}
        </span>
        {link.meta && (
          <span className="block truncate text-xs text-slate-400">
            {link.meta}
          </span>
        )}
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
    </a>
  );
}

function LinkGroup({
  label,
  icon: Icon,
  links,
}: {
  label: string;
  icon: typeof FileText;
  links?: LearningLink[];
}) {
  if (!links || links.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </h4>
        <span className="text-xs text-slate-300">{links.length}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <LinkRow key={l.url + l.label} link={l} />
        ))}
      </div>
    </div>
  );
}

export default function LearningSystemPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Learning System
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Work through each block — watch, read, then submit the assignments.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 ring-1 ring-slate-200">
          <GraduationCap className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold text-slate-700">
            {learningBlocks.length} blocks
          </span>
        </div>
      </div>

      {/* Special curriculum (outside any block) */}
      {specialCurriculum.map((item) => (
        <Card
          key={item.title}
          className="overflow-hidden border-brand-200 bg-brand-50/40"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Special
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
          <div className="grid gap-2 border-t border-brand-100 p-5 pt-4 sm:grid-cols-2">
            {item.links.map((l) => (
              <LinkRow key={l.url + l.label} link={l} />
            ))}
          </div>
        </Card>
      ))}

      {/* Blocks */}
      <div className="space-y-5">
        {learningBlocks.map((block) => (
          <Card key={block.id} className="overflow-hidden">
            <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
                {block.id}
              </span>
              <div className="min-w-0">
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
            </div>

            <div className="space-y-5 p-5">
              <LinkGroup label="Watch" icon={PlayCircle} links={block.videos} />
              <LinkGroup label="Read" icon={BookOpen} links={block.articles} />
              <LinkGroup
                label="Submit"
                icon={ClipboardList}
                links={assignmentLinks(block.id)}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
