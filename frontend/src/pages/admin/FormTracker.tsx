import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { adminAssignments } from "../../data/adminMock";
import { allFellows } from "../../data/mock";
import { formatShortDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import type { AdminAssignment } from "../../types";

const TOTAL = allFellows.length;
const httpUrl = (u: string) => (!u ? "#" : /^https?:\/\//i.test(u) ? u : "https://" + u);

const emptyForm = { title: "", formUrl: "", due: "", description: "" };

let tmpId = 1000;
const nextId = () => ++tmpId;

function stats(a: AdminAssignment) {
  const done = a.submittedIds.length;
  const pct = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
  return { done, pct, complete: TOTAL > 0 && done === TOTAL };
}

export default function FormTracker() {
  const [tasks, setTasks] = useState<AdminAssignment[]>(() => adminAssignments.map((a) => ({ ...a, submittedIds: [...a.submittedIds] })));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { showToast, toast } = useToast();

  const completeCount = tasks.filter((t) => stats(t).complete).length;
  const avgPct = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((sum, t) => sum + stats(t).pct, 0) / tasks.length);
  }, [tasks]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(t: AdminAssignment) {
    setForm({ title: t.title, formUrl: t.formUrl, due: t.due, description: t.description });
    setEditingId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    if (!form.title.trim()) {
      showToast("An assignment needs a title");
      return;
    }
    const data = {
      title: form.title.trim(),
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
    resetForm();
  }

  function remove(id: number) {
    const t = tasks.find((x) => x.id === id);
    if (t && window.confirm(`Delete “${t.title}”?`)) {
      setTasks((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
      if (expanded === id) setExpanded(null);
    }
  }

  function toggleSub(taskId: number, fellowId: number) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const has = t.submittedIds.includes(fellowId);
        return {
          ...t,
          submittedIds: has ? t.submittedIds.filter((i) => i !== fellowId) : [...t.submittedIds, fellowId],
        };
      })
    );
  }

  function setAll(taskId: number, all: boolean) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, submittedIds: all ? allFellows.map((f) => f.id) : [] } : t))
    );
  }

  const inputCls =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="space-y-6">
      {toast}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a task with a Google Form. Each fellow is marked done when they submit it.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Assignments" value={tasks.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={ClipboardCheck} label="Complete" value={`${completeCount} / ${tasks.length}`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={TrendingUp} label="Avg. completion" value={`${avgPct}%`} color="text-sky-600 bg-sky-50" />
        <StatCard icon={Check} label="Fellows" value={TOTAL} color="text-violet-600 bg-violet-50" />
      </div>

      {/* Form */}
      <Card>
        <CardHeader
          title={editingId !== null ? "Edit assignment" : "Add an assignment"}
          subtitle={editingId !== null ? "Updating an existing assignment" : "Title + Google Form link. Submissions auto-complete each fellow."}
          action={
            editingId !== null ? (
              <button type="button" onClick={resetForm} className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            ) : undefined
          }
        />
        <div className="space-y-4 p-5">
          <div>
            <label className={labelCls}>Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sprint 4 retrospective" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Google Form link</label>
              <input value={form.formUrl} onChange={(e) => set("formUrl", e.target.value)} placeholder="https://forms.gle/…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Due date <span className="font-normal normal-case text-slate-400">— optional</span></label>
              <input type="date" value={form.due} onChange={(e) => set("due", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="What fellows need to do." className={cn(inputCls, "resize-y")} />
          </div>
          <button type="button" onClick={save} className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500">
            <Plus className="h-4 w-4" />
            {editingId !== null ? "Save changes" : "Add assignment"}
          </button>
        </div>
      </Card>

      {/* List */}
      <Card>
        <CardHeader title="Assignments" subtitle={`${tasks.length} task${tasks.length === 1 ? "" : "s"}`} />
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">No assignments yet</p>
            <p className="text-xs text-slate-400">Add one with the form above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((t) => {
              const s = stats(t);
              const open = expanded === t.id;
              return (
                <div key={t.id} className="px-5 py-4">
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
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                        {t.due && <span>Due {formatShortDate(t.due)}</span>}
                        <span>{s.done}/{TOTAL} submitted</span>
                      </p>
                      {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}

                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span className={cn("block h-full rounded-full transition-all", s.complete ? "bg-emerald-500" : "bg-brand-600")} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={httpUrl(t.formUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Open form</span>
                      </a>
                      <button type="button" onClick={() => startEdit(t)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Edit assignment">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => remove(t.id)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600" aria-label="Delete assignment">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expand: per-fellow tracking */}
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : t.id)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {open ? "Hide" : "Track"} submissions
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                  </button>

                  {open && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <div className="mb-3 flex items-center gap-2">
                        <button type="button" onClick={() => setAll(t.id, true)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Mark all submitted</button>
                        <button type="button" onClick={() => setAll(t.id, false)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">Clear all</button>
                        <span className="ml-auto text-xs text-slate-400">Toggle to simulate a form response</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allFellows.map((f) => {
                          const done = t.submittedIds.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => toggleSub(t.id, f.id)}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-xs transition",
                                done
                                  ? "border-emerald-200 bg-emerald-50 text-slate-900"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              )}
                            >
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">{f.initials}</span>
                              {f.name.split(" ")[0]}
                              <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full", done ? "bg-emerald-500 text-white" : "border border-slate-300 text-transparent")}>
                                <Check className="h-2.5 w-2.5" strokeWidth={4} />
                              </span>
                            </button>
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
