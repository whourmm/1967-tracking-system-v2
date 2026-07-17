import {
  adminAssignments,
  adminEvents,
  adminProfile,
  caseSubmissionStatus,
  COHORTS,
  learningReadIds,
  resourceReadIds,
  SPRINTS,
} from "../data/adminMock";
import {
  allFellows,
  assignments,
  caseAssignments,
  currentFellow,
  learningBlocks,
  notifications,
  recentActivity,
  resources,
  specialCurriculum,
  sprints,
  teamMembers,
} from "../data/mock";
import type { AdminResource } from "./api";
import { api } from "./api";
import { getCurrentUser } from "./auth";
import { adminFellowRecord, detailFellowRecord, initialsOf } from "./fellowRecords";
import type { LearningBlock, ResourceType, SpecialCurriculum } from "../types";

function replace<T>(target: T[], values: T[]) {
  target.splice(0, target.length, ...values);
}

function clearRecord(target: Record<string, unknown>) {
  Object.keys(target).forEach((key) => delete target[key]);
}

function resourceType(value?: string | null): ResourceType {
  if (value === "CASE" || value === "LECTURE" || value === "ARTICLE") return value;
  return value === "VIDEO" ? "LECTURE" : "ARTICLE";
}

function hydrateResources(items: AdminResource[]) {
  replace(resources, items.map((item) => ({
    id: item.id,
    type: resourceType(item.type),
    name: item.name ?? "Untitled resource",
    description: item.description ?? "",
    duration: item.duration ?? "",
    author: item.author ?? "",
    tag: item.tag ?? "",
    progress: 0,
    url: item.url ?? "",
  })));

  const grouped = new Map<number, AdminResource[]>();
  items.filter((item) => item.learning_block_id != null).forEach((item) => {
    const id = item.learning_block_id as number;
    grouped.set(id, [...(grouped.get(id) ?? []), item]);
  });
  const blocks: LearningBlock[] = [...grouped.entries()].map(([id, blockResources]) => ({
    id: String(id),
    title: `Learning block ${id}`,
    articles: blockResources.map((item) => ({
      label: item.name ?? "Untitled resource",
      url: item.url ?? "",
      kind: item.type === "VIDEO" || item.type === "LECTURE" ? "video" : "article",
      meta: item.duration ?? undefined,
      resourceId: item.id,
    })),
  }));
  replace(learningBlocks, blocks);

  const specialItems = items.filter((item) => item.tag === "Startup Mindset");
  const special: SpecialCurriculum[] = specialItems.length ? [{
    title: "The Startup Mindset Book",
    links: specialItems.map((item) => ({
      label: item.name ?? "Untitled resource",
      url: item.url ?? "",
      kind: item.type === "PDF" ? "pdf" : "external",
      meta: item.duration ?? undefined,
      resourceId: item.id,
    })),
  }] : [];
  replace(specialCurriculum, special);
}

