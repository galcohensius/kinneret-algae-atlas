/** Canonical atlas URL for “how to cite” (HTTPS). */
export const ATLAS_CITE_URL = "https://kinneret-algae-atlas.org/";

/** Format `YYYY-MM-DD` (from extractor metadata) as e.g. `1 May 2026` in UTC. */
export function formatRecordUpdatedLong(isoDate: string): string {
  const parts = isoDate.trim().split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d || parts.length !== 3) {
    return isoDate;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
