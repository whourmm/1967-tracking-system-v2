import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Globe,
  GraduationCap,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { useSuspended, toggleSuspended } from "../../data/cohortStore";
import { allFellows } from "../../data/mock";
import { countryFlag, flagFor, teamflowChip } from "../../lib/cohort";
import { cn } from "../../lib/cn";
import type { FellowRecord } from "../../types";

const UNASSIGNED = "Unassigned";
const countryOptions = Object.keys(countryFlag);

let tmpId = 1000; // ids for fellows added in-session
const nextId = () => ++tmpId;

// Teamflow is collected via a form fellows submit before Sprint 1 — it is not
// set by the admin. These ids haven't completed it yet (mock), so their
// teamflow shows as "Not submitted".
const TEAMFLOW_PENDING_IDS = new Set([7, 16, 20]);

// `lastActiveAt` is the last time a fellow signed in to the website. null means
// they've been invited but never signed in yet.
type ManagedFellow = FellowRecord & {
  teamflowSubmitted: boolean;
  lastActiveAt: number | null;
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ACTIVITY_OFFSETS = [3 * MIN, 38 * MIN, 2 * HOUR, 5 * HOUR, 9 * HOUR, 26 * HOUR, 2 * DAY, 4 * DAY];

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function lastActiveLabel(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Match a pasted country string to a known country, else keep it as typed.
function resolveCountry(raw: string): string {
  if (!raw) return countryOptions[0];
  return countryOptions.find((c) => c.toLowerCase() === raw.toLowerCase()) ?? raw;
}

// Parse pasted spreadsheet rows: one fellow per line, columns Name / Country /
// University, tab- (Google Sheets) or comma-separated.
function parseRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = (line.includes("\t") ? line.split("\t") : line.split(/\s{2,}|,/)).map((c) => c.trim());
      return { name: cols[0] ?? "", country: cols[1] ?? "", university: cols[2] ?? "" };
    })
    .filter((r) => r.name && r.name.toLowerCase() !== "name");
}

function makeFellow(name: string, country: string, university: string): ManagedFellow {
  return {
    id: nextId(),
    name,
    initials: initialsOf(name),
    country,
    university: university || "—",
    teamflow: "Initiator", // placeholder; hidden until the Teamflow form is submitted
    teamflowSubmitted: false,
    team: UNASSIGNED,
    status: "Pending",
    startDate: "2026-06-05",
    lastActiveAt: null,
    email: null,
    discord: null,
    line: null,
    instagram: null,
  };
}

