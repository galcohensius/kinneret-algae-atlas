import type { RichSegment } from "./algae-types";

export type AboutCollaborator = {
  id: string;
  name: string;
  paragraphs: RichSegment[][];
  links: string[];
};

/** A paragraph (Word runs), or a sub-heading (a fully bold Word paragraph). */
export type AboutBlock = RichSegment[] | { heading: string };

export type AboutData = {
  title: string;
  record_updated: string | null;
  sections: {
    study_area: RichSegment[][];
    our_vision: RichSegment[][];
    information: AboutBlock[];
    references: string[];
  };
  collaborators: AboutCollaborator[];
  metadata?: Record<string, unknown>;
};
