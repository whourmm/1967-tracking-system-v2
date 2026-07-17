import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown, Edit3, FileText, GraduationCap, Plus, Trash2, UserX, Video } from "lucide-react";
import { motion } from "framer-motion";
import ResourceFormDialog, { type ResourceFormValues } from "../../components/admin/ResourceFormDialog";
import { StatCard } from "../../components/ui/StatCard";
import { allFellows, learningBlocks, resources as fellowResources, specialCurriculum } from "../../data/mock";
import { cn } from "../../lib/cn";
import { api, type AdminResource } from "../../lib/api";
import type { ResourceItem } from "../../components/admin/contentTypes";

const initialResources: ResourceItem[] = fellowResources.map((resource) => ({
  id: String(resource.id),
  title: resource.name,
  type: resource.type === "LECTURE" ? "Video" : "Guide",
  summary: resource.description,
  url: resource.url ?? "",
}));

type TrackableItem = {
  id: string;
  title: string;
  type: string;
  summary: string;
  url: string;
  readCount: number;
  total: number;
  source: "resource" | "learning";
};

function learningItems(readCounts: Record<string, number>, total: number): TrackableItem[] {
  const specialItems = specialCurriculum.flatMap((section, sectionIndex) =>
    section.links.map((link, linkIndex) => ({
      id: String(link.resourceId ?? `learning:special:${sectionIndex}:${linkIndex}`),
      title: link.label,
      type: link.kind === "pdf" ? "PDF" : "Link",
      summary: section.title,
      url: link.url,
      readCount: readCounts[String(link.resourceId)] ?? 0,
      total,
      source: "learning" as const,
    }))
  );

  const blockItems = learningBlocks.flatMap((block) => [
    ...(block.videos ?? []).map((link, index) => ({
      id: String(link.resourceId ?? `learning:block:${block.id}:video:${index}`),
      title: link.label,
      type: "Video",
      summary: `Block ${block.id} - ${block.title}`,
      url: link.url,
      readCount: readCounts[String(link.resourceId)] ?? 0,
      total,
      source: "learning" as const,
    })),
    ...(block.articles ?? []).map((link, index) => ({
      id: String(link.resourceId ?? `learning:block:${block.id}:article:${index}`),
      title: link.label,
      type: "Article",
      summary: `Block ${block.id} - ${block.title}`,
      url: link.url,
      readCount: readCounts[String(link.resourceId)] ?? 0,
      total,
      source: "learning" as const,
    })),
  ]);

  return [...specialItems, ...blockItems];
}

function ReaderBreakdown({ readCount, total }: { readCount: number; total: number }) {
  return (
    <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Read ({readCount})
        </p>
        <p className="text-xs text-slate-500">Reported by the backend.</p>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <UserX className="h-3.5 w-3.5" />
          Not read ({Math.max(total - readCount, 0)})
        </p>
        <p className="text-xs text-slate-500">Reader identities are not exposed by this endpoint.</p>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function loadResources() {
    try {
      const [items, statuses] = await Promise.all([api.admin.listResources(), api.admin.resourceReadStatus()]);
      setResources(items.map((item) => ({
        id: String(item.id),
        title: item.name ?? "Untitled resource",
        type: item.type === "VIDEO" || item.type === "LECTURE" ? "Video" : item.type === "TEMPLATE" ? "Template" : "Guide",
        summary: item.description ?? "",
        url: item.url ?? "",
      })));
      setReadCounts(Object.fromEntries(statuses.map((status) => [String(status.resource_id), status.read])));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load resources");
    }
  }

  useEffect(() => {
    void loadResources();
  }, []);

  const sharedItems = useMemo<TrackableItem[]>(
    () =>
      resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        summary: resource.summary,
        url: resource.url,
        readCount: readCounts[resource.id] ?? 0,
        total: allFellows.length,
        source: "resource",
      })),
    [resources, readCounts]
  );
  const learning = useMemo(() => learningItems(readCounts, allFellows.length), [readCounts]);
  const trackedItems = [...sharedItems, ...learning];
  const totalPossibleReads = trackedItems.length * allFellows.length;
  const totalReads = trackedItems.reduce((sum, item) => sum + item.readCount, 0);
  const avgReadRate = totalPossibleReads ? Math.round((totalReads / totalPossibleReads) * 100) : 0;
  const unreadFellows = trackedItems.reduce((max, item) => Math.max(max, item.total - item.readCount), 0);

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

  async function handleSave(values: ResourceFormValues) {
    const payload: Partial<AdminResource> = {
      name: values.title,
      type: values.type === "Video" ? "VIDEO" : values.type === "Template" ? "TEMPLATE" : "ARTICLE",
      url: values.url,
      description: values.summary,
    };
    try {
      if (editing) {
        await api.admin.updateResource(Number(editing.id), payload);
      } else {
        await api.admin.createResource(payload);
      }
      await loadResources();
      closeForm();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not save resource");
    }
  }

  async function remove(item: ResourceItem) {
    if (window.confirm(`Delete "${item.title}"?`)) {
      try {
        await api.admin.deleteResource(Number(item.id));
        await loadResources();
        if (expanded === item.id) setExpanded(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Could not delete resource");
      }
    }
  }

  function renderTrackedItem(item: TrackableItem, index: number) {
    const Icon = item.type === "Video" ? Video : item.source === "learning" ? BookOpen : FileText;
    const pct = item.total ? Math.round((item.readCount / item.total) * 100) : 0;
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
                {item.readCount} / {item.total} read
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
                <button className="icon-link" type="button" aria-label={`Delete ${item.title}`} onClick={() => void remove(resources.find((r) => r.id === item.id)!)} >
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
        {open && <ReaderBreakdown readCount={item.readCount} total={item.total} />}
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
      {loadError && <p className="error-box">{loadError}</p>}

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

      {showForm && <ResourceFormDialog initial={editing} onClose={closeForm} onSave={(values) => void handleSave(values)} />}
    </div>
  );
}
