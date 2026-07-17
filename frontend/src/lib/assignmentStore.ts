import { useEffect, useState } from "react";
import { adminAssignments, SPRINTS } from "../data/adminMock";
import { allFellows, assignments, currentFellow } from "../data/mock";
import type { AdminAssignment, Assignment, AssignmentStatus } from "../types";

const CHANGE_EVENT = "tracking-system-v2.admin-assignments:changed";

const seededTasks = () =>
  adminAssignments.map((assignment) => ({
    ...assignment,
    submittedIds: [...assignment.submittedIds],
  }));

export function currentFellowId() {
  return allFellows.find((fellow) => fellow.name === currentFellow.name)?.id ?? allFellows[0]?.id ?? 1;
}

export function loadAdminAssignments(): AdminAssignment[] {
  return seededTasks();
}

export function saveAdminAssignments(nextAssignments: AdminAssignment[]) {
  adminAssignments.splice(0, adminAssignments.length, ...nextAssignments.map((assignment) => ({
    ...assignment,
    submittedIds: [...assignment.submittedIds],
  })));
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeAdminAssignments(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function sprintToBlock(sprint: string) {
  const index = SPRINTS.indexOf(sprint);
  return index >= 0 ? String.fromCharCode(65 + index) : "Admin";
}

function isPastDue(due: string) {
  if (!due) return false;
  return new Date(`${due}T23:59:59`).getTime() < Date.now();
}

function statusFor(assignment: AdminAssignment, fellowId: number): AssignmentStatus {
  if (assignment.submittedIds.includes(fellowId)) return "submitted";
  return isPastDue(assignment.due) ? "overdue" : "pending";
}

function adminToFellowAssignment(assignment: AdminAssignment, fellowId: number): Assignment {
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    block: sprintToBlock(assignment.sprint),
    deadline: assignment.due,
    status: statusFor(assignment, fellowId),
    formUrl: assignment.formUrl,
  };
}

function assignmentKey(assignment: Pick<Assignment, "title" | "formUrl">) {
  return `${assignment.title.trim().toLowerCase()}::${assignment.formUrl.trim().toLowerCase()}`;
}

export function loadFellowAssignments(fellowId = currentFellowId()): Assignment[] {
  const adminMapped = loadAdminAssignments().map((assignment) =>
    adminToFellowAssignment(assignment, fellowId)
  );
  const adminKeys = new Set(adminMapped.map(assignmentKey));
  const staticOnly = assignments.filter((assignment) => !adminKeys.has(assignmentKey(assignment)));

  return [...staticOnly, ...adminMapped];
}

export function useAdminAssignments() {
  const [tasks, setTasks] = useState<AdminAssignment[]>(loadAdminAssignments);

  useEffect(() => subscribeAdminAssignments(() => setTasks(loadAdminAssignments())), []);

  return tasks;
}

export function useFellowAssignments(fellowId = currentFellowId()) {
  const [tasks, setTasks] = useState<Assignment[]>(() => loadFellowAssignments(fellowId));

  useEffect(
    () => subscribeAdminAssignments(() => setTasks(loadFellowAssignments(fellowId))),
    [fellowId]
  );

  return tasks;
}
