import { useSyncExternalStore } from "react";

// Tiny shared store for cross-page cohort state. Right now it only tracks which
// fellows are suspended (left/removed from the cohort) so the Members page and
// the Teams page agree without prop-drilling or a context provider.

let suspended: ReadonlySet<number> = new Set();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toggleSuspended(id: number) {
  const next = new Set(suspended);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  suspended = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return suspended;
}

// Reactive hook — re-renders the caller whenever the suspended set changes.
export function useSuspended(): ReadonlySet<number> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
