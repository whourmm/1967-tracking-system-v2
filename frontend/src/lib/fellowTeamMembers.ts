import { api, type FellowDetail, type FellowTeamMemberResponse } from "./api";
import type { Fellow } from "../types/fellow";
import { cachedTeamMembers } from "./teamAssignmentCache";

function fellowToTeamMember(fellow: Fellow, teamID?: number | null, teamName?: string | null): FellowTeamMemberResponse {
  return {
    id: fellow.id,
    name: fellow.name,
    email: fellow.email,
    photo_url: fellow.photo_url ?? null,
    country: fellow.country ?? null,
    university: fellow.university ?? null,
    teamflow: fellow.teamflow ?? null,
    team_id: fellow.team_id ?? teamID ?? null,
    team_name: fellow.team_name ?? teamName ?? null,
    completed_assignments: fellow.completed_assignments ?? 0,
    total_assignments: fellow.total_assignments ?? 0,
    progress_percent: fellow.progress_percent ?? 0,
  };
}

function fellowDetailToTeamMember(fellow: FellowDetail): FellowTeamMemberResponse {
  return {
    id: fellow.id,
    name: fellow.name,
    email: fellow.email,
    photo_url: fellow.photo_url ?? null,
    country: fellow.country ?? null,
    university: fellow.university ?? null,
    teamflow: fellow.teamflow ?? null,
    team_id: fellow.team?.id ?? null,
    team_name: fellow.team?.name ?? null,
    completed_assignments: 0,
    total_assignments: 0,
    progress_percent: 0,
  };
}

export async function resolveCurrentFellowTeamMembers({
  teamID,
  teamName,
}: {
  teamID?: number | null;
  teamName?: string | null;
}) {
  if (!teamID && !teamName) return [];

  const liveMembers = await api.fellow.teamMembers().catch(() => []);
  if (liveMembers.length > 0) return liveMembers;

  const fellows = await api.listFellows().catch(() => []);
  const details = await Promise.all(
    fellows.map((fellow) => api.fellowDetail(fellow.id).catch(() => null)),
  );
  const byDetail = details
    .filter((detail): detail is FellowDetail => Boolean(detail?.team && (detail.team.id === teamID || detail.team.name === teamName)))
    .map(fellowDetailToTeamMember);
  if (byDetail.length > 0) return byDetail;

  const byList = fellows
    .filter((fellow) => fellow.team_id === teamID || fellow.team_name === teamName)
    .map((fellow) => fellowToTeamMember(fellow, teamID, teamName));
  if (byList.length > 0) return byList;

  return teamName
    ? cachedTeamMembers(teamName).map((fellow) => ({
        id: fellow.id,
        name: fellow.name,
        email: fellow.email,
        photo_url: fellow.photoUrl,
        country: fellow.country,
        university: fellow.university,
        teamflow: fellow.teamflow,
        team_id: teamID ?? null,
        team_name: teamName,
        completed_assignments: fellow.completedAssignments ?? 0,
        total_assignments: fellow.totalAssignments ?? 0,
        progress_percent: fellow.progressPercent ?? 0,
      }))
    : [];
}
