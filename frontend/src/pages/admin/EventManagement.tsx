import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { TIMEZONES, formatEventWhen, gcalUrl } from "../../lib/calendar";
import { cn } from "../../lib/cn";
import { api, type AdminEventResponse } from "../../lib/api";
import type { AdminEvent } from "../../types";

const TODAY = new Date().toISOString().slice(0, 10);

const emptyForm: Omit<AdminEvent, "id"> = {
  title: "",
  date: "",
  allDay: false,
  start: "09:00",
  end: "10:00",
  tz: "Asia/Bangkok",
  location: "",
  description: "",
};

function mapEvent(event: AdminEventResponse): AdminEvent {
  return {
    id: event.id,
    title: event.name ?? "Untitled event",
    date: event.date ?? "",
    allDay: event.all_day,
    start: event.start ?? "",
    end: event.end ?? "",
    tz: event.timezone ?? "Asia/Bangkok",
    location: event.location ?? "",
    description: event.description ?? "",
  };
}

export default function EventManagement() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadError, setLoadError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<AdminEvent, "id">>(emptyForm);
  const { showToast, toast } = useToast();

  async function loadEvents() {
    try {
      setEvents((await api.events()).map(mapEvent));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load events");
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  const sorted = useMemo(
    () => events.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [events]
  );
  const upcoming = events.filter((e) => e.date >= TODAY).length;
  const allDayCount = events.filter((e) => e.allDay).length;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(ev: AdminEvent) {
    const { id: _id, ...rest } = ev;
    void _id;
    setForm(rest);
    setEditingId(ev.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.title.trim()) {
      showToast("An event needs a title");
      return;
    }
    if (!form.date) {
      showToast("Pick a date");
      return;
    }
    if (!form.allDay && form.end <= form.start) {
      showToast("End time must be after start");
      return;
    }
    const data: Omit<AdminEvent, "id"> = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      start: form.allDay ? "" : form.start,
      end: form.allDay ? "" : form.end,
    };
    const payload: Partial<AdminEventResponse> = {
      name: data.title,
      date: data.date,
      all_day: data.allDay,
      start: data.start,
      end: data.end,
      timezone: data.tz,
      location: data.location,
      description: data.description,
    };
    try {
      if (editingId !== null) {
        await api.admin.updateEvent(editingId, payload);
        showToast("Event updated");
      } else {
        await api.admin.createEvent(payload);
        showToast("Event added");
      }
      await loadEvents();
      resetForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save event");
    }
  }

  async function remove(id: number) {
    const ev = events.find((e) => e.id === id);
    if (ev && window.confirm(`Delete “${ev.title}”?`)) {
      try {
        await api.admin.deleteEvent(id);
        await loadEvents();
        if (editingId === id) resetForm();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not delete event");
      }
    }
  }

  const inputCls =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="page space-y-6">
      {toast}
      {loadError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upcoming Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish events here — fellows add them to Google Calendar with one click.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={CalendarDays} label="Total events" value={events.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={Clock} label="Upcoming" value={upcoming} color="text-sky-600 bg-sky-50" />
        <StatCard icon={Sun} label="All-day" value={allDayCount} color="text-amber-600 bg-amber-50" />
      </div>

      {/* Form */}
      <Card>
        <CardHeader
          title={editingId !== null ? "Edit event" : "Add an event"}
          subtitle={editingId !== null ? "Updating an existing event" : "Generates a prefilled “Add to Google Calendar” link."}
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
            <label className={labelCls}>Event title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sprint 4 Demo Day" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Timezone</label>
              <select value={form.tz} onChange={(e) => set("tz", e.target.value)} className={inputCls}>
                {TIMEZONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">All-day event</p>
              <p className="text-[11px] text-slate-500">Skip start and end times</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.allDay}
              onClick={() => set("allDay", !form.allDay)}
              className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", form.allDay ? "bg-brand-600" : "bg-slate-300")}
            >
              <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", form.allDay ? "translate-x-4" : "translate-x-0")} />
            </button>
          </div>

          {!form.allDay && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Start time</label>
                <input type="time" value={form.start} onChange={(e) => set("start", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End time</label>
                <input type="time" value={form.end} onChange={(e) => set("end", e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Location <span className="font-normal normal-case text-slate-400">— or meeting link</span></label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Online · Zoom, or a venue" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Shows up in the calendar event." className={cn(inputCls, "resize-y")} />
          </div>

          <button type="button" onClick={() => void save()} className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500">
            <Plus className="h-4 w-4" />
            {editingId !== null ? "Save changes" : "Add event"}
          </button>
        </div>
      </Card>

      {/* List */}
      <Card>
        <CardHeader title="Scheduled events" subtitle={`${events.length} event${events.length === 1 ? "" : "s"}`} />
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">No events yet</p>
            <p className="text-xs text-slate-400">Add one with the form above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sorted.map((ev) => {
              const d = new Date(ev.date + "T00:00:00");
              const past = ev.date < TODAY;
              return (
                <div key={ev.id} className={cn("flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50", past && "opacity-60")}>
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-md border border-slate-200 bg-slate-50 py-1.5">
                    <span className="text-lg font-bold leading-none text-slate-900">{d.getDate()}</span>
                    <span className="font-mono text-[10px] uppercase text-slate-400">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{ev.title}</h3>
                      {ev.allDay && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20">All day</span>}
                      {past && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Past</span>}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatEventWhen(ev)}</span>
                      {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                    </p>
                    {ev.description && <p className="mt-1.5 text-xs text-slate-500">{ev.description}</p>}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={gcalUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Calendar</span>
                    </a>
                    <button type="button" onClick={() => startEdit(ev)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Edit event">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void remove(ev.id)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600" aria-label="Delete event">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
