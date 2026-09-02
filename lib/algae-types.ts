/** Inline styling from Word runs (figure captions, sections, further reading). */
export type RichSegment = {
  text: string;
  italic: boolean;
  bold: boolean;
  /** Word superscript run (e.g. an exponent); rendered as <sup>. */
  superscript?: boolean;
  /** Word subscript run (e.g. chemical formula index); rendered as <sub>. */
  subscript?: boolean;
  /** Optional link target (e.g. supplement document in /public). */
  href?: string;
};

/** Shared algae record shape (no Node.js — safe for client components). */
export type AlgaeRecord = {
  slug: string;
  /** Full citation line (taxon + authority), for alt text and search. */
  title: string;
  /** Taxon name only (typically italic in print): genus, epithet, optional infraspecific. */
  scientificName: string;
  /** Authority and year tail after the taxon, when present. */
  nameAuthority: string | null;
  /** Home index card preview only (`thumbnail-1.*` from JSON or `public/algae-images/{slug}/`). */
  thumbnailUrl: string | null;
  images: string[];
  imageCaptions: string[];
  /** Parallel to imageCaptions when extracted from Word with run styles. */
  imageCaptionsRich: RichSegment[][];
  morphology: string | null;
  ecology: string | null;
  notes: string | null;
  sections: Record<string, string>;
  sectionsRich: Record<string, RichSegment[]>;
  metadata: Record<string, unknown>;
  /** ISO YYYY-MM-DD: modified date of the record's source Word file (see metadata.record_updated). */
  recordUpdated: string | null;
};

/** Slim home-index card row (no search text — loaded on demand when the user focuses search). */
export type AlgaeCatalogRecord = {
  slug: string;
  scientificName: string;
  thumbnailUrl: string | null;
  sections: { phylum: string };
  recordUpdated: string | null;
};

/** @deprecated Use {@link AlgaeCatalogRecord} for the index; search haystacks live in search-index.json. */
export type AlgaeIndexRecord = AlgaeCatalogRecord & {
  searchHaystack: string;
};