export default function FellowManagement() {
  // Local, page-scoped copy of the roster — the admin edits this mock in place.
  const [fellows, setFellows] = useState<ManagedFellow[]>(() => {
    const now = Date.now();
    return allFellows.map((f) => ({
      ...f,
      teamflowSubmitted: !TEAMFLOW_PENDING_IDS.has(f.id),
      lastActiveAt: f.status === "Confirmed" ? now - ACTIVITY_OFFSETS[f.id % ACTIVITY_OFFSETS.length] : null,
    }));
  });
  const { showToast, toast } = useToast();
  const suspended = useSuspended();

  // Add-fellow form
  const [addMode, setAddMode] = useState<"single" | "paste">("single");
  const [name, setName] = useState("");
  const [country, setCountry] = useState(countryOptions[0]);
  const [university, setUniversity] = useState("");
  const [pasteText, setPasteText] = useState("");
  const parsedCount = useMemo(() => parseRows(pasteText).length, [pasteText]);

  // Filters
  const [query, setQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [activityFilter, setActivityFilter] = useState<"" | "in" | "out">("");

  const teams = useMemo(
    () => [...new Set(fellows.map((f) => f.team).filter((t) => t && t !== UNASSIGNED))].sort(),
    [fellows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fellows.filter((f) => {
      if (q && !f.name.toLowerCase().includes(q) && !f.university.toLowerCase().includes(q)) return false;
      if (filterCountry && f.country !== filterCountry) return false;
      if (filterTeam && f.team !== filterTeam) return false;
      if (activityFilter === "in" && f.lastActiveAt == null) return false;
      if (activityFilter === "out" && f.lastActiveAt != null) return false;
      return true;
    });
  }, [fellows, query, filterCountry, filterTeam, activityFilter]);

  const signedIn = fellows.filter((f) => f.lastActiveAt != null).length;
  const teamflowDone = fellows.filter((f) => f.teamflowSubmitted).length;
  const countries = new Set(fellows.map((f) => f.country)).size;
  const awaitingTeamflow = fellows.length - teamflowDone;
  const suspendedCount = fellows.filter((f) => suspended.has(f.id)).length;

  function addFellow() {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Enter a name first");
      return;
    }
    setFellows((prev) => [makeFellow(trimmed, country, university.trim()), ...prev]);
    setName("");
    setUniversity("");
    showToast(`Added ${trimmed}`);
  }

  function addBulk() {
    const rows = parseRows(pasteText);
    if (rows.length === 0) {
      showToast("Paste some rows first");
      return;
    }
    const created = rows.map((r) => makeFellow(r.name, resolveCountry(r.country), r.university));
    setFellows((prev) => [...created, ...prev]);
    setPasteText("");
    showToast(`Added ${created.length} fellow${created.length === 1 ? "" : "s"}`);
  }

  function updateFellow(id: number, patch: Partial<FellowRecord>) {
    setFellows((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeFellow(id: number) {
    const f = fellows.find((x) => x.id === id);
    if (f && window.confirm(`Remove ${f.name} from the cohort?`)) {
      setFellows((prev) => prev.filter((x) => x.id !== id));
    }
  }

  const hasFilters = Boolean(filterCountry || filterTeam || activityFilter || query);
  const inputCls =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="page space-y-6">
      {toast}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fellows</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage everyone in the cohort — add fellows, assign teams and track sign-in.
          {awaitingTeamflow > 0 && (
            <span className="text-amber-600"> · {awaitingTeamflow} awaiting the Teamflow form</span>
          )}
          {suspendedCount > 0 && <span className="text-slate-500"> · {suspendedCount} suspended</span>}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Fellows" value={fellows.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={CheckCircle2} label="Signed in" value={`${signedIn} / ${fellows.length}`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={ClipboardCheck} label="Teamflow done" value={`${teamflowDone} / ${fellows.length}`} color="text-violet-600 bg-violet-50" />
        <StatCard icon={Globe} label="Countries" value={countries} color="text-sky-600 bg-sky-50" />
      </div>

      {/* Add fellow */}
      <Card>
        <CardHeader
          title="Add a fellow"
          subtitle={addMode === "single" ? "They land unassigned, awaiting sign-in and the Teamflow form." : "Paste rows from Google Sheets — one fellow per line."}
          action={
            <div className="flex gap-1 rounded-md bg-slate-100 p-0.5">
              {(["single", "paste"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAddMode(m)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-semibold transition",
                    addMode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {m === "single" ? "Single" : "Paste from sheet"}
                </button>
              ))}
            </div>
          }
        />

        {addMode === "single" ? (
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="lg:col-span-1">
              <label className={labelCls}>Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFellow()}
                placeholder="e.g. Sirikit Wong"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>{countryFlag[c]} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>University</label>
              <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. Chulalongkorn" className={inputCls} />
            </div>
            <button
              type="button"
              onClick={addFellow}
              className="flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              <Plus className="h-4 w-4" />
              Add fellow
            </button>
          </div>
        ) : (
          <div className="space-y-3 p-5">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder={"Paste straight from Google Sheets — one fellow per row:\nName\tCountry\tUniversity\nSirikit Wong\tThailand\tChulalongkorn University\nMinh Le\tVietnam\tVNU University of Science"}
              className={cn(inputCls, "resize-y font-mono text-xs leading-relaxed")}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addBulk}
                disabled={parsedCount === 0}
                className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add {parsedCount > 0 ? parsedCount : ""} fellow{parsedCount === 1 ? "" : "s"}
              </button>
              <span className="text-xs text-slate-400">Columns: Name · Country · University — tab or comma separated. A header row is ignored.</span>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or university…"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
          <option value="">All countries</option>
          {[...new Set(fellows.map((f) => f.country))].sort().map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value as "" | "in" | "out")} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
          <option value="">Any activity</option>
          <option value="in">Signed in</option>
          <option value="out">Not signed in</option>
        </select>
      </div>

      {/* Roster table */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">
            {filtered.length} fellow{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.length < fellows.length && (
            <p className="text-xs text-slate-400">filtered from {fellows.length}</p>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No fellows match your search</p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setQuery(""); setFilterCountry(""); setFilterTeam(""); setActivityFilter(""); }}
                className="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  {["Fellow", "Country", "Teamflow", "Team", "Last active", ""].map((h, i) => (
                    <th key={i} className="px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => {
                  const sus = suspended.has(f.id);
                  return (
                  <tr key={f.id} className={cn("transition hover:bg-slate-50", sus && "opacity-60")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{f.initials}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-slate-900">{f.name}</p>
                            {sus && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Suspended</span>}
                          </div>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {f.university}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-600">
                      <span className="mr-1.5">{flagFor(f.country)}</span>
                      {f.country}
                    </td>
                    <td className="px-5 py-3">
                      {f.teamflowSubmitted ? (
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium", teamflowChip[f.teamflow])}>
                          {f.teamflow}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"
                          title="Hasn't completed the pre-sprint Teamflow form"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Not submitted
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={f.team || UNASSIGNED}
                        onChange={(e) => updateFellow(f.id, { team: e.target.value })}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-300"
                      >
                        <option value={UNASSIGNED}>Unassigned</option>
                        {teams.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {f.lastActiveAt != null ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {lastActiveLabel(f.lastActiveAt)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400" title="Invited but never signed in">
                          <Clock className="h-3.5 w-3.5" />
                          Never signed in
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSuspended(f.id)}
                          className={cn(
                            "rounded-md p-1.5 transition",
                            sus ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          )}
                          aria-label={sus ? `Reinstate ${f.name}` : `Suspend ${f.name}`}
                          title={sus ? "Reinstate" : "Suspend (leaves the cohort)"}
                        >
                          {sus ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFellow(f.id)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                          aria-label={`Remove ${f.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
