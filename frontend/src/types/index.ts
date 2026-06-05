// Domain types for the Fellow portal. These mirror the backend schema
// (cohort → sprint, assignment + assignment_submission, resource) so the
// mock data can later be swapped for real API responses with minimal change.

export type AssignmentStatus = "pending" | "submitted" | "overdue" | "graded";

// An assignment IS the Google Form submission that belongs to a learning
// block. `block` ties it back to the block (A, B, C, …) it was assigned in.
export interface Assignment {
  id: number;
  title: string;
  description: string;
  block: string; // learning block id this assignment belongs to ("A", "B", …)
  deadline: string; // ISO date
  status: AssignmentStatus;
  formUrl: string; // Google Form to submit
  submittedAt?: string;
  grade?: string;
}

export type CaseAssignmentStatus = "pending" | "submitted" | "reviewed";

// A case assignment is separate from a learning-block form. It is sprint-based
// and tied to the company/case brief assigned to a fellow's team.
export interface CaseAssignment {
  id: number;
  sprint: string;
  company: string;
  caseTitle: string;
  description: string;
  assignedTeam: string;
  deadline: string;
  status: CaseAssignmentStatus;
  briefUrl: string;
  submissionUrl: string;
  deliverable: string;
}

export type ResourceType = "CASE" | "LECTURE" | "ARTICLE";

export interface Resource {
  id: number;
  type: ResourceType;
  name: string;
  description: string;
  duration: string;
  author: string;
  tag: string;
  progress: number; // 0–100
}

// --- Learning System ---------------------------------------------------------
// The learning system is just a curated hub of external links. Each block
// groups optional videos / articles to learn from, plus the Google Forms to
// submit afterwards. Nothing here is fixed: a block may have only videos, only
// articles, or only assignments. Some curriculum (e.g. a book) lives outside
// any block and is surfaced as a "special" item.

export type LearningLinkKind = "video" | "article" | "form" | "pdf" | "external";

export interface LearningLink {
  label: string;
  url: string;
  kind: LearningLinkKind;
  meta?: string; // e.g. "12 min", "Google Form", "Thai · MEB"
}

export interface LearningBlock {
  id: string; // "A", "B", "C", …
  title: string;
  description?: string;
  videos?: LearningLink[]; // YouTube, etc.
  articles?: LearningLink[]; // SEAbridge articles, etc.
  // Assignments (Google Forms) are not stored here — they live in the shared
  // `assignments` list and are matched to a block by `Assignment.block`, so the
  // Learning System and Assignments pages stay in sync.
}

export interface SpecialCurriculum {
  title: string;
  description?: string;
  links: LearningLink[];
}

export interface Sprint {
  id: number;
  name: string;
  description: string;
  startsOn: string;
  deadline: string;
  isCurrent: boolean;
}

export interface FellowProfile {
  name: string;
  role: string;
  team: string;
  cohort: string;
  university: string;
  avatarInitials: string;
}

// TeamFlow archetype — every fellow is tagged with one. A team must include at
// least one Finisher (composition rule).
export type TeamFlow = "Initiator" | "Translator" | "Sharper" | "Finisher";

export interface TeamMember {
  name: string;
  initials: string;
  country: string;
  university: string;
  teamflow: TeamFlow;
}

export type FellowStatus = "Confirmed" | "Pending";

// Full public-facing fellow record surfaced on the Roster and Fellow Detail pages.
export interface FellowRecord {
  id: number;
  name: string;
  initials: string;
  country: string;
  university: string;
  teamflow: TeamFlow;
  team: string;
  status: FellowStatus;
  startDate: string; // ISO date
  // Contact visibility is per-field; null means the fellow has set it private.
  email: string | null;
  discord: string | null;
  line: string | null;
  instagram: string | null;
}

export interface ActivityItem {
  id: number;
  text: string;
  time: string;
  kind: "submission" | "resource" | "team" | "announcement";
}

// --- Admin portal ------------------------------------------------------------
// Types backing the [Anda]-owned admin pages: Fellows, Teams, Upcoming Events
// and Assignments. They sit alongside the fellow-facing types so the admin
// pages can later swap mock data for the same API responses.

// A calendar event the admin publishes. Attendees add it to Google Calendar
// with one click (see lib/calendar.ts).
export interface AdminEvent {
  id: number;
  title: string;
  date: string; // ISO date (YYYY-MM-DD)
  allDay: boolean;
  start: string; // "HH:MM" — empty when allDay
  end: string; // "HH:MM" — empty when allDay
  tz: string; // IANA timezone, e.g. "Asia/Bangkok"
  location: string;
  description: string;
}

// Cohort-wide view of an assignment: which fellows have submitted its Google
// Form. Mirrors the fellow-side `Assignment`, but tracked across everyone.
export interface AdminAssignment {
  id: number;
  title: string;
  formUrl: string;
  due: string; // ISO date, "" when none
  description: string;
  submittedIds: number[]; // FellowRecord ids that have submitted
}
