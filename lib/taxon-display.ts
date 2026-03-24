/**
 * Client-safe parsing of full taxon header lines (as stored in JSON `scientific_name`).
 */

const BINOMIAL_RE =
  /^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)/;

const GENUS_RE = /^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b/;

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
