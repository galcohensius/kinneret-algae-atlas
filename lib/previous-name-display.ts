import { splitTaxonAndAuthority } from "./taxon-display";

export type PreviousNameDisplay = {
  primaryTaxon: string;
  primaryAuthority: string | null;
  /** Trailing synonym history, e.g. "(Previously referred to as …)". */
  secondary: string | null;
};

const PREVIOUSLY_REFERRED_RE = /\s*\(Previously referred to as\s+/i;

/**
 * Split a "Previous name used" field into a primary taxon line and optional
 * secondary synonym note (Word often appends both in one field).
 */
export function splitPreviousNameForDisplay(plain: string): PreviousNameDisplay {
  const trimmed = plain.trim();
  if (!trimmed) {
    return { primaryTaxon: "", primaryAuthority: null, secondary: null };
  }

  const match = PREVIOUSLY_REFERRED_RE.exec(trimmed);
  if (match && match.index !== undefined) {
    const head = trimmed.slice(0, match.index).trim();
    let tail = trimmed.slice(match.index + match[0].length).trim();
    if (tail.endsWith(")")) {
      tail = tail.slice(0, -1).trim();
    }
    const { taxon, authority } = splitTaxonAndAuthority(head);
    const secondary =
      tail.length > 0 ? `(Previously referred to as ${tail})` : null;
    return {
      primaryTaxon: taxon,
      primaryAuthority: authority,
      secondary,
    };
  }

  const { taxon, authority } = splitTaxonAndAuthority(trimmed);
  return {
    primaryTaxon: taxon,
    primaryAuthority: authority,
    secondary: null,
  };
}
