import { api, type FellowMe } from "./api";
import { supabase } from "./supabase";

const SUPABASE_CONFIGURED =
  !!import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== "https://placeholder.supabase.co";

export type AppRole = "fellow" | "admin";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  initials: string;
  team?: string;
  cohort?: string;
  university?: string;
}

type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: string };

const PROFILE_KEY = "tracking-system-v2.profile";
export const DEV_EMAIL_KEY = "tracking-system-v2.dev-email";

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "FP";
}

function profileFromMe(profile: FellowMe): AppUser {
  if (profile.role !== "admin" && profile.role !== "fellow") {
    throw new Error("Your account does not have an app role.");
  }

  const name = profile.name?.trim() || profile.email?.split("@")[0] || "User";
  return {
    id: profile.id,
    name,
    email: profile.email ?? "",
    role: profile.role,
    initials: initialsFor(name),
    team: profile.fellow?.team_name ?? undefined,
    cohort: profile.fellow?.cohort_name ?? undefined,
    university: profile.fellow?.university ?? undefined,
  };
}

async function loadProfile() {
  const user = profileFromMe(await api.me());
  localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
  return user;
}

export async function initializeAuth() {
  if (!SUPABASE_CONFIGURED) {
    // Always refetch so DB changes (e.g. a role update) show up on reload.
    // Keep the cached profile as a fallback when the backend is unreachable.
    try { await loadProfile(); } catch { /* backend not ready yet */ }
    return;
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    localStorage.removeItem(PROFILE_KEY);
    return;
  }

  try {
    await loadProfile();
  } catch {
    if (!getCurrentUser()) localStorage.removeItem(PROFILE_KEY);
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!SUPABASE_CONFIGURED) {
    // Dev mode: the typed email selects which DB user to impersonate
    // (sent as X-Dev-Email on every request; see authHeaders in api.ts).
    localStorage.setItem(DEV_EMAIL_KEY, email.trim());
    try {
      return { ok: true, user: await loadProfile() };
    } catch (error) {
      localStorage.removeItem(DEV_EMAIL_KEY);
      return { ok: false, error: error instanceof Error ? error.message : "Unable to load account from backend." };
    }
  }

  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    return { ok: false, error: error.message };
  }

  try {
    return { ok: true, user: await loadProfile() };
  } catch (error) {
    await supabase.auth.signOut();
    return { ok: false, error: error instanceof Error ? error.message : "Unable to load your account." };
  }
}

export async function registerFellow({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() } },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.session) {
    return { ok: false, error: "Check your email to confirm the account, then sign in." };
  }

  try {
    return { ok: true, user: await loadProfile() };
  } catch (error) {
    await supabase.auth.signOut();
    return { ok: false, error: error instanceof Error ? error.message : "Unable to create your account." };
  }
}

export async function logout() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(DEV_EMAIL_KEY);
  if (SUPABASE_CONFIGURED) await supabase.auth.signOut();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return { ok: false, error: "Unable to load your signed-in account." };

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (signInError) return { ok: false, error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  const user = getCurrentUser();
  return user ? { ok: true, user } : { ok: false, error: "Password changed, but the local profile is unavailable." };
}

export function getCurrentUser(): AppUser | null {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? (JSON.parse(stored) as AppUser) : null;
  } catch {
    localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

export function homeForRole(role: AppRole) {
  return role === "admin" ? "/admin" : "/fellow";
}
