/**
 * Split a "Further reading" blob into individual citations and build search URLs.
 * Citations in the source are often separated by ". " before a new author block.
 */

const SCHOLAR_BASE = "https://scholar.google.com/scholar?hl=en&q=";

/**
 * Split before a new reference. Heuristics tuned to limnology-style strings:
 * - "…1834. Pollingher U, Hickel B (1991) …"
 * - "…285. Zohary T, Erez J …"
 * - "…1043. P. gatunense and …"
 * - "…Spektrum. Pollingher & Hickel 1991. …"
 * - "…Author A, Author B (1994) …" at line start after period
 * - "…141. Penard E. 1891 …" / "…141. Penard, E. 1891 …" (surname + optional comma + initial. + 4-digit year)
 *   Surname must be ≥2 letters so "J. Limnol." is not treated as a new paper.
 */
const SPLIT_BEFORE_NEW_CITATION =
  /\.(?:\s+)(?=[A-Z][a-zA-ZÀ-ÿ\-]+ [A-Z],|[A-Z][a-zA-ZÀ-ÿ\-]+ & [A-Z][a-zA-ZÀ-ÿ\-]+|[A-Z][A-Za-zÀ-ÿ\-]+(?:,\s+[A-Z][A-Za-zÀ-ÿ\-.]+)+\s*\([12]\d{3}\)|[A-Z]\.\s+[a-z]|[A-Z][a-zA-ZÀ-ÿ\-]+,?\s+[A-Z]\.\s+[12]\d{3}\b)/g;

export function normalizeFurtherReadingWhitespace(blob: string): string {
  return blob.replace(/\s+/g, " ").trim();
}

export type FurtherReadingIndexedPart = {
  normStart: number;
  normEnd: number;
  citation: string;
  /** When true, the site appends a final "." after the normalized slice (Scholar URL includes it). */
  needsTrailingPeriod: boolean;
};

function appendFurtherReadingPart(
  items: FurtherReadingIndexedPart[],
  normalized: string,
  start: number,
  end: number
): void {
  const slice = normalized.slice(start, end);
  const tstart = start + (slice.length - slice.trimStart().length);
  const tend = start + slice.trimEnd().length;
  if (tstart >= tend) return;
  const base = normalized.slice(tstart, tend);
  const needsTrailingPeriod = !/\.\s*$/.test(base);
  const citation = needsTrailingPeriod ? `${base.trim()}.` : base.trim();
  items.push({ normStart: tstart, normEnd: tend, citation, needsTrailingPeriod });
}

export function splitFurtherReadingIndexed(blob: string): FurtherReadingIndexedPart[] {
  const normalized = normalizeFurtherReadingWhitespace(blob);
  if (!normalized) return [];

  const items: FurtherReadingIndexedPart[] = [];
  let start = 0;
  SPLIT_BEFORE_NEW_CITATION.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPLIT_BEFORE_NEW_CITATION.exec(normalized)) !== null) {
    appendFurtherReadingPart(items, normalized, start, m.index + 1);
    start = m.index + m[0].length;
  }
  appendFurtherReadingPart(items, normalized, start, normalized.length);
  return items;
}

export function splitFurtherReadingCitations(text: string): string[] {
  return splitFurtherReadingIndexed(text).map((p) => p.citation);
}

export function citationToScholarSearchUrl(citation: string): string {
  const q = citation.replace(/\s+/g, " ").trim();
  return SCHOLAR_BASE + encodeURIComponent(q);
}
