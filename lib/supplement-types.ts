import type { RichSegment } from "./algae-types";

export type SupplementRecord = {
  id: string;
  slug: string;
  title: string;
  /** Index heading for supplements not tied to species (e.g. book-chapter pre-prints). */
  group: string | null;
  /** Public path of a supplement shipped as a file (a PDF); such a supplement has no page. */
  file: string | null;
  /** Slugs of the species pages that reference this supplement. */
  linkedTaxa: string[];
  sections: Record<string, string>;
  sectionsRich: Record<string, RichSegment[]>;
  images: string[];
  imageCaptions: string[];
  imageCaptionsRich: RichSegment[][];
  metadata: Record<string, unknown>;
};
