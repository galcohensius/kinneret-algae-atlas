export type AboutCollaborator = {
  id: string;
  name: string;
  paragraphs: string[];
  links: string[];
};

export type AboutData = {
  title: string;
  record_updated: string | null;
  sections: {
    our_vision: string[];
    how_to_use: string[];
    how_to_use_pending: boolean;
  };
  collaborators: AboutCollaborator[];
  metadata?: Record<string, unknown>;
};
