import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown, Edit3, FileText, GraduationCap, Plus, Trash2, UserX, Video } from "lucide-react";
import { motion } from "framer-motion";
import { FellowAvatar, FellowNameLink } from "../../components/admin/FellowProfileLink";
import ResourceFormDialog, { type ResourceFormValues } from "../../components/admin/ResourceFormDialog";
import { StatCard } from "../../components/ui/StatCard";
import { learningReadIds, resourceReadIds } from "../../data/adminMock";
import { allFellows, learningBlocks, specialCurriculum } from "../../data/mock";
import { cn } from "../../lib/cn";
import type { ResourceItem } from "../../components/admin/contentTypes";

const initialResources: ResourceItem[] = [
  {
    id: "pitch-deck",
    title: "Demo Day pitch deck template",
    type: "Template",
    summary: "10-slide structure used by last cohort's top three teams.",
    url: "catalyst.io/r/deck",
  },
  {
    id: "team-agreement",
    title: "Team working agreement (Notion)",
    type: "Guide",
    summary: "Fill-in template for roles, comms cadence and decision rules.",
    url: "catalyst.io/r/agreement",
  },
  {
    id: "scoping-recording",
    title: "Recording: scoping a 1-week build",
    type: "Video",
    summary: "32-min walkthrough from a returning mentor.",
    url: "catalyst.io/r/scoping",
  },
  {
    id: "standup-playbook",
    title: "Cross-timezone standup playbook",
    type: "Guide",
    summary: "How SEA-spanning teams keep async standups tight.",
    url: "catalyst.io/r/standup",
  },
];

type TrackableItem = {
  id: string;
  title: string;
  type: string;
  summary: string;
  url: string;
  readIds: number[];
  source: "resource" | "learning";
};

function learningItems(): TrackableItem[] {
  const specialItems = specialCurriculum.flatMap((section, sectionIndex) =>
    section.links.map((link, linkIndex) => ({
      id: `learning:special:${sectionIndex}:${linkIndex}`,
      title: link.label,
      type: link.kind === "pdf" ? "PDF" : "Link",
      summary: section.title,
      url: link.url,
      readIds: learningReadIds[`learning:special:${sectionIndex}:${linkIndex}`] ?? [],
      source: "learning" as const,
    }))
  );

  const blockItems = learningBlocks.flatMap((block) => [
    ...(block.videos ?? []).map((link, index) => ({
      id: `learning:block:${block.id}:video:${index}`,
      title: link.label,
      type: "Video",
      summary: `Block ${block.id} - ${block.title}`,
      url: link.url,
      readIds: learningReadIds[`learning:block:${block.id}:video:${index}`] ?? [],
      source: "learning" as const,
    })),
    ...(block.articles ?? []).map((link, index) => ({
      id: `learning:block:${block.id}:article:${index}`,
      title: link.label,
      type: "Article",
      summary: `Block ${block.id} - ${block.title}`,
      url: link.url,
      readIds: learningReadIds[`learning:block:${block.id}:article:${index}`] ?? [],
      source: "learning" as const,
    })),
  ]);

  return [...specialItems, ...blockItems];
}

