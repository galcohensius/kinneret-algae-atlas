/** Inline styling from Word runs (figure captions, sections, further reading). */
export type RichSegment = {
  text: string;
  italic: boolean;
  bold: boolean;
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
  /** Optional file under `public/algae-images/{slug}/thumbnail-1.png` (etc.). */
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
};
