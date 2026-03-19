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
 */
const SPLIT_BEFORE_NEW_CITATION =
  /\.(?:\s+)(?=[A-Z][a-zA-ZÀ-ÿ\-]+ [A-Z],|[A-Z][a-zA-ZÀ-ÿ\-]+ & [A-Z][a-zA-ZÀ-ÿ\-]+|[A-Z][A-Za-zÀ-ÿ\-]+(?:,\s+[A-Z][A-Za-zÀ-ÿ\-.]+)+\s*\([12]\d{3}\)|[A-Z]\.\s+[a-z])/g;

export function splitFurtherReadingCitations(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const parts: string[] = [];
  let start = 0;
  SPLIT_BEFORE_NEW_CITATION.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPLIT_BEFORE_NEW_CITATION.exec(normalized)) !== null) {
    const segment = normalized.slice(start, m.index + 1).trim();
    if (segment) parts.push(segment);
    start = m.index + m[0].length;
  }
  const tail = normalized.slice(start).trim();
  if (tail) parts.push(tail);

  return parts.map((s) => (/\.\s*$/.test(s) ? s.trim() : `${s.trim()}.`));
}

export function citationToScholarSearchUrl(citation: string): string {
  const q = citation.replace(/\s+/g, " ").trim();
  return SCHOLAR_BASE + encodeURIComponent(q);
}
