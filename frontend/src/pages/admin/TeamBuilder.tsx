import { useState } from "react";
import {
  Check,
  Globe,
  Shapes,
  Shuffle,
  Undo2,
  UserMinus,
  Users,
  UsersRound,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { FellowAvatar, FellowNameLink } from "../../components/admin/FellowProfileLink";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { allFellows } from "../../data/mock";
import { SPRINTS } from "../../data/adminMock";
import { flagFor, teamflowChip } from "../../lib/cohort";
import { cn } from "../../lib/cn";
import { api } from "../../lib/api";
import { saveTeamAssignmentCache } from "../../lib/teamAssignmentCache";
import type { FellowRecord } from "../../types";

interface Team {
  id: number;
  name: string;
}

// Each sprint keeps its own teams + fellow→team assignment, so teams can be
// rebuilt fresh every sprint without disturbing the others.
interface SprintBoard {
  teams: Team[];
  assignment: Record<number, number | null>; // fellowId → teamId (null/absent = unassigned)
}

let tid = 0;
const nextTeamId = () => ++tid;

const cloneBoard = (b: SprintBoard): SprintBoard => ({
  teams: b.teams.map((t) => ({ ...t })),
  assignment: { ...b.assignment },
});
const cloneAll = (bs: Record<string, SprintBoard>): Record<string, SprintBoard> =>
  Object.fromEntries(Object.entries(bs).map(([k, v]) => [k, cloneBoard(v)]));

function boardEqual(a: SprintBoard, b: SprintBoard): boolean {
  if (a.teams.length !== b.teams.length) return false;
  if (a.teams.some((t, i) => t.id !== b.teams[i].id || t.name !== b.teams[i].name)) return false;
  for (const f of allFellows) {
    if ((a.assignment[f.id] ?? null) !== (b.assignment[f.id] ?? null)) return false;
  }
  return true;
}

// Seed every sprint with the same starting teams (independent copies). The
// admin then edits each sprint on its own.
function seedBoards(): Record<string, SprintBoard> {
  const names = [...new Set(allFellows.map((f) => f.team).filter((name) => name && name !== "Unassigned"))];
  const boards: Record<string, SprintBoard> = {};
  for (const s of SPRINTS) {
    const byName = new Map<string, number>();
    const teams = names.map((name) => {
      const id = nextTeamId();
      byName.set(name, id);
      return { id, name };
    });
    const assignment: Record<number, number | null> = {};
    allFellows.forEach((f) => {
      assignment[f.id] = byName.get(f.team) ?? null;
    });
    boards[s] = { teams, assignment };
  }
  return boards;
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
  const [initialBoards] = useState(seedBoards);
  const [boards, setBoards] = useState(() => cloneAll(initialBoards)); // working draft
  const [saved, setSaved] = useState(() => cloneAll(initialBoards)); // last saved snapshot
  const [sprint] = useState(SPRINTS[SPRINTS.length - 1]); // current sprint
  const { showToast, toast } = useToast();
  const suspended = new Set<number>();

  // Constraints (shared across sprints)
  const [teamSize, setTeamSize] = useState(4);
  const [needFinisher, setNeedFinisher] = useState(true);
  const [mixCountries, setMixCountries] = useState(true);

  const EMPTY_BOARD: SprintBoard = { teams: [], assignment: {} };
  const board = boards[sprint] ?? EMPTY_BOARD;
  const teams = board.teams;
  const dirty = !boardEqual(board, saved[sprint] ?? EMPTY_BOARD);

  const isSuspended = (fellowId: number) => suspended.has(fellowId);
  // Suspended fellows are forced into the pool regardless of their assignment.
  const teamIdOf = (fellowId: number) => (isSuspended(fellowId) ? null : board.assignment[fellowId] ?? null);
  const membersOf = (teamId: number) => allFellows.filter((f) => teamIdOf(f.id) === teamId);
  const pool = allFellows.filter((f) => teamIdOf(f.id) === null); // includes suspended
  const assignablePool = pool.filter((f) => !isSuspended(f.id)); // can be placed / shuffled
  const suspendedInPool = pool.filter((f) => isSuspended(f.id));

  const completeTeams = teams.filter((t) => {
    const ms = membersOf(t.id);
    return ms.length >= teamSize && ms.some((m) => m.teamflow === "Finisher");
  }).length;

  // Apply a change to the currently selected sprint's board only.
  function updateBoard(updater: (b: SprintBoard) => SprintBoard) {
    setBoards((prev) => ({ ...prev, [sprint]: updater(prev[sprint]) }));
  }

  function assign(fellowId: number, teamId: number | null) {
    if (teamId !== null && isSuspended(fellowId)) return; // can't place a suspended fellow
    updateBoard((b) => ({ ...b, assignment: { ...b.assignment, [fellowId]: teamId } }));
  }

  function unassignAll() {
    updateBoard((b) => ({ ...b, assignment: {} }));
    showToast(`Cleared assignments for ${sprint}`);
  }

  async function save() {
    try {
      const liveTeams = await api.teams();
      const assignedTeams = new Set(Object.values(board.assignment).filter((id): id is number => id != null));
      const missingTeams = board.teams.filter(
        (team) => assignedTeams.has(team.id) && !liveTeams.some((liveTeam) => liveTeam.name === team.name),
      );
      if (missingTeams.length) {
        throw new Error(`These teams do not exist in the database: ${missingTeams.map((team) => team.name).join(", ")}`);
      }
      const nextAssignments = allFellows.map((fellow) => {
        const draftTeam = board.teams.find((team) => team.id === (board.assignment[fellow.id] ?? null));
        const liveTeam = liveTeams.find((team) => team.name === draftTeam?.name);
        return {
          member_id: fellow.id,
          team_id: liveTeam?.id ?? null,
          group_id: liveTeam?.group_id ?? null,
          team_name: liveTeam?.name ?? null,
        };
      });
      await api.admin.saveTeamAssignments(nextAssignments.map(({ member_id, team_id, group_id }) => ({
        member_id,
        team_id,
        group_id,
      })));
      saveTeamAssignmentCache(nextAssignments.map(({ member_id, team_name }) => ({
        fellowId: member_id,
        teamName: team_name,
      })));
      nextAssignments.forEach(({ member_id, team_name }) => {
        const fellow = allFellows.find((item) => item.id === member_id);
        if (fellow) fellow.team = team_name ?? "Unassigned";
      });
      setSaved((prev) => ({ ...prev, [sprint]: cloneBoard(board) }));
      showToast(`Saved teams for ${sprint}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save teams");
    }
  }

  function discard() {
    setBoards((prev) => ({ ...prev, [sprint]: cloneBoard(saved[sprint]) }));
    showToast(`Reverted ${sprint} to last saved`);
  }

  // Auto-build this sprint's teams honouring the toggles. Suspended fellows are
  // skipped and stay in the pool.
  function randomise() {
    const size = Math.max(2, Math.min(8, teamSize));
    const active = allFellows.filter((f) => !isSuspended(f.id));
    if (teams.length === 0) {
      showToast("Create teams in the database before assigning fellows");
      return;
    }
    const needed = Math.min(teams.length, Math.max(1, Math.ceil(active.length / size)));

    const work = teams.slice();
    const buckets = work.slice(0, needed).map((t) => ({ t, list: [] as FellowRecord[] }));

    let candidates = shuffle(active);

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

    const assignment: Record<number, number | null> = {};
    allFellows.forEach((f) => (assignment[f.id] = null));
    buckets.forEach((b) => b.list.forEach((m) => (assignment[m.id] = b.t.id)));

    updateBoard(() => ({ teams: work.slice(0, needed), assignment }));

    const noFin = buckets.filter((b) => !b.list.some((m) => m.teamflow === "Finisher")).length;
    let msg = `Built ${buckets.length} teams for ${sprint}`;
    if (needFinisher && noFin === 0) msg += " · every team has a finisher";
    else if (needFinisher && noFin > 0) msg += ` · ${noFin} without a finisher`;
    showToast(msg);
  }

  return (
    <div className="page space-y-6">
      {toast}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign fellows to teams that already exist in the database. Team assignments are current; sprint history is not stored yet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 py-1 pl-3 pr-1.5">
            <select
              value={sprint}
              disabled
              aria-label="Sprint"
              className="bg-transparent py-1 text-sm font-semibold text-slate-500 outline-none"
            >
              {SPRINTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
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
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Shuffle className="h-4 w-4" />
            Randomise
          </button>
          {dirty && (
            <button
              type="button"
              onClick={discard}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Undo2 className="h-4 w-4" />
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
              dirty ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-100 text-slate-400"
            )}
          >
            <Check className="h-4 w-4" />
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={UsersRound} label="Teams" value={teams.length} color="text-brand-600 bg-brand-50" />
        <StatCard icon={Users} label="Fellows" value={allFellows.length} color="text-sky-600 bg-sky-50" />
        <StatCard icon={Shapes} label="Complete teams" value={`${completeTeams} / ${teams.length}`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={UserMinus} label="Unassigned" value={assignablePool.length} color="text-amber-600 bg-amber-50" />
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
          subtitle={`${allFellows.filter((m) => m.teamflow === "Finisher" && !isSuspended(m.id)).length} finishers available`}
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
                    <FellowAvatar fellow={m} size="md" />
                    <div className="min-w-0 flex-1">
                      <FellowNameLink fellow={m} className="block truncate text-xs" />
                      <p className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>{flagFor(m.country)}</span>
                        {m.teamflow ? (
                          <span className={cn("rounded px-1.5 py-px text-[10px] font-medium", teamflowChip[m.teamflow])}>{m.teamflow}</span>
                        ) : (
                          <span className="rounded bg-amber-50 px-1.5 py-px text-[10px] font-medium text-amber-700">Not submitted</span>
                        )}
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
                disabled={assignablePool.length === 0}
                onChange={(e) => e.target.value && assign(Number(e.target.value), team.id)}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 outline-none focus:border-brand-300 disabled:opacity-50"
              >
                <option value="">{assignablePool.length ? "+ Add member…" : "No one to add"}</option>
                {assignablePool.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.country} · {m.teamflow}</option>
                ))}
              </select>
            </Card>
          );
        })}

        {teams.length === 0 && (
          <Card className="p-5 text-sm text-slate-500">No persisted teams exist yet. Create the team records before assigning fellows.</Card>
        )}
      </div>

      {/* Unassigned pool */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Unassigned pool</p>
          </div>
          <p className="text-xs text-slate-400">
            {assignablePool.length} waiting{suspendedInPool.length > 0 ? ` · ${suspendedInPool.length} suspended` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          {pool.length === 0 ? (
            <p className="text-sm text-slate-400">Everyone is assigned to a team.</p>
          ) : (
            pool.map((m) => {
              const sus = isSuspended(m.id);
              return (
                <span
                  key={m.id}
                  title={sus ? "Suspended — reinstate in Members to assign" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm",
                    sus ? "border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-slate-50"
                  )}
                >
                  <FellowAvatar fellow={m} size="sm" tone={sus ? "slate" : "brand"} />
                  <FellowNameLink fellow={m} className={cn(sus ? "text-slate-500" : "text-slate-800")} />
                  {sus ? (
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">suspended</span>
                  ) : (
                    <span>{flagFor(m.country)}</span>
                  )}
                </span>
              );
            })
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
        <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0")} />
      </button>
    </div>
  );
}
