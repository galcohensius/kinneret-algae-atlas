import type { AlgaeRecord } from "./algae-types";

export const RECENTLY_UPDATED_MAX = 3;

/**
 * The latest update batch: every record carrying the newest recordUpdated
 * date, A-Z by scientific name, capped at `max`. Returns [] when fewer than
 * two distinct dates exist -- after a bulk refresh every record shares one
 * date and "recently updated" would be noise.
 */
export function selectRecentlyUpdated(
  records: AlgaeRecord[],
  max: number = RECENTLY_UPDATED_MAX
): AlgaeRecord[] {
  const dated = records.filter(
    (record): record is AlgaeRecord & { recordUpdated: string } =>
      Boolean(record.recordUpdated)
  );
  const distinctDates = new Set(dated.map((record) => record.recordUpdated));
  if (distinctDates.size < 2) {
    return [];
  }
  const newestDate = [...distinctDates].sort().at(-1);
  return dated
    .filter((record) => record.recordUpdated === newestDate)
    .sort((a, b) => a.scientificName.localeCompare(b.scientificName))
    .slice(0, max);
}
