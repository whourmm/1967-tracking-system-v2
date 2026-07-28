import type { Fellow } from "../types/fellow";
import type { Assignment, AssignmentStatus, Sprint } from "../types";
import { supabase } from "./supabase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? "";
const DEBUG_API = import.meta.env.DEV || import.meta.env.VITE_DEBUG_API === "true";

function isLocalApiURL(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return false;
  }
}

type ApiEnvelope<T> = {
  data: T;
  error: string | null;
};

export type AdminProgress = {
  done: number;
  total: number;
  pending: number;
  percent: number;
};

export type AdminOverview = {
  fellows: number;
  countries: number;
  teams: number;
  sprints: number;
  cases: number;
  resources: number;
  upcoming_events: number;
  assignment_progress: AdminProgress;
  case_submission_progress: AdminProgress;
  resource_read_progress: AdminProgress;
};

export type AdminCase = {
  id: number;
  cohort_id?: number;
  sprint_id?: number;
  title?: string;
  case_owner?: string;
  status?: string;
  summary?: string;
  file_name?: string;
  published_date?: string;
  googledrive_link?: string;
  created_at: string;
  update_at: string;
  theme?: string;
  create_by?: number;
};

export type AdminSprint = {
  id: number;
  cohort_id?: number;
  name?: string;
  description?: string;
  starts_on?: string;
  submission_deadline?: string;
  is_current: boolean;
  created_at: string;
  update_at: string;
  created_by?: number;
};

export type AdminResource = {
  id: number;
  type?: string;
  name?: string;
  description?: string;
  url?: string;
  duration?: string;
  author?: string;
  tag?: string;
  learning_block_id?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
};

export type ResourceReadStatus = {
  resource_id: number;
  read: number;
  unread: number;
  total: number;
  percent: number;
};

export type AdminFellow = {
  id: number;
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  country?: string | null;
  university?: string | null;
  teamflow?: string | null;
  team_id?: number | null;
  team_name?: string | null;
  status?: string | null;
  created_at: string;
  last_login_at?: string | null;
};

export type FellowDetail = {
  id: number;
  name?: string | null;
  email?: string | null;
  discord_name?: string | null;
  line_id?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  country?: string | null;
  university?: string | null;
  major?: string | null;
  status?: string | null;
  teamflow?: string | null;
  team?: { id: number; name: string } | null;
  created_at: string;
  last_login_at?: string | null;
};

export type FellowTeamMemberResponse = {
  id: number;
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  country?: string | null;
  university?: string | null;
  teamflow?: string | null;
  team_id?: number | null;
  team_name?: string | null;
  completed_assignments: number;
  total_assignments: number;
  progress_percent: number;
};

export type TeamResponse = {
  id: number;
  group_id?: number | null;
  name?: string | null;
  case_id?: number | null;
  case_title?: string | null;
  member_count: number;
  created_at: string;
  update_at: string;
};

export type FellowTeamResponse = {
  id: number;
  name: string;
  case?: { id: number; title: string } | null;
  members: Array<{
    id: number;
    name: string;
    country: string;
    university: string;
    teamflow: string;
  }>;
};

export type CaseSubmissionStatus = {
  case_id: number;
  status: "pending" | "submitted" | "reviewed";
};

export type AdminEventResponse = {
  id: number;
  cohort_id?: number | null;
  name?: string | null;
  description?: string | null;
  date?: string | null;
  all_day: boolean;
  start?: string | null;
  end?: string | null;
  timezone?: string | null;
  location?: string | null;
};

export type AdminAssignmentResponse = {
  id: number;
  cohort_id?: number | null;
  sprint_id?: number | null;
  title?: string | null;
  form_url?: string | null;
  deadline?: string | null;
  description?: string | null;
  sheet_tab?: string | null;
  submitted_count: number;
  total_fellows: number;
  created_at: string;
  update_at: string;
};

