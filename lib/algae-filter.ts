/** Client-safe filter (no Node deps). Same rules as server-side search. */
export function filterAlgaeByQuery<
  T extends { title: string; scientificName: string; nameAuthority?: string | null }
>(records: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return records;
  }
  return records.filter((record) => {
    const haystack = [record.title, record.scientificName, record.nameAuthority ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
