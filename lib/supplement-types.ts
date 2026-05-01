import type { RichSegment } from "./algae-types";

export type SupplementRecord = {
  id: string;
  slug: string;
  title: string;
  /** Slugs of the species pages that reference this supplement. */
  linkedTaxa: string[];
  sections: Record<string, string>;
  sectionsRich: Record<string, RichSegment[]>;
  images: string[];
  imageCaptions: string[];
  imageCaptionsRich: RichSegment[][];
  metadata: Record<string, unknown>;
};
