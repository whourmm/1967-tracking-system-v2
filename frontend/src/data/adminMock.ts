// Seed data for the [Anda]-owned admin pages. Reuses the cohort's fellows from
// mock.ts so the admin views and fellow views describe the same people.
import type { AdminAssignment, AdminEvent } from "../types";
import { allFellows } from "./mock";

// Cohorts shown in the top-bar selector (mock only — switching is cosmetic).
export const COHORTS = ["Cohort 2026", "Cohort 2025", "Cohort 2024"];

// The signed-in admin — backs the admin Profile page and the top-bar avatar.
export const adminProfile = {
  name: "Praewa Suksai",
  nickname: "Praewa",
  role: "Program Lead",
  department: "Cohort Operations",
  organization: "SEA Bridge · 1967 Fellowship",
  accessLevel: "Full admin",
  adminId: "SBIE-ADM-007",
  email: "praewa@seabridge.org",
  discord: "praewa_s",
  line: "praewasuk",
  instagram: "@praewa.s",
};

export const adminInitials = adminProfile.name
  .split(" ")
  .map((n) => n[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();

// Each fellow's "SEA Bridge ID" (SBIE) — the key a Google Form collects and an
// Apps Script matches against the response sheet to mark a submission. Mock
// format: SBIE26-001.
export const sbieId = (fellowId: number) => `SBIE26-${String(fellowId).padStart(3, "0")}`;

// Program sprints. An assignment is filed under one of these. The last entry is
// treated as the current sprint (default selection when adding an assignment).
export const SPRINTS = [
  "Sprint 1 · Foundations",
  "Sprint 2 · Customer Discovery",
  "Sprint 3 · Demo Build",
  "Sprint 4 · Investor Narrative",
];

export const adminEvents: AdminEvent[] = [
  {
    id: 1,
    title: "Sprint 4 Demo Day",
    date: "2026-06-12",
    allDay: false,
    start: "14:00",
    end: "16:00",
    tz: "Asia/Bangkok",
    location: "Online · Zoom",
    description:
      "Each team presents a 5-minute demo of their validated solution, followed by Q&A with mentors.",
  },
  {
    id: 2,
    title: "Mentor office hours",
    date: "2026-06-08",
    allDay: false,
    start: "10:00",
    end: "12:00",
    tz: "Asia/Singapore",
    location: "Online · Google Meet",
    description: "Drop-in slots with returning mentors. Bring your blockers.",
  },
  {
    id: 3,
    title: "Sprint 4 submission deadline",
    date: "2026-06-12",
    allDay: true,
    start: "",
    end: "",
    tz: "Asia/Bangkok",
    location: "",
    description: "Final deliverable due by end of day, anywhere on earth.",
  },
  {
    id: 4,
    title: "Cohort social night",
    date: "2026-06-20",
    allDay: false,
    start: "18:30",
    end: "20:00",
    tz: "Asia/Bangkok",
    location: "Online · Gather",
    description: "Wind-down hangout across the region. Cameras optional, snacks encouraged.",
  },
];

// Deterministic mock submission sets so the progress bars read sensibly.
const ids = allFellows.map((f) => f.id);

export const adminAssignments: AdminAssignment[] = [
  {
    id: 1,
    title: "Customer Interview Notes",
    sprint: "Sprint 2 · Customer Discovery",
    formUrl: "https://forms.gle/example-interviews",
    due: "2026-06-08",
    description:
      "Submit notes from at least 8 customer interviews, including key pain points and verbatim quotes.",
    submittedIds: ids.filter((_, i) => i % 3 !== 0),
  },
  {
    id: 2,
    title: "Sprint 4 Retrospective",
    sprint: "Sprint 4 · Investor Narrative",
    formUrl: "https://forms.gle/example-retro",
    due: "2026-06-14",
    description: "Reflect on what your team shipped this sprint and what you'd change next.",
    submittedIds: ids.filter((_, i) => i % 2 === 0),
  },
  {
    id: 3,
    title: "Weekly Check-in",
    sprint: "Sprint 3 · Demo Build",
    formUrl: "https://forms.gle/example-checkin",
    due: "2026-06-09",
    description: "Quick status: wins, blockers and what you need help with this week.",
    submittedIds: ids.slice(),
  },
];
