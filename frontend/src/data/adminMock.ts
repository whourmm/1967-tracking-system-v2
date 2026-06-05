// Seed data for the [Anda]-owned admin pages. Reuses the cohort's fellows from
// mock.ts so the admin views and fellow views describe the same people.
import type { AdminAssignment, AdminEvent } from "../types";
import { allFellows } from "./mock";

// Cohorts shown in the top-bar selector (mock only — switching is cosmetic).
export const COHORTS = ["Cohort 2026", "Cohort 2025", "Cohort 2024"];

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
    formUrl: "https://forms.gle/example-interviews",
    due: "2026-06-08",
    description:
      "Submit notes from at least 8 customer interviews, including key pain points and verbatim quotes.",
    submittedIds: ids.filter((_, i) => i % 3 !== 0),
  },
  {
    id: 2,
    title: "Sprint 4 Retrospective",
    formUrl: "https://forms.gle/example-retro",
    due: "2026-06-14",
    description: "Reflect on what your team shipped this sprint and what you'd change next.",
    submittedIds: ids.filter((_, i) => i % 2 === 0),
  },
  {
    id: 3,
    title: "Weekly Check-in",
    formUrl: "https://forms.gle/example-checkin",
    due: "2026-06-09",
    description: "Quick status: wins, blockers and what you need help with this week.",
    submittedIds: ids.slice(),
  },
];
