export type GlossaryEntry = {
  term: string;
  slug: string;
  definition: string;
  letter: string;
  match_phrases: string[];
};

export type GlossaryData = {
  title: string;
  record_updated: string;
  source_file?: string;
  plates?: GlossaryPlate[];
  entries: GlossaryEntry[];
};

export type GlossaryPlate = {
  id: string;
  label: string;
  src: string;
};

export type GlossaryMatchPhrase = {
  phrase: string;
  slug: string;
  term: string;
  definition: string;
};

export type GlossaryTextPart =
  | { type: "text"; text: string }
  | {
      type: "term";
      text: string;
      slug: string;
      term: string;
      definition: string;
    };
