import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { FellowAvatar, FellowNameLink } from "../../components/admin/FellowProfileLink";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { adminAssignments, caseSubmissionStatus, sbieId, SPRINTS } from "../../data/adminMock";
import { allFellows, caseAssignments } from "../../data/mock";
import { formatShortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import { renumberTeamName, teamNameMap } from "../../lib/teams";
import type { AdminAssignment } from "../../types";

const TOTAL = allFellows.length;
const httpUrl = (u: string) => (!u ? "#" : /^https?:\/\//i.test(u) ? u : "https://" + u);
const seededTeamNameMap = teamNameMap(allFellows.map((f) => f.team));

const emptyForm = {
  title: "",
  sprint: SPRINTS[SPRINTS.length - 1], // default to the current (last) sprint
  formUrl: "",
  due: "",
  description: "",
};

let tmpId = 1000;
const nextId = () => ++tmpId;

type TaskFilter = "all" | "progress" | "complete";
const TASK_TABS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "progress", label: "In progress" },
  { key: "complete", label: "Complete" },
];

function stats(a: AdminAssignment) {
  const done = a.submittedIds.length;
  const pct = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
  return { done, pct, complete: TOTAL > 0 && done === TOTAL };
}

const caseDone = (status: string) => status === "submitted" || status === "reviewed";

