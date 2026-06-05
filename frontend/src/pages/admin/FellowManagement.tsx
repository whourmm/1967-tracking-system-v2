import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { allFellows } from "../../data/mock";
import { countryFlag, flagFor, teamflowChip, allTeamflows } from "../../lib/cohort";
import { cn } from "../../lib/cn";
import type { FellowRecord, FellowStatus, TeamFlow } from "../../types";

const UNASSIGNED = "Unassigned";
const countryOptions = Object.keys(countryFlag);

let tmpId = 1000; // ids for fellows added in-session
const nextId = () => ++tmpId;

function StatusPill({ status }: { status: FellowStatus }) {
  const confirmed = status === "Confirmed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        confirmed
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          : "bg-amber-50 text-amber-700 ring-amber-600/20"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", confirmed ? "bg-emerald-500" : "bg-amber-500")} />
      {status}
    </span>
  );
}

export default function FellowManagement() {
  // Local, page-scoped copy of the roster — the admin edits this mock in place.
  const [fellows, setFellows] = useState<FellowRecord[]>(() =>
    allFellows.map((f) => ({ ...f }))
  );
  const { showToast, toast } = useToast();

  // Add-fellow form
  const [name, setName] = useState("");
  const [country, setCountry] = useState(countryOptions[0]);
  const [university, setUniversity] = useState("");
  const [teamflow, setTeamflow] = useState<TeamFlow>("Initiator");

  // Filters
  const [query, setQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterStatus, setFilterStatus] = useState<FellowStatus | "">("");

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
      if (filterStatus && f.status !== filterStatus) return false;
      return true;
    });
  }, [fellows, query, filterCountry, filterTeam, filterStatus]);

  const confirmed = fellows.filter((f) => f.status === "Confirmed").length;
  const pending = fellows.length - confirmed;
  const countries = new Set(fellows.map((f) => f.country)).size;

  function addFellow() {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Enter a name first");
      return;
    }
    const initials = trimmed
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    setFellows((prev) => [
      {
        id: nextId(),
        name: trimmed,
        initials,
        country,
        university: university.trim() || "—",
        teamflow,
        team: UNASSIGNED,
        status: "Pending",
        startDate: "2026-06-05",
        email: null,
        discord: null,
        line: null,
        instagram: null,
      },
      ...prev,
    ]);
    setName("");
    setUniversity("");
    showToast(`Added ${trimmed}`);
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

  function toggleStatus(id: number) {
    setFellows((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: f.status === "Confirmed" ? "Pending" : "Confirmed" }
          : f
      )
    );
  }

  const hasFilters = Boolean(filterCountry || filterTeam || filterStatus || query);

  return (
    <div className="space-y-6">
      {toast}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fellows</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage everyone in the cohort — add fellows, assign teams and confirm participation.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total Fellows" value={fellows.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={CheckCircle2} label="Confirmed" value={confirmed} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={Clock} label="Pending" value={pending} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Globe} label="Countries" value={countries} color="text-sky-600 bg-sky-50" />
      </div>

      {/* Add fellow */}
      <Card>
        <CardHeader title="Add a fellow" subtitle="They land unassigned and pending until placed on a team." />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFellow()}
              placeholder="e.g. Sirikit Wong"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
              {countryOptions.map((c) => (
                <option key={c} value={c}>{countryFlag[c]} {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">University</label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. Chulalongkorn"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Archetype</label>
            <select value={teamflow} onChange={(e) => setTeamflow(e.target.value as TeamFlow)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
              {allTeamflows.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FellowStatus | "")} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
          <option value="">Any status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
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
                onClick={() => { setQuery(""); setFilterCountry(""); setFilterTeam(""); setFilterStatus(""); }}
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
                  {["Fellow", "Country", "Archetype", "Team", "Status", ""].map((h, i) => (
                    <th key={i} className="px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => (
                  <tr key={f.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{f.initials}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{f.name}</p>
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
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium", teamflowChip[f.teamflow])}>
                        {f.teamflow}
                      </span>
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
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => toggleStatus(f.id)} title="Toggle status">
                        <StatusPill status={f.status} />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeFellow(f.id)}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        aria-label={`Remove ${f.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
