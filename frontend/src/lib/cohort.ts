// Shared cohort display maps. The fellow-facing pages each defined these
// inline; the admin pages reuse them from here to stay consistent.
import type { TeamFlow } from "../types";

export const countryFlag: Record<string, string> = {
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
  Singapore: "🇸🇬",
  Indonesia: "🇮🇩",
  Philippines: "🇵🇭",
  Malaysia: "🇲🇾",
  Myanmar: "🇲🇲",
  Cambodia: "🇰🇭",
};

export const flagFor = (country: string) => countryFlag[country] ?? "🌏";

// Tailwind classes for each TeamFlow archetype chip — matches RosterPage/TeamPage.
export const teamflowChip: Record<TeamFlow, string> = {
  Initiator: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  Translator: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
  Sharper: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
  Finisher: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
};

export const allTeamflows: TeamFlow[] = [
  "Initiator",
  "Translator",
  "Sharper",
  "Finisher",
];