function ReaderBreakdown({ readIds }: { readIds: number[] }) {
  const read = allFellows.filter((f) => readIds.includes(f.id));
  const unread = allFellows.filter((f) => !readIds.includes(f.id));

  const fellowChip = (tone: "read" | "unread") => (fellow: (typeof allFellows)[number]) => (
    <span
      key={fellow.id}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-xs",
        tone === "read"
          ? "border-emerald-200 bg-emerald-50 text-slate-900"
          : "border-slate-200 bg-white text-slate-500"
      )}
    >
      <FellowAvatar fellow={fellow} size="sm" tone={tone === "read" ? "emerald" : "slate"} />
      <FellowNameLink fellow={fellow} className={cn("text-xs", tone === "read" ? "text-slate-900" : "text-slate-500")} />
    </span>
  );

  return (
    <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Read ({read.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {read.length ? read.map(fellowChip("read")) : <span className="text-xs text-slate-400">No readers yet</span>}
        </div>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <UserX className="h-3.5 w-3.5" />
          Not read ({unread.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {unread.length ? unread.map(fellowChip("unread")) : <span className="text-xs text-slate-400">Everyone has read this</span>}
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sharedItems = useMemo<TrackableItem[]>(
    () =>
      resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        summary: resource.summary,
        url: resource.url,
        readIds: resourceReadIds[resource.id] ?? [],
        source: "resource",
      })),
    [resources]
  );
  const learning = useMemo(learningItems, []);
  const trackedItems = [...sharedItems, ...learning];
  const totalPossibleReads = trackedItems.length * allFellows.length;
  const totalReads = trackedItems.reduce((sum, item) => sum + item.readIds.length, 0);
  const avgReadRate = totalPossibleReads ? Math.round((totalReads / totalPossibleReads) * 100) : 0;
  const unreadFellows = trackedItems.length
    ? allFellows.filter((fellow) => trackedItems.some((item) => !item.readIds.includes(fellow.id))).length
    : 0;

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item: ResourceItem) {
    setEditing(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function handleSave(values: ResourceFormValues) {
    if (editing) {
      setResources((cur) => cur.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
    } else {
      setResources((cur) => [{ id: `resource-${Date.now()}`, ...values }, ...cur]);
    }
    closeForm();
  }

  function remove(item: ResourceItem) {
    if (window.confirm(`Delete "${item.title}"?`)) {
      setResources((cur) => cur.filter((r) => r.id !== item.id));
      if (expanded === item.id) setExpanded(null);
    }
  }

  function renderTrackedItem(item: TrackableItem, index: number) {
    const Icon = item.type === "Video" ? Video : item.source === "learning" ? BookOpen : FileText;
    const pct = allFellows.length ? Math.round((item.readIds.length / allFellows.length) * 100) : 0;
    const open = expanded === item.id;

    return (
      <motion.article
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-[#dfe5f1] bg-white p-4"
        initial={{ opacity: 0, y: 12 }}
        key={item.id}
        transition={{ delay: index * 0.03 }}
      >
        <div className="flex items-start gap-4">
          <div className="doc-icon shrink-0"><Icon size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="item-title">{item.title}</p>
              <span className={`pill ${item.type === "Video" ? "red" : ""}`}>{item.type}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                {item.readIds.length} / {allFellows.length} read
              </span>
            </div>
            <p className="item-summary">{item.summary}</p>
            <p className="resource-meta">{item.url}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {item.source === "resource" && (
              <>
                <button className="icon-link" type="button" aria-label={`Edit ${item.title}`} onClick={() => openEdit(resources.find((r) => r.id === item.id)!)} >
                  <Edit3 size={15} />
                </button>
                <button className="icon-link" type="button" aria-label={`Delete ${item.title}`} onClick={() => remove(resources.find((r) => r.id === item.id)!)} >
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button
              className="icon-link"
              type="button"
              aria-label={`${open ? "Hide" : "View"} readers for ${item.title}`}
              onClick={() => setExpanded(open ? null : item.id)}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>
          </div>
        </div>
        {open && <ReaderBreakdown readIds={item.readIds} />}
      </motion.article>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-heading-row">
          <div>
            <h1 className="page-title">Resources</h1>
            <p className="page-subtitle">Templates, guides and recordings the whole cohort can pull from.</p>
          </div>
          <button className="round-button" type="button" onClick={openCreate}>
            <Plus size={15} />
            Add resource
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={BookOpen} label="Tracked items" value={trackedItems.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={CheckCircle2} label="Avg. read rate" value={`${avgReadRate}%`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={UserX} label="Need follow-up" value={unreadFellows} color="text-amber-600 bg-amber-50" />
        <StatCard icon={GraduationCap} label="Fellows" value={allFellows.length} color="text-sky-600 bg-sky-50" />
      </div>

      <div className="content-stack">
        <section className="card list-card">
          <h2 className="list-title">Shared resources</h2>
          <p className="list-subtitle">{resources.length} item{resources.length === 1 ? "" : "s"}</p>
          <div className="grid gap-3">
            {sharedItems.length ? sharedItems.map(renderTrackedItem) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
                No shared resources yet.
              </p>
            )}
          </div>
        </section>

        <section className="card list-card">
          <h2 className="list-title">Learning materials</h2>
          <p className="list-subtitle">{learning.length} item{learning.length === 1 ? "" : "s"} from the fellow learning system</p>
          <div className="grid gap-3">
            {learning.length ? learning.map(renderTrackedItem) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
                No learning materials configured.
              </p>
            )}
          </div>
        </section>
      </div>

      {showForm && <ResourceFormDialog initial={editing} onClose={closeForm} onSave={handleSave} />}
    </div>
  );
}
