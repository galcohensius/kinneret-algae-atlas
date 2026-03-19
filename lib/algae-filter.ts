/** Client-safe filter (no Node deps). Same rules as server-side search. */
export function filterAlgaeByQuery<T extends { scientificName: string }>(
  records: T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return records;
  }
  return records.filter((record) => record.scientificName.toLowerCase().includes(normalizedQuery));
}