// "X ago" relative label, recomputed against a ticking `now`.
function ago(ts: number | undefined, now: number): string {
  if (!ts) return "not synced yet";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Mock for the Apps Script call: reads the form's response sheet and returns the
// up-to-date set of submitted fellow ids. Here we simulate 1–3 new responses
// trickling in since the last sync (so each refresh shows realistic movement).
function fetchSheetSubmissions(task: AdminAssignment): number[] {
  const pending = allFellows.filter((f) => !task.submittedIds.includes(f.id));
  if (pending.length === 0) return task.submittedIds;
  const incoming = Math.min(pending.length, 1 + Math.floor(Math.random() * 3));
  const picked = pending
    .map((f) => ({ f, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, incoming)
    .map(({ f }) => f.id);
  return [...task.submittedIds, ...picked];
}

const SYNC_MS = 750; // simulated Apps Script round-trip

export default function FormTracker() {
  const [tasks, setTasks] = useState<AdminAssignment[]>(() =>
    adminAssignments.map((a) => ({ ...a, submittedIds: [...a.submittedIds] }))
  );
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sprintFilter, setSprintFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  // Inline editing: `adding` opens a new-assignment form at the top of the list;
  // `editingId` opens the form inside that assignment's own block. Only one at a
  // time, both backed by the shared `form` state.
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Sync state — when each assignment was last checked against the sheet.
  const [now, setNow] = useState(() => Date.now());
  const [lastSync, setLastSync] = useState<Record<number, number>>(() => {
    const base = Date.now();
    const seed: Record<number, number> = {};
    adminAssignments.forEach((a, i) => {
      seed[a.id] = base - (i + 2) * 60_000;
    });
    return seed;
  });
  const [lastSyncAll, setLastSyncAll] = useState<number | null>(() => Date.now() - 5 * 60_000);
  const [syncing, setSyncing] = useState<Set<number>>(new Set());

  const { showToast, toast } = useToast();

  // Keep the "X ago" labels fresh without per-second churn.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-refresh every 15 minutes. A ref keeps the interval pointed at the
  // latest closure so it always syncs against current state. Per-assignment
  // manual refresh stays available; there is no global button.
  const refreshAllRef = useRef<() => void>(() => {});
  refreshAllRef.current = refreshAll;
  useEffect(() => {
    const id = window.setInterval(() => refreshAllRef.current(), 15 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  const completeCount = tasks.filter((t) => stats(t).complete).length;
  // Sprint filter scopes the list; tab counts reflect that scope.
  const sprintScoped = tasks.filter((t) => !sprintFilter || t.sprint === sprintFilter);
  const scopedComplete = sprintScoped.filter((t) => stats(t).complete).length;
  const tabCounts: Record<TaskFilter, number> = {
    all: sprintScoped.length,
    progress: sprintScoped.length - scopedComplete,
    complete: scopedComplete,
  };
  const visible = sprintScoped.filter((t) => {
    if (filter === "all") return true;
    return filter === "complete" ? stats(t).complete : !stats(t).complete;
  });
  const avgPct = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((sum, t) => sum + stats(t).pct, 0) / tasks.length);
  }, [tasks]);
  const caseRows = useMemo(
    () =>
      caseAssignments.map((assignment) => ({
        ...assignment,
        status: caseSubmissionStatus[assignment.id] ?? assignment.status,
        assignedTeam: renumberTeamName(assignment.assignedTeam, seededTeamNameMap),
      })),
    []
  );
  const submittedCases = caseRows.filter((assignment) => caseDone(assignment.status)).length;
  const anyBusy = syncing.size > 0;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function cancelEdit() {
    setAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(t: AdminAssignment) {
    setForm({ title: t.title, sprint: t.sprint, formUrl: t.formUrl, due: t.due, description: t.description });
    setAdding(false);
    setEditingId(t.id);
  }

  function save() {
    if (!form.title.trim()) {
      showToast("An assignment needs a title");
      return;
    }
    const data = {
      title: form.title.trim(),
      sprint: form.sprint,
      formUrl: form.formUrl.trim(),
      due: form.due,
      description: form.description.trim(),
    };
    if (editingId !== null) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...data } : t)));
      showToast("Assignment updated");
    } else {
      setTasks((prev) => [...prev, { id: nextId(), ...data, submittedIds: [] }]);
      showToast("Assignment added");
    }
    cancelEdit();
  }

  function remove(id: number) {
    const t = tasks.find((x) => x.id === id);
    if (t && window.confirm(`Delete “${t.title}”?`)) {
      setTasks((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) cancelEdit();
      if (expanded === id) setExpanded(null);
    }
  }

  // Re-check a single assignment's Google Form responses.
  function refresh(id: number) {
    if (syncing.has(id)) return;
    setSyncing((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      const stamp = Date.now();
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, submittedIds: fetchSheetSubmissions(t) } : t))
      );
      setLastSync((prev) => ({ ...prev, [id]: stamp }));
      setLastSyncAll(stamp);
      setSyncing((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      showToast("Synced from Google Form responses");
    }, SYNC_MS);
  }

  // Re-check every assignment at once.
  function refreshAll() {
    if (anyBusy || tasks.length === 0) return;
    const ids = tasks.map((t) => t.id);
    setSyncing(new Set(ids));
    window.setTimeout(() => {
      const stamp = Date.now();
      setTasks((prev) => prev.map((t) => ({ ...t, submittedIds: fetchSheetSubmissions(t) })));
      setLastSync((prev) => {
        const n = { ...prev };
        ids.forEach((id) => (n[id] = stamp));
        return n;
      });
      setLastSyncAll(stamp);
      setSyncing(new Set());
      showToast(`Synced ${ids.length} assignment${ids.length === 1 ? "" : "s"}`);
    }, SYNC_MS + 250);
  }

  const inputCls =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  // Shared add / edit form fields.
  const formFields = (submitLabel: string) => (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Title</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sprint 4 retrospective" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Sprint</label>
          <select value={form.sprint} onChange={(e) => set("sprint", e.target.value)} className={inputCls}>
            {SPRINTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Due date <span className="font-normal normal-case text-slate-400">— optional</span></label>
          <input type="date" value={form.due} onChange={(e) => set("due", e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Google Form link</label>
        <input value={form.formUrl} onChange={(e) => set("formUrl", e.target.value)} placeholder="https://forms.gle/…" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="What fellows need to do." className={cn(inputCls, "resize-y")} />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={save} className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500">
          {submitLabel}
        </button>
        <button type="button" onClick={cancelEdit} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="page space-y-6">
      {toast}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Each assignment links a Google Form. Refresh to check its response sheet and mark fellows
          submitted by matching their SBIE ID.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Assignments" value={tasks.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={ClipboardCheck} label="Complete" value={`${completeCount} / ${tasks.length}`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={TrendingUp} label="Avg. completion" value={`${avgPct}%`} color="text-sky-600 bg-sky-50" />
        <StatCard icon={Check} label="Fellows" value={TOTAL} color="text-violet-600 bg-violet-50" />
      </div>

      {/* Tabs + global sync controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TASK_TABS.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => setFilter(tb.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                filter === tb.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {tb.label}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  filter === tb.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {tabCounts[tb.key]}
              </span>
            </button>
          ))}
        </div>

        <select
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 outline-none transition focus:border-brand-300"
        >
          <option value="">All sprints</option>
          {SPRINTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <RefreshCw className={cn("h-3.5 w-3.5", anyBusy && "animate-spin")} />
          <span>Last sync {ago(lastSyncAll ?? undefined, now)}</span>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Case submissions"
          subtitle={`${submittedCases} of ${caseRows.length} case${caseRows.length === 1 ? "" : "s"} submitted or reviewed`}
          action={
            <span className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              submittedCases === caseRows.length && caseRows.length > 0
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
            )}>
              {submittedCases} / {caseRows.length} done
            </span>
          }
        />

        {caseRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">No case assignments yet</p>
            <p className="text-xs text-slate-400">Assigned sprint cases will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {caseRows.map((assignment) => {
              const done = caseDone(assignment.status);
              return (
                <div key={assignment.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{assignment.caseTitle}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        done
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-amber-50 text-amber-700 ring-amber-600/20"
                      )}>
                        {assignment.status === "reviewed" ? "Reviewed" : assignment.status === "submitted" ? "Submitted" : "Pending"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{assignment.sprint}</span>
                    </div>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      <span>{assignment.company}</span>
                      <span>{assignment.assignedTeam}</span>
                      <span>Due {formatShortDate(assignment.deadline)}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{assignment.deliverable}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={httpUrl(assignment.briefUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Brief
                    </a>
                    <a
                      href={httpUrl(assignment.submissionUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Submit form
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* List */}
      <Card>
        <CardHeader
          title="Assignments"
          subtitle={`${visible.length} of ${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
          action={
            <button
              type="button"
              onClick={() => (adding ? cancelEdit() : startAdd())}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
                adding
                  ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "bg-brand-600 text-white hover:bg-brand-500"
              )}
            >
              {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Close" : "Add assignment"}
            </button>
          }
        />

        {/* Inline add form */}
        {adding && (
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">New assignment</p>
            {formFields("Add assignment")}
          </div>
        )}

        {tasks.length === 0 ? (
          adding ? null : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">No assignments yet</p>
              <p className="text-xs text-slate-400">Use “Add assignment” above to create one.</p>
            </div>
          )
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              No assignments {sprintFilter ? `in ${sprintFilter}` : filter === "complete" ? "complete" : "in progress"}
            </p>
            <button type="button" onClick={() => { setFilter("all"); setSprintFilter(""); }} className="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
              Show all
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((t) => {
              const s = stats(t);
              const open = expanded === t.id;
              const editing = editingId === t.id;
              const busy = syncing.has(t.id);
              return (
                <div key={t.id} className={cn("px-5 py-4", editing && "bg-slate-50/60")}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                      <ClipboardList className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                        {s.complete ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">Complete</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">In progress</span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{t.sprint}</span>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {t.due && <span>Due {formatShortDate(t.due)}</span>}
                        <span>{s.done}/{TOTAL} submitted</span>
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} />
                          {busy ? "syncing…" : `synced ${ago(lastSync[t.id], now)}`}
                        </span>
                      </p>
                      {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}

                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span className={cn("block h-full rounded-full transition-all", s.complete ? "bg-emerald-500" : "bg-brand-600")} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => refresh(t.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
                        <span className="hidden sm:inline">{busy ? "Syncing…" : "Refresh"}</span>
                      </button>
                      <a
                        href={httpUrl(t.formUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Open form</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => (editing ? cancelEdit() : startEdit(t))}
                        className={cn(
                          "rounded-md p-1.5 transition",
                          editing ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        )}
                        aria-label="Edit assignment"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => remove(t.id)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600" aria-label="Delete assignment">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form for this assignment */}
                  {editing && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-900">Edit assignment</p>
                      {formFields("Save changes")}
                    </div>
                  )}

                  {/* Expand: per-fellow submission status (read-only, from last sync) */}
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : t.id)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {open ? "Hide" : "View"} submissions
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                  </button>

                  {open && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => refresh(t.id)}
                          disabled={busy}
                          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
                          {busy ? "Checking sheet…" : "Refresh"}
                        </button>
                        <span className="text-xs text-slate-400">
                          {s.done}/{TOTAL} submitted · synced {ago(lastSync[t.id], now)}
                        </span>
                        <span className="ml-auto text-xs text-slate-400">Matched by SBIE ID</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allFellows.map((f) => {
                          const done = t.submittedIds.includes(f.id);
                          return (
                            <div
                              key={f.id}
                              title={`${f.name} · ${done ? "submitted" : "no response yet"}`}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-xs",
                                done
                                  ? "border-emerald-200 bg-emerald-50 text-slate-900"
                                  : "border-slate-200 bg-white text-slate-500"
                              )}
                            >
                              <FellowAvatar fellow={f} size="sm" />
                              <span className="flex flex-col leading-tight">
                                <FellowNameLink fellow={f} className="inline-block max-w-24 truncate text-xs">
                                  {f.name.split(" ")[0]}
                                </FellowNameLink>
                                <span className="font-mono text-[10px] text-slate-400">{sbieId(f.id)}</span>
                              </span>
                              <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", done ? "bg-emerald-500 text-white" : "border border-slate-300 text-transparent")}>
                                <Check className="h-2.5 w-2.5" strokeWidth={4} />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
