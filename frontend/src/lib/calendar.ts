// Build a prefilled "Add to Google Calendar" link for an admin event, so
// attendees can save it in one click. Mirrors the mock console's gcalUrl().
import type { AdminEvent } from "../types";

export const TIMEZONES = [
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "UTC",
];

export function gcalUrl(ev: AdminEvent): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = ev.date.replace(/-/g, "");
  let dates: string;

  if (ev.allDay) {
    // Google treats the all-day end date as exclusive — bump it by one day.
    const d = new Date(ev.date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    dates = `${ymd}/${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  } else {
    const s = (ev.start || "09:00").replace(":", "") + "00";
    const e = (ev.end || "10:00").replace(":", "") + "00";
    dates = `${ymd}T${s}/${ymd}T${e}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title || "Event",
    dates,
    details: ev.description || "",
    location: ev.location || "",
  });
  if (!ev.allDay && ev.tz) params.set("ctz", ev.tz);

  return "https://calendar.google.com/calendar/render?" + params.toString();
}

// Human-readable "when" line for an event row.
export function formatEventWhen(ev: AdminEvent): string {
  const d = new Date(ev.date + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (ev.allDay) return `${dateStr} · All day`;
  const tz = ev.tz ? ` (${ev.tz.split("/").pop()?.replace(/_/g, " ")})` : "";
  return `${dateStr} · ${ev.start}–${ev.end}${tz}`;
}
