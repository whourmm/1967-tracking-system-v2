import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Filter, GraduationCap, Search, Users, X } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { allFellows } from "../../../data/mock";
import type { FellowRecord, FellowStatus, TeamFlow } from "../../../types";
import { cn } from "../../../lib/cn";

const teamflowChip: Record<TeamFlow, string> = {
  Initiator: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  Translator: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
  Sharper: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
  Finisher: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
};

const countryFlag: Record<string, string> = {
  Thailand: "🇹🇭", Vietnam: "🇻🇳", Singapore: "🇸🇬", Indonesia: "🇮🇩",
  Philippines: "🇵🇭", Malaysia: "🇲🇾", Myanmar: "🇲🇲", Cambodia: "🇰🇭",
};

const allCountries = [...new Set(allFellows.map((f) => f.country))].sort();
const allTeamflows: TeamFlow[] = ["Initiator", "Translator", "Sharper", "Finisher"];
const allTeams = [...new Set(allFellows.map((f) => f.team))].sort();

function StatusPill({ status }: { status: FellowStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
      status === "Confirmed" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "Confirmed" ? "bg-emerald-500" : "bg-amber-500")} />
      {status}
    </span>
  );
}

export default function RosterPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [teamflow, setTeamflow] = useState<TeamFlow | "">("");
  const [team, setTeam] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allFellows.filter((f: FellowRecord) => {
      if (q && !f.name.toLowerCase().includes(q) && !f.university.toLowerCase().includes(q)) return false;
      if (country && f.country !== country) return false;
      if (teamflow && f.teamflow !== teamflow) return false;
      if (team && f.team !== team) return false;
      return true;
    });
  }, [query, country, teamflow, team]);

  const confirmedCount = allFellows.filter((f) => f.status === "Confirmed").length;
  const countryCount = new Set(allFellows.map((f) => f.country)).size;
  const activeFilters = [
    country && { label: `Country: ${country}`, clear: () => setCountry("") },
    teamflow && { label: `Archetype: ${teamflow}`, clear: () => setTeamflow("") },
    team && { label: `Team: ${team}`, clear: () => setTeam("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Fellows Roster</h1>
        <p className="mt-1 text-sm text-slate-500">{allFellows.length} fellows · {countryCount} countries · {confirmedCount} confirmed</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Fellows", value: allFellows.length, color: "text-brand-600 bg-brand-50" },
          { label: "Countries", value: countryCount, color: "text-sky-600 bg-sky-50" },
          { label: "Confirmed", value: confirmedCount, color: "text-emerald-600 bg-emerald-50" },
          { label: "Teams", value: allTeams.length, color: "text-violet-600 bg-violet-50" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", color)}><Users className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-base font-bold text-slate-900">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or university…"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
            {query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
          </div>
          <button type="button" onClick={() => setShowFilters((s) => !s)}
            className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
              showFilters || activeFilters.length > 0 ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}>
            <Filter className="h-4 w-4" />Filters
            {activeFilters.length > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{activeFilters.length}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            {[
              { label: "Country", value: country, setter: setCountry, options: allCountries.map((c) => ({ value: c, label: `${countryFlag[c] ?? ""} ${c}` })), placeholder: "All countries" },
              { label: "TeamFlow Archetype", value: teamflow, setter: (v: string) => setTeamflow(v as TeamFlow | ""), options: allTeamflows.map((t) => ({ value: t, label: t })), placeholder: "All archetypes" },
              { label: "Team", value: team, setter: setTeam, options: allTeams.map((t) => ({ value: t, label: t })), placeholder: "All teams" },
            ].map(({ label, value, setter, options, placeholder }) => (
              <div key={label}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
                <select value={value} onChange={(e) => setter(e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-300">
                  <option value="">{placeholder}</option>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Active filters:</span>
            {activeFilters.map(({ label, clear }) => (
              <span key={label} className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                {label}<button type="button" onClick={clear}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <button type="button" onClick={() => { setCountry(""); setTeamflow(""); setTeam(""); }} className="text-xs font-medium text-slate-500 transition hover:text-brand-600">Clear all</button>
          </div>
        )}
      </div>

      <Card>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-slate-700">{filtered.length} fellow{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.length < allFellows.length && <p className="text-xs text-slate-400">filtered from {allFellows.length}</p>}
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No fellows match your search</p>
            <button type="button" onClick={() => { setQuery(""); setCountry(""); setTeamflow(""); setTeam(""); }} className="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700">Clear all filters</button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((fellow) => (
              <li key={fellow.id}>
                <Link to={`/fellow/roster/${fellow.id}`} className="group flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50 sm:gap-4 sm:px-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{fellow.initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{fellow.name}</p>
                      <StatusPill status={fellow.status} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{countryFlag[fellow.country] ?? "🌏"}</span>
                      <span>{fellow.country}</span>
                      <span className="text-slate-300">·</span>
                      <GraduationCap className="h-3 w-3" />
                      <span className="min-w-0 truncate">{fellow.university}</span>
                    </p>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", teamflowChip[fellow.teamflow])}>{fellow.teamflow}</span>
                    <span className="text-xs text-slate-400">{fellow.team}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
