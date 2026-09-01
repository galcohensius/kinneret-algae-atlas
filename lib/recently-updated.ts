import type { AlgaeRecord } from "./algae-types";

export const RECENTLY_UPDATED_COUNT = 4;

/**
 * Newest records by recordUpdated (ties break A-Z by scientific name).
 * Returns [] when fewer than two distinct dates exist -- right after a
 * first extraction every record shares one date and the strip is noise.
 */
export function selectRecentlyUpdated(
  records: AlgaeRecord[],
  count: number = RECENTLY_UPDATED_COUNT
): AlgaeRecord[] {
  const dated = records.filter(
    (record): record is AlgaeRecord & { recordUpdated: string } =>
      Boolean(record.recordUpdated)
  );
  const distinctDates = new Set(dated.map((record) => record.recordUpdated));
  if (distinctDates.size < 2) {
    return [];
  }
  return [...dated]
    .sort((a, b) =>
      a.recordUpdated === b.recordUpdated
        ? a.scientificName.localeCompare(b.scientificName)
        : b.recordUpdated.localeCompare(a.recordUpdated)
    )
    .slice(0, count);
}
