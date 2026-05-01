/**
 * Split a "Further reading" blob into individual citations and build search URLs.
 * Each citation occupies exactly one paragraph in the source Word document.
 * The extractor joins paragraphs with "\n", so we split on newlines here.
 */

const SCHOLAR_BASE = "https://scholar.google.com/scholar?hl=en&q=";

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

/**
 * Split the further-reading blob into one entry per citation.
 * Citations are separated by newlines (one Word paragraph = one citation).
 * normStart / normEnd are offsets into normalizeFurtherReadingWhitespace(blob)
 * so that sliceRichSegmentsByPlainRange works for rich-text rendering.
 */
export function splitFurtherReadingIndexed(blob: string): FurtherReadingIndexedPart[] {
  const trimmed = blob.trim();
  if (!trimmed) return [];

  const fullNorm = normalizeFurtherReadingWhitespace(trimmed);
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

  const result: FurtherReadingIndexedPart[] = [];
  let cursor = 0; // current offset in fullNorm

  for (const line of lines) {
    const lineNorm = normalizeFurtherReadingWhitespace(line);
    if (!lineNorm) continue;

    // Find this line's position in the full normalized string.
    const pos = fullNorm.indexOf(lineNorm, cursor);
    const normStart = pos >= 0 ? pos : cursor;
    const normEnd = normStart + lineNorm.length;

    const base = lineNorm.replace(/,\s*$/, "").trim();
    if (!base) {
      cursor = normEnd + 1;
      continue;
    }
    const needsTrailingPeriod = !/\.\s*$/.test(base);
    const citation = needsTrailingPeriod ? `${base}.` : base;

    result.push({ normStart, normEnd, citation, needsTrailingPeriod });
    cursor = normEnd + 1; // +1 for the space that replaced the \n
  }

  return result;
}

export function splitFurtherReadingCitations(text: string): string[] {
  return splitFurtherReadingIndexed(text).map((p) => p.citation);
}

export function citationToScholarSearchUrl(citation: string): string {
  const q = citation.replace(/\s+/g, " ").trim();
  return SCHOLAR_BASE + encodeURIComponent(q);
}
