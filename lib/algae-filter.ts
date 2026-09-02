import { PHYLUM_POPULAR_NAMES, phylumToSlug } from "./phylum-catalog";

/** Bibliography text adds noise; everything else on a record is searchable. */
const EXCLUDED_SECTION_KEYS = new Set(["further_reading"]);

export type SearchableAlgaeRecord = {
  title?: string;
  scientificName?: string;
  nameAuthority?: string | null;
  sections?: Record<string, string>;
  /** When set (home index), search skips rebuilding from full section text. */
  searchHaystack?: string;
};

/** Plain-text tokens indexed by {@link filterAlgaeByQuery} (client- and server-safe). */
export function buildAlgaeSearchHaystack(record: SearchableAlgaeRecord): string {
  const parts = [record.title ?? "", record.scientificName ?? "", record.nameAuthority ?? ""];

  if (record.sections) {
    for (const [key, value] of Object.entries(record.sections)) {
      if (EXCLUDED_SECTION_KEYS.has(key)) continue;
      const trimmed = value.trim();
      if (trimmed) parts.push(trimmed);
    }

    const phylum = record.sections.phylum ?? "";
    const popular = PHYLUM_POPULAR_NAMES[phylumToSlug(phylum)];
    if (popular) parts.push(popular);
  }

  return parts.join(" ").toLowerCase();
}

function haystackFor(record: SearchableAlgaeRecord): string {
  return record.searchHaystack ?? buildAlgaeSearchHaystack(record);
}

/** Client-safe filter (no Node deps). Same rules as server-side search. */
export function filterAlgaeByQuery<T extends SearchableAlgaeRecord>(
  records: T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return records;
  }
  return records.filter((record) => haystackFor(record).includes(normalizedQuery));
}
