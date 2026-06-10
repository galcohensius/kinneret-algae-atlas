import { buildGlossaryMatchPhrases } from "./glossary-link";
import type {
  GlossaryData,
  GlossaryEntry,
  GlossaryMatchPhrase,
  GlossaryPlate,
} from "./glossary-types";

export type { GlossaryData, GlossaryEntry, GlossaryMatchPhrase, GlossaryPlate };

export type GlossaryIndex = {
  data: GlossaryData;
  entriesBySlug: Map<string, GlossaryEntry>;
  matchPhrases: GlossaryMatchPhrase[];
  letters: string[];
};

function buildLetters(entries: GlossaryEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) {
    set.add(e.letter.toUpperCase());
  }
  return [...set].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });
}

export function buildGlossaryIndex(data: GlossaryData): GlossaryIndex {
  const entriesBySlug = new Map(data.entries.map((e) => [e.slug, e]));
  return {
    data,
    entriesBySlug,
    matchPhrases: buildGlossaryMatchPhrases(data.entries),
    letters: buildLetters(data.entries),
  };
}

/** Entries grouped by first letter for the glossary page. */
export function groupEntriesByLetter(
  entries: GlossaryEntry[]
): { letter: string; entries: GlossaryEntry[] }[] {
  const byLetter = new Map<string, GlossaryEntry[]>();
  for (const entry of entries) {
    const letter = entry.letter.toUpperCase();
    const list = byLetter.get(letter) ?? [];
    list.push(entry);
    byLetter.set(letter, list);
  }
  return [...byLetter.entries()]
    .sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    })
    .map(([letter, group]) => ({
      letter,
      entries: group.sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" })),
    }));
}