export type AssignmentSubmissionsResponse = {
  assignment_id: number;
  title?: string | null;
  deadline?: string | null;
  submitted_count: number;
  total_fellows: number;
  fellows: Array<{
    member_id: number;
    name: string;
    submit_status: number;
    status_name: "pending" | "submitted" | "overdue";
    submitted_at?: string | null;
  }>;
};

export type FellowMe = {
  id: number;
  public_id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  photo_url?: string | null;
  discord_name?: string | null;
  line_id?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  country?: string | null;
  fellow?: {
    team_id?: number | null;
    team_name?: string | null;
    cohort_id?: number | null;
    cohort_name?: string | null;
    university?: string | null;
    major?: string | null;
    status?: string | null;
    teamflow?: string | null;
  } | null;
};

export type FellowProfileUpdatePayload = {
  name?: string | null;
  photo_url?: string | null;
  discord_name?: string | null;
  line_id?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  country?: string | null;
  university?: string | null;
  major?: string | null;
  teamflow?: string | null;
};

export type FellowCase = AdminCase;

export type FellowAssignmentResponse = {
  id: number;
  cohort_id?: number | null;
  sprint_id?: number | null;
  learning_block_id?: number | null;
  learning_block?: string | null;
  title?: string | null;
  form_url?: string | null;
  deadline?: string | null;
  description?: string | null;
  submit_status: number;
  status_name: "pending" | "submitted" | "overdue";
  submitted_at?: string | null;
  grade?: string | null;
};

export type SubmitAssignmentResponse = {
  assignment_id: number;
  member_id: number;
  submit_status: 1;
  status_name: "submitted";
  submitted_at: string;
};

export type FellowLearningResource = {
  id: number;
  type?: string | null;
  name?: string | null;
  description?: string | null;
  url?: string | null;
  duration?: string | null;
  author?: string | null;
  tag?: string | null;
  learning_block_id?: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  read_at?: string | null;
};

export type FellowLearningSection = {
  id?: number | null;
  code?: string | null;
  kind: "block" | "special" | string;
  title: string;
  description?: string | null;
  sort_order: number;
  resources: FellowLearningResource[];
  assignments: FellowAssignmentResponse[];
};

export type FellowLearning = {
  blocks: FellowLearningSection[];
  special_sections: FellowLearningSection[];
};

export type MarkResourceReadResponse = {
  resource_id: number;
  member_id: number;
  read_at: string;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let payload: unknown;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!res.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error: unknown }).error)
      : `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return payload as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: await authHeaders() });
  const payload = await parseResponse<T>(res);
  if (DEBUG_API) {
    console.log(`[api] GET ${path}`, payload);
  }
  return payload;
}

async function getData<T>(path: string): Promise<T> {
  const envelope = await get<ApiEnvelope<T>>(path);
  if (envelope.error) throw new Error(envelope.error);
  return envelope.data;
}

function dateOnly(value?: string | null): string {
  return value?.slice(0, 10) ?? "";
}

function assignmentStatus(item: FellowAssignmentResponse): AssignmentStatus {
  if (item.grade) return "graded";
  return item.status_name;
}

export function mapFellowAssignment(item: FellowAssignmentResponse): Assignment {
  return {
    id: item.id,
    title: item.title ?? "Untitled assignment",
    description: item.description ?? "",
    block: item.learning_block ?? (item.learning_block_id ? String(item.learning_block_id) : "General"),
    deadline: dateOnly(item.deadline),
    status: assignmentStatus(item),
    formUrl: item.form_url ?? "",
    submittedAt: item.submitted_at ?? undefined,
    grade: item.grade ?? undefined,
  };
}

function mapSprint(item: AdminSprint): Sprint {
  return {
    id: item.id,
    name: item.name ?? "Untitled sprint",
    description: item.description ?? "",
    startsOn: dateOnly(item.starts_on),
    deadline: dateOnly(item.submission_deadline),
    isCurrent: item.is_current,
  };
}

async function sendData<T>(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: await authHeaders(Boolean(body)),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  let envelope: ApiEnvelope<T>;
  try {
    envelope = await parseResponse<ApiEnvelope<T>>(res);
  } catch (error) {
    if (DEBUG_API) {
      console.error(`[api] ${method} ${url} failed`, {
        status: res.status,
        statusText: res.statusText,
        error,
      });
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${method} ${path} failed (${res.status}): ${detail}`);
  }
  if (envelope.error) {
    if (DEBUG_API) {
      console.error(`[api] ${method} ${url} returned envelope error`, {
        status: res.status,
        error: envelope.error,
      });
    }
    throw new Error(`${method} ${path} failed (${res.status}): ${envelope.error}`);
  }
  if (DEBUG_API) {
    console.log(`[api] ${method} ${url}`, envelope.data);
  }
  return envelope.data;
}

