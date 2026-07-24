// SBIE Fellow ID helpers — format: SBIE-<cohort year>-<fellow id>, e.g. SBIE-2026-024.

export function formatSbieId(fellowId: number, year: number | string) {
  return `SBIE-${year}-${String(fellowId).padStart(3, "0")}`;
}

// Pulls the numeric fellow id out of an SBIE ID string, tolerant of case,
// surrounding whitespace, and missing zero-padding (e.g. "sbie-2026-24").
export function parseSbieId(raw: string): number | null {
  const match = raw.trim().match(/^SBIE-\d{4}-(\d+)$/i);
  return match ? Number(match[1]) : null;
}
