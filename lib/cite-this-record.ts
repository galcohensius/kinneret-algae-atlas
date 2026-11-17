import { absoluteUrl } from "./site";

/** Canonical atlas URL for “how to cite” (HTTPS). */
export const ATLAS_CITE_URL = absoluteUrl("/");
export const ATLAS_CITE_TITLE = "Atlas of Kinneret microalgae";
export const CANONICAL_AUTHORS = ["Dr. Tamar Zohary", "Dr. Alla Alster"] as const;
/** The atlas authors as written in a citation (surname, initial). */
export const CITATION_AUTHORS = ["Zohary T", "Alster A"] as const;
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

/** The page a citation points at: a record's taxon name (as titled, no authority) and its own URL. */
export type CitedRecord = { taxon: string; url: string };

export type CitationParts = {
  /** Text before the italic taxon name; the whole citation when there is no taxon. */
  lead: string;
  taxon: string | null;
  tail: string;
};

/**
 * With `record`: `Authors. Taxon. Date. Electronic publication. Publisher. Record URL`.
 * Without: the atlas itself, `Authors. Date. Atlas title. Electronic publication. Publisher. Atlas URL`.
 * `authors`: the record's own authors when its Word file names some; the atlas authors otherwise.
 */
export function buildCitationParts(
  recordUpdatedIso: string | null,
  authors: readonly string[] = CITATION_AUTHORS,
  record?: CitedRecord
): CitationParts {
  const iso =
    recordUpdatedIso && /^\d{4}-\d{2}-\d{2}$/.test(recordUpdatedIso.trim())
      ? recordUpdatedIso.trim()
      : new Date().toISOString().slice(0, 10);
  const lastUpdatedLong = formatRecordUpdated(iso);
  const cited = `${authors.join(", ")}.`;
  if (!record) {
    return {
      lead: `${cited} ${lastUpdatedLong}. ${ATLAS_CITE_TITLE}. Electronic publication. ${CANONICAL_PUBLISHER}. ${ATLAS_CITE_URL}`,
      taxon: null,
      tail: "",
    };
  }
  return {
    lead: `${cited} `,
    taxon: record.taxon,
    // A taxon ending in "sp." already carries the sentence's period.
    tail: `${record.taxon.endsWith(".") ? "" : "."} ${lastUpdatedLong}. Electronic publication. ${CANONICAL_PUBLISHER}. ${record.url}`,
  };
}

export function buildRecordCitation(
  recordUpdatedIso: string | null,
  authors?: readonly string[],
  record?: CitedRecord
): string {
  const { lead, taxon, tail } = buildCitationParts(recordUpdatedIso, authors, record);
  return `${lead}${taxon ?? ""}${tail}`;
}

export function buildCitationBundle(
  recordUpdatedIso: string | null,
  authors?: readonly string[],
  record?: CitedRecord
): {
  recordCitation: string;
  atlasAttribution: string;
} {
  return {
    recordCitation: buildRecordCitation(recordUpdatedIso, authors, record),
    atlasAttribution: buildAtlasAttribution(),
  };
}
