// Weekly availability shared between the Profile page (where a fellow picks
// their days) and the Team page (where the team's days are mapped together).
// There's no backend persistence yet, so the current fellow's selection lives
// in localStorage; teammates' availability comes from mock data.

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const dayFullNames: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export const defaultAvailability: Record<string, boolean> = {
  Mon: true,
  Tue: true,
  Wed: false,
  Thu: true,
  Fri: true,
  Sat: false,
  Sun: false,
};

const STORE_KEY = "profile-availability-v1";

export function loadMyAvailability(): Record<string, boolean> {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { ...defaultAvailability, ...stored };
  } catch {
    return { ...defaultAvailability };
  }
}

export function saveMyAvailability(availability: Record<string, boolean>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(availability));
}
