/**
 * Split a "Further reading" blob into individual citations and build search URLs.
 * Citations in the source are often separated by ". " before a new author block.
 * Some atlas entries use semicolon-like runs without periods: section labels with colons,
 * comma-separated author–year refs, "YYYY P. species …" topic breaks, and "Author 1981, 1986".
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

/** Surname token, including hyphenated (e.g. Berman-Frank, Viner-Mozzini). */
const SURNAME = String.raw`[A-Z][a-zA-ZÀ-ÿ\-]+(?:-[A-Z][a-zA-ZÀ-ÿ\-]+)*`;
/** "Author", "A & B", or "Author et al" (optional period on al.) before a 4-digit year. */
const AUTHOR_BEFORE_YEAR = String.raw`(?:${SURNAME})(?:\s+&\s+${SURNAME}|\s+et\s+al\.?)?\s+[12]\d{3}\b`;

/**
 * Extra breaks for Word-style lists without ". " between references:
 * - "…2014 Morphology & systematics: …"
 * - "…1994 P. gatunense life cycle: …"
 * - "…261, Pollingher & Hickel 1988 …"
 * - "…1981, 1986, Zohary 2004 …" (year–year then author)
 * - "…systematics: Pollingher …" (colon after letter; avoid "120:267" volume:page)
 */
const EXTRA_SPLIT_REGEXES: RegExp[] = [
  /(?<=\b[12]\d{3})\s+(?=Morphology\s*&)/g,
  /(?<=\b[12]\d{3})\s+(?=P\.\s+gatunense\b)/g,
  new RegExp(String.raw`,\s+(?=${AUTHOR_BEFORE_YEAR})`, "g"),
  /(?<=\b[12]\d{3}),\s+(?=\d{4}\b)/g,
  new RegExp(
    String.raw`(?<![\d(])(?<!Lake Kinneret):\s+(?=${AUTHOR_BEFORE_YEAR})`,
    "g"
  ),
  /,\s+(?=P\.\s+[a-z])/g,
];

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
  const base = normalized.slice(tstart, tend).replace(/,\s*$/, "").trim();
  if (!base) return;
  const needsTrailingPeriod = !/\.\s*$/.test(base);
  const citation = needsTrailingPeriod ? `${base.trim()}.` : base.trim();
  items.push({ normStart: tstart, normEnd: tend, citation, needsTrailingPeriod });
}

function collectSegmentStartIndices(normalized: string): number[] {
  const starts = new Set<number>([0, normalized.length]);
  const addMatchEnds = (re: RegExp) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized)) !== null) {
      starts.add(m.index + m[0].length);
    }
  };
  addMatchEnds(SPLIT_BEFORE_NEW_CITATION);
  for (const re of EXTRA_SPLIT_REGEXES) {
    addMatchEnds(re);
  }
  return [...starts].filter((n) => n <= normalized.length).sort((a, b) => a - b);
}

/** Author line before the trailing publication year (for "Author 1981, 1986" style lists). */
function extractAuthorPrefixBeforeLastYear(citation: string): string | null {
  let t = citation.replace(/\.\s*$/, "").trim();
  t = t.replace(/\s+p\s+\d+\s*$/i, "").trim();
  const m = t.match(/^(.+?\S)\s+([12]\d{3})\s*$/);
  return m ? m[1].trim() : null;
}

function isYearOnlyFragment(citation: string): boolean {
  const t = citation.replace(/\.\s*$/, "").replace(/,\s*$/, "").trim();
  return /^([12]\d{3})(?:,\s*[12]\d{3})*$/.test(t);
}

function yearsFromYearOnlyFragment(citation: string): string[] {
  return citation
    .replace(/\.\s*$/, "")
    .replace(/,\s*$/, "")
    .trim()
    .split(/,\s*/)
    .filter(Boolean);
}

function syntheticPart(citation: string): FurtherReadingIndexedPart {
  const trimmed = citation.replace(/\s+/g, " ").trim();
  const needsTrailingPeriod = !/\.\s*$/.test(trimmed);
  const text = needsTrailingPeriod ? `${trimmed}.` : trimmed;
  return { normStart: 0, normEnd: 0, citation: text, needsTrailingPeriod };
}

/**
 * "Pollingher 1985" + "1986, 1988" → keep first, add "Pollingher 1986.", "Pollingher 1988."
 */
function mergeYearOnlyFragments(parts: FurtherReadingIndexedPart[]): FurtherReadingIndexedPart[] {
  const out: FurtherReadingIndexedPart[] = [];
  for (const item of parts) {
    if (isYearOnlyFragment(item.citation) && out.length > 0) {
      const prefix = extractAuthorPrefixBeforeLastYear(out[out.length - 1]!.citation);
      if (prefix) {
        for (const y of yearsFromYearOnlyFragment(item.citation)) {
          out.push(syntheticPart(`${prefix} ${y}`));
        }
        continue;
      }
    }
    out.push(item);
  }
  return out;
}

export function splitFurtherReadingIndexed(blob: string): FurtherReadingIndexedPart[] {
  const normalized = normalizeFurtherReadingWhitespace(blob);
  if (!normalized) return [];

  const starts = collectSegmentStartIndices(normalized);
  const raw: FurtherReadingIndexedPart[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const a = starts[i]!;
    const b = starts[i + 1]!;
    if (a < b) {
      appendFurtherReadingPart(raw, normalized, a, b);
    }
  }

  const merged = mergeYearOnlyFragments(raw);
  return merged.filter((p) => !isOrphanSectionLabel(p.citation));
}

/** Topic-only fragment left between splits (not a useful Scholar query). */
function isOrphanSectionLabel(citation: string): boolean {
  const t = citation.replace(/\.\s*$/, "").trim();
  if (/\b[12]\d{3}\b/.test(t)) return false;
  if (/\bet\s+al\.?\b/i.test(t)) return false;
  return /^[A-Za-z][^:]{0,120}:\s*$/.test(t);
}

export function splitFurtherReadingCitations(text: string): string[] {
  return splitFurtherReadingIndexed(text).map((p) => p.citation);
}

export function citationToScholarSearchUrl(citation: string): string {
  const q = citation.replace(/\s+/g, " ").trim();
  return SCHOLAR_BASE + encodeURIComponent(q);
}
