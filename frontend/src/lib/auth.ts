export type MockRole = "fellow" | "admin";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: MockRole;
  initials: string;
  team?: string;
  cohort?: string;
  university?: string;
}

type StoredSession = {
  email: string;
};

type AuthResult =
  | { ok: true; user: MockUser }
  | { ok: false; error: string };

const ACCOUNTS_KEY = "tracking-system-v2.mockAccounts";
const LOCAL_SESSION_KEY = "tracking-system-v2.mockSession.local";
const SESSION_SESSION_KEY = "tracking-system-v2.mockSession.session";

const seededAccounts: MockUser[] = [
  {
    id: "admin-praewa",
    name: "Praewa Suksai",
    email: "praewa@seabridge.org",
    password: "password123",
    role: "admin",
    initials: "PS",
  },
  {
    id: "fellow-sirada",
    name: "Sirada Wong",
    email: "sirada.w@example.com",
    password: "password123",
    role: "fellow",
    initials: "SW",
    team: "Team Mekong",
    cohort: "Cohort 2026",
    university: "Chulalongkorn University",
  },
  {
    id: "fellow-naphat",
    name: "Naphat Tan",
    email: "naphat.t@example.com",
    password: "password123",
    role: "fellow",
    initials: "NT",
    team: "Team Mekong",
    cohort: "Cohort 2026",
    university: "VNU University of Science",
  },
  {
    id: "fellow-mali",
    name: "Mali Chen",
    email: "mali.c@example.com",
    password: "password123",
    role: "fellow",
    initials: "MC",
    team: "Team Mekong",
    cohort: "Cohort 2026",
    university: "National University of Singapore",
  },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readJSON<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(storage: Storage, key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value));
}

function registeredAccounts() {
  return readJSON<MockUser[]>(localStorage, ACCOUNTS_KEY, []);
}

function saveRegisteredAccounts(accounts: MockUser[]) {
  writeJSON(localStorage, ACCOUNTS_KEY, accounts);
}

function initialsFor(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "FP";
}

function accountByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return getAccounts().find((account) => account.email === normalized) ?? null;
}

function setSession(email: string, remember: boolean) {
  const session: StoredSession = { email: normalizeEmail(email) };

  if (remember) {
    writeJSON(localStorage, LOCAL_SESSION_KEY, session);
    sessionStorage.removeItem(SESSION_SESSION_KEY);
    return;
  }

  writeJSON(sessionStorage, SESSION_SESSION_KEY, session);
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

export function getAccounts() {
  const accountsByEmail = new Map<string, MockUser>();

  [...seededAccounts, ...registeredAccounts()].forEach((account) => {
    accountsByEmail.set(normalizeEmail(account.email), {
      ...account,
      email: normalizeEmail(account.email),
    });
  });

  return [...accountsByEmail.values()];
}

export function login(email: string, password: string, remember: boolean): AuthResult {
  const account = accountByEmail(email);

  if (!account || account.password !== password) {
    return { ok: false, error: "Email or password does not match a demo account." };
  }

  setSession(account.email, remember);
  return { ok: true, user: account };
}

export function registerFellow({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): AuthResult {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    return { ok: false, error: "Full name is required." };
  }

  if (!normalizedEmail) {
    return { ok: false, error: "Email is required." };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  if (accountByEmail(normalizedEmail)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user: MockUser = {
    id: `local-${Date.now()}`,
    name: trimmedName,
    email: normalizedEmail,
    password,
    role: "fellow",
    initials: initialsFor(trimmedName),
    team: "Unassigned",
    cohort: "Cohort 2026",
    university: "",
  };

  saveRegisteredAccounts([...registeredAccounts(), user]);
  setSession(user.email, true);

  return { ok: true, user };
}

export function logout() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
  sessionStorage.removeItem(SESSION_SESSION_KEY);
}

export function getCurrentUser() {
  const session =
    readJSON<StoredSession | null>(sessionStorage, SESSION_SESSION_KEY, null) ??
    readJSON<StoredSession | null>(localStorage, LOCAL_SESSION_KEY, null);

  if (!session) {
    return null;
  }

  const account = accountByEmail(session.email);

  if (!account) {
    logout();
  }

  return account;
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function hasRole(allowedRoles: MockRole[]) {
  const user = getCurrentUser();
  return Boolean(user && allowedRoles.includes(user.role));
}

export function homeForRole(role: MockRole) {
  return role === "admin" ? "/admin" : "/fellow";
}