async function authHeaders(hasBody = false) {
  const headers = new Headers();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  // Dev mode: only local backends allow X-Dev-Email. The published roadmap API
  // allows Content-Type and Authorization, so sending this to Cloud Run breaks
  // CORS preflight.
  const devEmail = localStorage.getItem("tracking-system-v2.dev-email");
  if (devEmail && isLocalApiURL(BASE_URL)) {
    headers.set("X-Dev-Email", devEmail);
  }
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function appsScriptGet<T>(params: Record<string, string>): Promise<T> {
  if (!APPS_SCRIPT_URL) throw new Error("VITE_APPS_SCRIPT_URL is not configured");
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Apps Script ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json as T;
}

type SheetListResult = { count: number; sbieIds: string[]; submissions: Array<{ sbieId: string; timestamp: string; email: string }> };
type SheetCheckResult = { sbieId: string; submitted: boolean; submittedAt: string | null };

export const sheets = {
  list: (sheetTab = "") => appsScriptGet<SheetListResult>({ action: "list", sheetTab }),
  check: (sbieId: string, sheetTab = "") => appsScriptGet<SheetCheckResult>({ action: "check", sbieId, sheetTab }),
};

export const api = {
  health: () => get<{ status: string }>("/api/health"),
  me: () => getData<FellowMe>("/api/me"),
  listFellows: () => get<Fellow[]>("/api/fellows"),
  fellowDetail: (id: number) => getData<FellowDetail>(`/api/fellows/${id}`),
  events: () => getData<AdminEventResponse[]>("/api/events"),
  teams: () => getData<TeamResponse[]>("/api/teams"),
  fellow: {
    team: () => getData<FellowTeamResponse | null>("/api/fellow/team"),
    assignments: async () => (await getData<FellowAssignmentResponse[]>("/api/fellow/assignments")).map(mapFellowAssignment),
    submitAssignment: (id: number) => sendData<SubmitAssignmentResponse>("POST", `/api/fellow/assignments/${id}/submit`),
    activeSprints: async () => (await getData<AdminSprint[]>("/api/cohorts/active/sprints")).map(mapSprint),
    cases: () => getData<FellowCase[]>("/api/cases"),
    learning: () => getData<FellowLearning>("/api/fellow/learning"),
    markResourceRead: (id: number) => sendData<MarkResourceReadResponse>("POST", `/api/fellow/resources/${id}/read`),
    teamMembers: () => getData<FellowTeamMemberResponse[]>("/api/fellow/team"),
    updateProfile: (payload: FellowProfileUpdatePayload) =>
      sendData<FellowMe>("PATCH", "/api/fellow/profile", payload),
  },
  admin: {
    overview: () => getData<AdminOverview>("/api/admin/overview"),
    listFellows: () => getData<AdminFellow[]>("/api/admin/fellows"),
    createFellow: (payload: Partial<AdminFellow> & { gmail?: string; major?: string }) =>
      sendData<AdminFellow>("POST", "/api/admin/fellows", payload),
    updateFellow: (id: number, payload: Partial<AdminFellow> & { major?: string; group_id?: number | null }) =>
      sendData<AdminFellow>("PATCH", `/api/admin/fellows/${id}`, payload),
    deleteFellow: (id: number) => sendData<void>("DELETE", `/api/admin/fellows/${id}`),
    listAssignments: () => getData<AdminAssignmentResponse[]>("/api/admin/assignments"),
    assignmentSubmissions: (id: number) =>
      getData<AssignmentSubmissionsResponse>(`/api/admin/assignments/${id}/submissions`),
    createAssignment: (payload: Partial<AdminAssignmentResponse>) =>
      sendData<AdminAssignmentResponse>("POST", "/api/admin/assignments", payload),
    updateAssignment: (id: number, payload: Partial<AdminAssignmentResponse>) =>
      sendData<AdminAssignmentResponse>("PATCH", `/api/admin/assignments/${id}`, payload),
    deleteAssignment: (id: number) =>
      sendData<{ deleted: boolean }>("DELETE", `/api/admin/assignments/${id}`),
    syncAssignment: (id: number, submittedMemberIds: number[]) =>
      sendData<{ assignment_id: number; updated_count: number; synced_at: string }>(
        "POST",
        `/api/admin/assignments/${id}/sync`,
        { submitted_member_ids: submittedMemberIds },
      ),
    createEvent: (payload: Partial<AdminEventResponse>) =>
      sendData<AdminEventResponse>("POST", "/api/admin/events", payload),
    updateEvent: (id: number, payload: Partial<AdminEventResponse>) =>
      sendData<AdminEventResponse>("PATCH", `/api/admin/events/${id}`, payload),
    deleteEvent: (id: number) => sendData<void>("DELETE", `/api/admin/events/${id}`),
    saveTeamAssignments: (assignments: Array<{ member_id: number; team_id: number | null; group_id: number | null }>) =>
      sendData<{ updated_count: number }>("POST", "/api/admin/teams/assignments", { assignments }),
    listCases: () => getData<AdminCase[]>("/api/admin/cases"),
    caseSubmissionStatuses: () => getData<CaseSubmissionStatus[]>("/api/admin/case-submissions"),
    getCase: (id: number) => getData<AdminCase>(`/api/admin/cases/${id}`),
    createCase: (payload: Partial<AdminCase>) => sendData<AdminCase>("POST", "/api/admin/cases", payload),
    updateCase: (id: number, payload: Partial<AdminCase>) => sendData<AdminCase>("PATCH", `/api/admin/cases/${id}`, payload),
    deleteCase: (id: number) => sendData<{ deleted: boolean }>("DELETE", `/api/admin/cases/${id}`),
    listSprints: () => getData<AdminSprint[]>("/api/admin/sprints"),
    getSprint: (id: number) => getData<AdminSprint>(`/api/admin/sprints/${id}`),
    createSprint: (payload: Partial<AdminSprint>) => sendData<AdminSprint>("POST", "/api/admin/sprints", payload),
    updateSprint: (id: number, payload: Partial<AdminSprint>) => sendData<AdminSprint>("PATCH", `/api/admin/sprints/${id}`, payload),
    deleteSprint: (id: number) => sendData<{ deleted: boolean }>("DELETE", `/api/admin/sprints/${id}`),
    listResources: () => getData<AdminResource[]>("/api/admin/resources"),
    getResource: (id: number) => getData<AdminResource>(`/api/admin/resources/${id}`),
    createResource: (payload: Partial<AdminResource>) => sendData<AdminResource>("POST", "/api/admin/resources", payload),
    updateResource: (id: number, payload: Partial<AdminResource>) => sendData<AdminResource>("PATCH", `/api/admin/resources/${id}`, payload),
    deleteResource: (id: number) => sendData<{ deleted: boolean }>("DELETE", `/api/admin/resources/${id}`),
    resourceReadStatus: () => getData<ResourceReadStatus[]>("/api/admin/resources/read-status"),
  },
};
