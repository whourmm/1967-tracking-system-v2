import { useMemo, useState } from "react";
import {
  Globe,
  Plus,
  Shapes,
  Shuffle,
  Trash2,
  UserMinus,
  Users,
  UsersRound,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { allFellows } from "../../data/mock";
import { flagFor, teamflowChip } from "../../lib/cohort";
import { cn } from "../../lib/cn";
import type { FellowRecord } from "../../types";

// River names used when spinning up new teams, after the seeded ones.
const TEAM_NAMES = [
  "Mekong", "Irrawaddy", "Chao Phraya", "Salween", "Ayeyarwady",
  "Mae Klong", "Pasak", "Ping", "Nan", "Yom", "Wang", "Kok",
];

type Member = FellowRecord & { teamId: number | null };
interface Team {
  id: number;
  name: string;
}

let tid = 0;
const nextTeamId = () => ++tid;

// Build initial teams from the distinct team names already on the fellows, and
// point each fellow at its team by id.
function seed(): { teams: Team[]; members: Member[] } {
  const names = [...new Set(allFellows.map((f) => f.team))];
  const byName = new Map<string, number>();
  const teams: Team[] = names.map((name) => {
    const id = nextTeamId();
    byName.set(name, id);
    return { id, name };
  });
  const members: Member[] = allFellows.map((f) => ({
    ...f,
    teamId: byName.get(f.team) ?? null,
  }));
  return { teams, members };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TeamBuilder() {
  const seeded = useMemo(seed, []);
  const [teams, setTeams] = useState<Team[]>(seeded.teams);
  const [members, setMembers] = useState<Member[]>(seeded.members);
  const { showToast, toast } = useToast();

  // Constraints
  const [teamSize, setTeamSize] = useState(4);
  const [needFinisher, setNeedFinisher] = useState(true);
  const [mixCountries, setMixCountries] = useState(true);

  const pool = members.filter((m) => m.teamId === null);
  const membersOf = (id: number) => members.filter((m) => m.teamId === id);

  const completeTeams = teams.filter((t) => {
    const ms = membersOf(t.id);
    return ms.length >= teamSize && ms.some((m) => m.teamflow === "Finisher");
  }).length;

  function assign(memberId: number, teamId: number | null) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, teamId } : m)));
  }

  function addTeam() {
    const name = "Team " + (TEAM_NAMES[teams.length] ?? teams.length + 1);
    setTeams((prev) => [...prev, { id: nextTeamId(), name }]);
  }

  function removeTeam(id: number) {
    setMembers((prev) => prev.map((m) => (m.teamId === id ? { ...m, teamId: null } : m)));
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  function unassignAll() {
    setMembers((prev) => prev.map((m) => ({ ...m, teamId: null })));
    showToast("All fellows unassigned");
  }

  // Auto-build teams honouring the toggles, mirroring the mock console.
  function randomise() {
    const size = Math.max(2, Math.min(8, teamSize));
    const needed = Math.max(1, Math.ceil(members.length / size));

    // Make sure enough teams exist.
    const work = teams.slice();
    while (work.length < needed) {
      work.push({ id: nextTeamId(), name: "Team " + (TEAM_NAMES[work.length] ?? work.length + 1) });
    }
    const buckets = work.slice(0, needed).map((t) => ({ t, list: [] as Member[] }));

    let candidates = shuffle(members);

    // Seed one finisher per team first when required.
    if (needFinisher) {
      const finishers = candidates.filter((m) => m.teamflow === "Finisher");
      finishers.forEach((f, i) => {
        if (i < buckets.length) buckets[i].list.push(f);
      });
      const seededIds = new Set(buckets.flatMap((b) => b.list.map((m) => m.id)));
      candidates = candidates.filter((m) => !seededIds.has(m.id));
    }

    candidates.forEach((m) => {
      let cands = buckets.filter((b) => b.list.length < size);
      if (cands.length === 0) cands = buckets.slice();
      if (mixCountries) {
        const noClash = cands.filter((b) => !b.list.some((x) => x.country === m.country));
        if (noClash.length) cands = noClash;
      }
      cands.sort((a, b) => a.list.length - b.list.length);
      cands[0].list.push(m);
    });

    const teamIdByMember = new Map<number, number>();
    buckets.forEach((b) => b.list.forEach((m) => teamIdByMember.set(m.id, b.t.id)));

    setTeams(work.slice(0, needed));
    setMembers((prev) => prev.map((m) => ({ ...m, teamId: teamIdByMember.get(m.id) ?? null })));

    const noFin = buckets.filter((b) => !b.list.some((m) => m.teamflow === "Finisher")).length;
    let msg = `Built ${buckets.length} teams of ~${size}`;
    if (needFinisher && noFin === 0) msg += " · every team has a finisher";
    else if (needFinisher && noFin > 0) msg += ` · ${noFin} without a finisher`;
    showToast(msg);
  }

  return (
    <div className="space-y-6">
      {toast}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h1>
          <p className="mt-1 text-sm text-slate-500">
            Build teams by hand, or auto-assign with constraints. Each team needs a Finisher and a mix of countries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={unassignAll}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <UserMinus className="h-4 w-4" />
            Unassign all
          </button>
          <button
            type="button"
            onClick={randomise}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            <Shuffle className="h-4 w-4" />
            Randomise teams
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={UsersRound} label="Teams" value={teams.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={Users} label="Fellows" value={members.length} color="text-sky-600 bg-sky-50" />
        <StatCard icon={Shapes} label="Complete teams" value={`${completeTeams} / ${teams.length}`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={UserMinus} label="Unassigned" value={pool.length} color="text-amber-600 bg-amber-50" />
      </div>

      {/* Constraints bar */}
      <Card className="flex flex-wrap items-center gap-5 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Team size</label>
          <input
            type="number"
            min={2}
            max={8}
            value={teamSize}
            onChange={(e) => setTeamSize(Math.max(2, Math.min(8, Number(e.target.value) || 4)))}
            className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center text-sm text-slate-700 outline-none focus:border-brand-300"
          />
        </div>

        <ConstraintToggle
          title="Must have a Finisher"
          subtitle={`${members.filter((m) => m.teamflow === "Finisher").length} finishers available`}
          on={needFinisher}
          onToggle={() => setNeedFinisher((v) => !v)}
        />
        <ConstraintToggle
          title="Mix countries"
          subtitle="Avoid same-country clusters"
          on={mixCountries}
          onToggle={() => setMixCountries((v) => !v)}
        />
      </Card>

      {/* Team cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const ms = membersOf(team.id);
          const hasFinisher = ms.some((m) => m.teamflow === "Finisher");
          const nationalities = new Set(ms.map((m) => m.country)).size;
          const complete = ms.length >= teamSize && hasFinisher;

          return (
            <Card key={team.id} className={cn("flex flex-col gap-3 p-4", complete && "ring-1 ring-emerald-200")}>
              <div className="flex items-center gap-2">
                <h3 className="flex-1 text-sm font-bold text-slate-900">{team.name}</h3>
                {hasFinisher ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">finisher</span>
                ) : (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-600/20">no finisher</span>
                )}
                <button
                  type="button"
                  onClick={() => removeTeam(team.id)}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                  aria-label={`Delete ${team.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                {ms.length} member{ms.length === 1 ? "" : "s"} · {nationalities} countr{nationalities === 1 ? "y" : "ies"}
              </p>

              <div className="space-y-1.5">
                {ms.length === 0 && (
                  <p className="rounded-md bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">No members yet</p>
                )}
                {ms.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-md bg-slate-50 px-2.5 py-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{m.initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">{m.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>{flagFor(m.country)}</span>
                        <span className={cn("rounded px-1.5 py-px text-[10px] font-medium", teamflowChip[m.teamflow])}>{m.teamflow}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => assign(m.id, null)}
                      className="rounded p-1 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                      aria-label={`Remove ${m.name} from ${team.name}`}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <select
                value=""
                disabled={pool.length === 0}
                onChange={(e) => e.target.value && assign(Number(e.target.value), team.id)}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-brand-300 disabled:opacity-50"
              >
                <option value="">{pool.length ? "+ Add member…" : "All fellows assigned"}</option>
                {pool.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.country} · {m.teamflow}</option>
                ))}
              </select>
            </Card>
          );
        })}

        <button
          type="button"
          onClick={addTeam}
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
        >
          <Plus className="h-6 w-6" />
          Add team
        </button>
      </div>

      {/* Unassigned pool */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Unassigned pool</p>
          </div>
          <p className="text-xs text-slate-400">{pool.length} waiting to be placed</p>
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          {pool.length === 0 ? (
            <p className="text-sm text-slate-400">Everyone is assigned to a team.</p>
          ) : (
            pool.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{m.initials}</span>
                <span className="font-semibold text-slate-800">{m.name}</span>
                <span>{flagFor(m.country)}</span>
              </span>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function ConstraintToggle({
  title,
  subtitle,
  on,
  onToggle,
}: {
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-brand-600" : "bg-slate-300")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
