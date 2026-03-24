/** Shared algae record shape (no Node.js — safe for client components). */
export type AlgaeRecord = {
  slug: string;
  /** Full citation line (taxon + authority), for alt text and search. */
  title: string;
  /** Taxon name only (typically italic in print): genus, epithet, optional infraspecific. */
  scientificName: string;
  /** Authority and year tail after the taxon, when present. */
  nameAuthority: string | null;
  images: string[];
  imageCaptions: string[];
  morphology: string | null;
  ecology: string | null;
  notes: string | null;
  sections: Record<string, string>;
  sectionsRich: Record<string, { text: string; italic: boolean; bold: boolean }[]>;
  metadata: Record<string, unknown>;
};
