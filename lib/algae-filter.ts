import { phylumPopularName } from "./phylum-catalog";

/**
 * Only the record's own names are indexed: its title (taxon + authority), the
 * previous name used, and its phylum (formal and popular). Descriptive sections
 * are left out on purpose -- they mention other taxa (e.g. a green alga compared
 * to "the dinoflagellates"), which would surface as false matches.
 */
export type SearchableAlgaeRecord = {
  title?: string;
  scientificName?: string;
  nameAuthority?: string | null;
  sections?: Record<string, string>;
};

/** Plain-text tokens written to the search index (client- and server-safe). */
export function buildAlgaeSearchHaystack(record: SearchableAlgaeRecord): string {
  const phylum = record.sections?.phylum ?? "";
  const parts = [
    record.title ?? "",
    record.scientificName ?? "",
    record.nameAuthority ?? "",
    record.sections?.previous_name_used ?? "",
    phylum,
    phylumPopularName(phylum) ?? "",
  ];
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
