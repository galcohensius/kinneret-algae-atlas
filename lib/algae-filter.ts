/** Client-safe filter (no Node deps). Same rules as server-side search. */
export function filterAlgaeByQuery<
  T extends {
    title: string;
    scientificName: string;
    nameAuthority?: string | null;
    sections?: Record<string, string>;
  }
>(records: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return records;
  }
  return records.filter((record) => {
    const haystack = [
      record.title,
      record.scientificName,
      record.nameAuthority ?? "",
      record.sections?.previous_name_used ?? "",
      record.sections?.phylum ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