export async function hydrateLiveData() {
  const user = getCurrentUser();
  if (!user) return;

  replace(allFellows, []);
  replace(assignments, []);
  replace(caseAssignments, []);
  replace(resources, []);
  replace(specialCurriculum, []);
  replace(learningBlocks, []);
  replace(sprints, []);
  replace(teamMembers, []);
  replace(notifications, []);
  replace(recentActivity, []);
  replace(adminEvents, []);
  replace(adminAssignments, []);
  replace(SPRINTS, ["Unscheduled"]);
  replace(COHORTS, ["Current cohort"]);
  clearRecord(caseSubmissionStatus);
  clearRecord(resourceReadIds);
  clearRecord(learningReadIds);

  Object.assign(currentFellow, {
    name: user.name,
    role: user.role === "admin" ? "Administrator" : "Fellow",
    team: "Unassigned",
    cohort: "Current cohort",
    university: "—",
    avatarInitials: user.initials,
  });
  Object.assign(adminProfile, {
    name: user.name,
    nickname: user.name.split(" ")[0] ?? user.name,
    role: "Administrator",
    email: user.email,
    discord: "",
    line: "",
    instagram: "",
  });

  if (user.role === "admin") {
    const [me, fellows, sprintRows, assignmentRows, caseRows, resourceRows, eventRows] = await Promise.all([
      api.me(),
      api.admin.listFellows(),
      api.admin.listSprints(),
      api.admin.listAssignments(),
      api.admin.listCases(),
      api.admin.listResources(),
      api.events(),
    ]);
    const submissionRows = await Promise.all(assignmentRows.map((item) => api.admin.assignmentSubmissions(item.id)));

    replace(allFellows, fellows.map(adminFellowRecord));
    Object.assign(adminProfile, {
      name: me.name ?? user.name,
      nickname: (me.name ?? user.name).split(" ")[0],
      role: "Administrator",
      email: me.email ?? user.email,
      discord: "",
      line: "",
      instagram: "",
    });
    replace(sprints, sprintRows.map((item) => ({
      id: item.id,
      name: item.name ?? "Untitled sprint",
      description: item.description ?? "",
      startsOn: item.starts_on?.slice(0, 10) ?? "",
      deadline: item.submission_deadline?.slice(0, 10) ?? "",
      isCurrent: item.is_current,
    })));
    replace(SPRINTS, sprintRows.map((item) => item.name ?? `Sprint ${item.id}`));

    replace(adminEvents, eventRows.map((item) => ({
      id: item.id,
      title: item.name ?? "Untitled event",
      date: item.date ?? "",
      allDay: item.all_day,
      start: item.start ?? "",
      end: item.end ?? "",
      tz: item.timezone ?? "Asia/Bangkok",
      location: item.location ?? "",
      description: item.description ?? "",
    })));

    replace(adminAssignments, assignmentRows.map((item, index) => ({
      id: item.id,
      title: item.title ?? "Untitled assignment",
      sprint: sprintRows.find((sprint) => sprint.id === item.sprint_id)?.name ?? "Unscheduled",
      formUrl: item.form_url ?? "",
      due: item.deadline?.slice(0, 10) ?? "",
      description: item.description ?? "",
      submittedIds: submissionRows[index].fellows.filter((fellow) => fellow.submit_status === 1).map((fellow) => fellow.member_id),
    })));

    replace(assignments, assignmentRows.map((item) => ({
      id: item.id,
      title: item.title ?? "Untitled assignment",
      description: item.description ?? "",
      block: "General",
      deadline: item.deadline?.slice(0, 10) ?? "",
      status: "pending",
      formUrl: item.form_url ?? "",
    })));

    replace(caseAssignments, caseRows.map((item) => ({
      id: item.id,
      sprint: sprintRows.find((sprint) => sprint.id === item.sprint_id)?.name ?? "Unscheduled",
      company: item.case_owner ?? "",
      caseTitle: item.title ?? "Untitled case",
      description: item.summary ?? "",
      assignedTeam: "Unassigned",
      deadline: item.published_date?.slice(0, 10) ?? "",
      status: item.status === "reviewed" || item.status === "submitted" ? item.status : "pending",
      briefUrl: item.googledrive_link ?? "",
      submissionUrl: "",
      deliverable: item.theme ?? "",
    })));
    clearRecord(caseSubmissionStatus);
    caseAssignments.forEach((item) => { caseSubmissionStatus[item.id] = item.status; });
    hydrateResources(resourceRows);
    return;
  }

  const [me, summaries] = await Promise.all([api.me(), api.listFellows()]);
  const details = await Promise.all(summaries.map((fellow) => api.fellowDetail(fellow.id)));
  replace(allFellows, details.map(detailFellowRecord));
  Object.assign(currentFellow, {
    name: me.name ?? user.name,
    role: "Fellow",
    team: me.fellow?.team_name ?? "Unassigned",
    cohort: me.fellow?.cohort_name ?? "Current cohort",
    university: me.fellow?.university ?? "—",
    avatarInitials: initialsOf(me.name ?? user.name),
  });
  replace(teamMembers, allFellows.filter((fellow) => fellow.team === currentFellow.team).map((fellow) => ({
    name: fellow.name,
    initials: fellow.initials,
    country: fellow.country,
    university: fellow.university,
    teamflow: fellow.teamflow,
    availability: [],
  })));
}
