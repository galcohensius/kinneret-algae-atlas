import { absoluteUrl } from "./site";

/** Canonical atlas URL for “how to cite” (HTTPS). */
export const ATLAS_CITE_URL = absoluteUrl("/");
export const CANONICAL_AUTHORS = ["Dr. Tamar Zohary", "Dr. Alla Alster"] as const;
export const CANONICAL_PUBLISHER = "Israel Oceanographic & Limnological Research";
export const CANONICAL_AFFILIATION =
  "Kinneret Limnological Institute, Israel Oceanographic and Limnological Research";

/** Format `YYYY-MM-DD` (from extractor metadata) as `1 May 2026` or, with "short", `1 May 2026` abbreviated (`30 Aug 2026`); UTC. */
export function formatRecordUpdated(isoDate: string, month: "long" | "short" = "long"): string {
  const parts = isoDate.trim().split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d || parts.length !== 3) {
    return isoDate;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildAtlasAttribution(): string {
  return `${CANONICAL_AUTHORS.join(", ")}. ${CANONICAL_AFFILIATION}.`;
}

export function buildRecordCitation(recordUpdatedIso: string | null): string {
  const iso =
    recordUpdatedIso && /^\d{4}-\d{2}-\d{2}$/.test(recordUpdatedIso.trim())
      ? recordUpdatedIso.trim()
      : new Date().toISOString().slice(0, 10);
  const lastUpdatedLong = formatRecordUpdated(iso);
  return `${CANONICAL_AUTHORS.join(", ")}. ${lastUpdatedLong}. Electronic publication. ${CANONICAL_PUBLISHER}. ${ATLAS_CITE_URL}`;
}

export function buildCitationBundle(recordUpdatedIso: string | null): {
  recordCitation: string;
  atlasAttribution: string;
} {
  return {
    recordCitation: buildRecordCitation(recordUpdatedIso),
    atlasAttribution: buildAtlasAttribution(),
  };
}
