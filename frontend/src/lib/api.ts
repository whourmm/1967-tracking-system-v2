import type { Fellow } from "../types/fellow";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

export const api = {
  health: () => get<{ status: string }>("/api/health"),
  listFellows: () => get<Fellow[]>("/api/fellows"),
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
