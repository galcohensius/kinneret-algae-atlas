/** Shared algae record shape (no Node.js — safe for client components). */
export type AlgaeRecord = {
  slug: string;
  title: string;
  scientificName: string;
  images: string[];
  imageCaptions: string[];
  morphology: string | null;
  ecology: string | null;
  notes: string | null;
  sections: Record<string, string>;
  sectionsRich: Record<string, { text: string; italic: boolean; bold: boolean }[]>;
  metadata: Record<string, unknown>;
};
