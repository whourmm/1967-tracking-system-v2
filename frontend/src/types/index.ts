// Domain types for the Fellow portal. These mirror the backend schema
// (cohort → sprint, assignment + assignment_submission, resource) so the
// mock data can later be swapped for real API responses with minimal change.

export type AssignmentStatus = "pending" | "submitted" | "overdue" | "graded";

export interface Assignment {
  id: number;
  title: string;
  description: string;
  sprint: string;
  deadline: string; // ISO date
  status: AssignmentStatus;
  formUrl: string;
  submittedAt?: string;
  grade?: string;
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

export interface ActivityItem {
  id: number;
  text: string;
  time: string;
  kind: "submission" | "resource" | "team" | "announcement";
}
