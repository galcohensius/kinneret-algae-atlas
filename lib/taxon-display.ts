/**
 * Client-safe parsing of full taxon header lines (as stored in JSON `scientific_name`).
 */

const BINOMIAL_RE =
  /^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)/;

const GENUS_RE = /^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b/;

/** Rank / species placeholder abbreviations set upright (not italic) inside taxon lines (ICN-style). */
const TAXON_RANK_UPRIGHT_RE = /\b(subsp\.|var\.|f\.|spp\.|sp\.)(?=\s|$)/gi;

/**
 * Split a scientific name (taxon line only) into italic vs upright segments so
 * rank abbreviations (e.g. `var.`, `subsp.`) stay roman.
 */
export function splitTaxonForItalicDisplay(taxon: string): { italic: boolean; text: string }[] {
  const s = taxon;
  if (!s) {
    return [];
  }

  const segments: { italic: boolean; text: string }[] = [];
  let lastIndex = 0;
  const re = new RegExp(TAXON_RANK_UPRIGHT_RE.source, TAXON_RANK_UPRIGHT_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ italic: true, text: s.slice(lastIndex, m.index) });
    }
    segments.push({ italic: false, text: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < s.length) {
    segments.push({ italic: true, text: s.slice(lastIndex) });
  }
  if (segments.length === 0) {
    return [{ italic: true, text: s }];
  }
  return segments;
}

/** Italic-style name (genus [+ epithet + optional rank]) vs taxonomic authority / year tail. */
export function splitTaxonAndAuthority(fullHeader: string): {
  taxon: string;
  authority: string | null;
} {
  const s = fullHeader.trim();
  if (!s) {
    return { taxon: "", authority: null };
  }

  const binomial = BINOMIAL_RE.exec(s);
  if (binomial) {
    const taxon = binomial[1]!.trim();
    const rest = s.slice(binomial[0].length).trim();
    return { taxon, authority: rest.length > 0 ? rest : null };
  }

  const genus = GENUS_RE.exec(s);
  if (genus) {
    const taxon = genus[1]!.trim();
    const rest = s.slice(genus[0].length).trim();
    return { taxon, authority: rest.length > 0 ? rest : null };
  }

  return { taxon: s, authority: null };
}

/** Epithet / genus-only string for URL slugs and image folder names. */
export function taxonNameForSlug(fullHeader: string): string {
  return splitTaxonAndAuthority(fullHeader).taxon;
}
