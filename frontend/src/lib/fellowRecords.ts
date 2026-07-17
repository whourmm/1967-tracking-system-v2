import type { AdminFellow, FellowDetail } from "./api";
import type { FellowRecord, TeamFlow } from "../types";

const teamflows: TeamFlow[] = ["Initiator", "Translator", "Sharper", "Finisher"];

export function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

export function teamflowOf(value?: string | null): TeamFlow {
  return teamflows.includes(value as TeamFlow) ? value as TeamFlow : "Initiator";
}

export function adminFellowRecord(fellow: AdminFellow): FellowRecord {
  const name = fellow.name?.trim() || fellow.email?.split("@")[0] || `Fellow ${fellow.id}`;
  return {
    id: fellow.id,
    name,
    initials: initialsOf(name),
    country: fellow.country ?? "—",
    university: fellow.university ?? "—",
    teamflow: teamflowOf(fellow.teamflow),
    team: fellow.team_name ?? "Unassigned",
    status: fellow.status === "confirmed" ? "Confirmed" : "Pending",
    startDate: fellow.created_at?.slice(0, 10) ?? "",
    email: fellow.email ?? null,
    discord: null,
    line: null,
    instagram: null,
  };
}

export function detailFellowRecord(fellow: FellowDetail): FellowRecord {
  const name = fellow.name?.trim() || fellow.email?.split("@")[0] || `Fellow ${fellow.id}`;
  return {
    id: fellow.id,
    name,
    initials: initialsOf(name),
    country: fellow.country ?? "—",
    university: fellow.university ?? "—",
    teamflow: teamflowOf(fellow.teamflow),
    team: fellow.team?.name ?? "Unassigned",
    status: fellow.status === "confirmed" ? "Confirmed" : "Pending",
    startDate: fellow.created_at?.slice(0, 10) ?? "",
    email: fellow.email ?? null,
    discord: fellow.discord_name ?? null,
    line: fellow.line_id ?? null,
    instagram: null,
  };
}
