import { buildAlgaeSearchHaystack } from "./algae-filter";
import type { AlgaeRecord } from "./algae-types";

export type AlgaeSearchIndexEntry = {
  slug: string;
  searchHaystack: string;
};

export type AlgaeSearchIndexFile = {
  count: number;
  entries: AlgaeSearchIndexEntry[];
};

export function buildAlgaeSearchIndex(records: AlgaeRecord[]): AlgaeSearchIndexEntry[] {
  return records.map((record) => ({
    slug: record.slug,
    searchHaystack: buildAlgaeSearchHaystack(record),
  }));
}

export function filterCatalogBySearchIndex<T extends { slug: string }>(
  records: T[],
  searchIndex: Map<string, string>,
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return records;
  }
  return records.filter((record) =>
    (searchIndex.get(record.slug) ?? "").includes(normalizedQuery)
  );
}
