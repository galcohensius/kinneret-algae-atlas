export type AboutCollaborator = {
  id: string;
  name: string;
  paragraphs: string[];
  links: string[];
};

/** A paragraph, or a sub-heading (a fully bold Word paragraph). */
export type AboutBlock = string | { heading: string };

export type AboutData = {
  title: string;
  record_updated: string | null;
  sections: {
    our_vision: string[];
    how_to_use: AboutBlock[];
    references: string[];
  };
  collaborators: AboutCollaborator[];
  metadata?: Record<string, unknown>;
};
