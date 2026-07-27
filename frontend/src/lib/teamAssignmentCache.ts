import { allFellows } from "../data/mock";
import type { FellowRecord } from "../types";

const KEY = "tracking-system-v2.team-assignments";

type TeamAssignmentCache = Record<string, string>;

function readCache(): TeamAssignmentCache {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as TeamAssignmentCache;
  } catch {
    localStorage.removeItem(KEY);
    return {};
  }
}

function writeCache(cache: TeamAssignmentCache) {
  localStorage.setItem(KEY, JSON.stringify(cache));
  window.dispatchEvent(new Event("tracking-system-v2.team-assignments:changed"));
}

export function saveTeamAssignmentCache(assignments: Array<{ fellowId: number; teamName: string | null }>) {
  const cache = readCache();
  assignments.forEach(({ fellowId, teamName }) => {
    if (teamName) cache[String(fellowId)] = teamName;
    else delete cache[String(fellowId)];
  });
  writeCache(cache);
}

export function applyTeamAssignmentCache(fellows = allFellows) {
  const cache = readCache();
  fellows.forEach((fellow) => {
    const teamName = cache[String(fellow.id)];
    if (teamName) fellow.team = teamName;
  });
}

export function cachedTeamMembers(teamName: string): FellowRecord[] {
  applyTeamAssignmentCache();
  return allFellows.filter((fellow) => fellow.team === teamName);
}
