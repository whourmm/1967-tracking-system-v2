import type { Fellow } from "../types/fellow";
import type { Assignment, AssignmentStatus, Sprint } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? "";

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

export type FellowMe = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  photo_url?: string | null;
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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
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
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const envelope = (await res.json()) as ApiEnvelope<T>;
  if (envelope.error) throw new Error(envelope.error);
  return envelope.data;
}

// ── Apps Script helpers ───────────────────────────────────────────────────────

export type SheetListResult = {
  count: number;
  sbieIds: string[];
  submissions: { timestamp: string; email: string; sbieId: string }[];
};

export type SheetCheckResult = {
  sbieId: string;
  submitted: boolean;
  submittedAt: string | null;
};

export type SheetSyncResult = {
  synced: number;
  notFound: string[];
  backendResponse?: unknown;
  message?: string;
  error?: string;
};

async function appsScriptGet<T>(params: Record<string, string>): Promise<T> {
  if (!APPS_SCRIPT_URL) throw new Error("VITE_APPS_SCRIPT_URL is not configured");
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${APPS_SCRIPT_URL}?${qs}`);
  if (!res.ok) throw new Error(`Apps Script error: ${res.status}`);
  const data = (await res.json()) as T & { error?: string };
  if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);
  return data;
}

export const sheets = {
  /** Returns all SBIE IDs that appear in the sheet (admin: who submitted). */
  list: (sheetTab = "") =>
    appsScriptGet<SheetListResult>({ action: "list", ...(sheetTab && { sheet: sheetTab }) }),

  /** Returns whether a single SBIE ID has submitted (student: did I submit?). */
  check: (sbieId: string, sheetTab = "") =>
    appsScriptGet<SheetCheckResult>({ action: "check", sbieId, ...(sheetTab && { sheet: sheetTab }) }),

  /** Syncs the sheet to the backend DB (admin: push responses to the system). */
  sync: (assignmentId: number, sheetTab = "") =>
    appsScriptGet<SheetSyncResult>({
      action: "sync",
      assignmentId: String(assignmentId),
      ...(sheetTab && { sheet: sheetTab }),
    }),
};

export const api = {
  health: () => get<{ status: string }>("/api/health"),
  me: () => getData<FellowMe>("/api/me"),
  listFellows: () => get<Fellow[]>("/api/fellows"),
  fellow: {
    assignments: async () => (await getData<FellowAssignmentResponse[]>("/api/fellow/assignments")).map(mapFellowAssignment),
    submitAssignment: (id: number) => sendData<SubmitAssignmentResponse>("POST", `/api/fellow/assignments/${id}/submit`),
    activeSprints: async () => (await getData<AdminSprint[]>("/api/cohorts/active/sprints")).map(mapSprint),
    cases: () => getData<FellowCase[]>("/api/cases"),
    learning: () => getData<FellowLearning>("/api/fellow/learning"),
    markResourceRead: (id: number) => sendData<MarkResourceReadResponse>("POST", `/api/fellow/resources/${id}/read`),
  },
  admin: {
    overview: () => getData<AdminOverview>("/api/admin/overview"),
    listCases: () => getData<AdminCase[]>("/api/admin/cases"),
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
