import { describe, expect, it } from "vitest";
import { buildGlossaryMatchPhrases, linkGlossaryInPlainText } from "../lib/glossary-link";
import type { GlossaryEntry } from "../lib/glossary-types";

const sampleEntries: GlossaryEntry[] = [
  {
    term: "Apex (plural: apices)",
    slug: "apex",
    definition: "tip of a cell",
    letter: "A",
    match_phrases: ["Apex", "apices"],
  },
  {
    term: "Apical axis",
    slug: "apical-axis",
    definition: "axis linking poles",
    letter: "A",
    match_phrases: ["Apical axis"],
  },
];

describe("linkGlossaryInPlainText", () => {
  const phrases = buildGlossaryMatchPhrases(sampleEntries);

  it("links a known term with word boundaries", () => {
    const parts = linkGlossaryInPlainText("The apex is visible.", phrases);
    expect(parts).toEqual([
      { type: "text", text: "The " },
      {
        type: "term",
        text: "apex",
        slug: "apex",
        term: "Apex (plural: apices)",
        definition: "tip of a cell",
      },
      { type: "text", text: " is visible." },
    ]);
  });

  it("prefers longer phrase match", () => {
    const parts = linkGlossaryInPlainText("Along the apical axis.", phrases);
    expect(parts.some((p) => p.type === "term" && p.text === "apical axis")).toBe(true);
  });

  it("does not link inside longer words", () => {
    const parts = linkGlossaryInPlainText("Not applicable here.", phrases);
    expect(parts.every((p) => p.type === "text")).toBe(true);
  });

  it("links plural surface forms for single-word terms", () => {
    const entries: GlossaryEntry[] = [
      {
        term: "Pyrenoid",
        slug: "pyrenoid",
        definition: "definition",
        letter: "P",
        match_phrases: ["Pyrenoid"],
      },
    ];
    const parts = linkGlossaryInPlainText(
      "A prominent pyrenoids in each cell.",
      buildGlossaryMatchPhrases(entries)
    );
    expect(parts.some((p) => p.type === "term" && p.text === "pyrenoids")).toBe(true);
  });

  it("links multi-word terms across segment boundaries when joined", () => {
    const entries: GlossaryEntry[] = [
      {
        term: "Eulittoral zone",
        slug: "eulittoral-zone",
        definition: "definition",
        letter: "E",
        match_phrases: ["Eulittoral zone"],
      },
    ];
    const phrases = buildGlossaryMatchPhrases(entries);
    const parts = linkGlossaryInPlainText("in the eulittoral zone of Lake", phrases);
    expect(parts.some((p) => p.type === "term" && p.text.toLowerCase() === "eulittoral zone")).toBe(
      true
    );
  });
});
