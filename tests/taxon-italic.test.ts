import { describe, expect, it } from "vitest";
import { splitTaxonForItalicDisplay } from "../lib/taxon-display";

describe("splitTaxonForItalicDisplay", () => {
  it("keeps var. upright between italic genus and epithet", () => {
    const parts = splitTaxonForItalicDisplay(
      "Peridiniopsis cunningtonii var. quinquecuspidata",
    );
    expect(parts).toEqual([
      { italic: true, text: "Peridiniopsis cunningtonii " },
      { italic: false, text: "var." },
      { italic: true, text: " quinquecuspidata" },
    ]);
  });

  it("keeps subsp. and f. upright", () => {
    expect(splitTaxonForItalicDisplay("Genus epithet subsp. other")).toEqual([
      { italic: true, text: "Genus epithet " },
      { italic: false, text: "subsp." },
      { italic: true, text: " other" },
    ]);
    expect(splitTaxonForItalicDisplay("Genus epithet f. forma")).toEqual([
      { italic: true, text: "Genus epithet " },
      { italic: false, text: "f." },
      { italic: true, text: " forma" },
    ]);
  });

  it("keeps sp. and spp. upright", () => {
    expect(splitTaxonForItalicDisplay("Gymnodinium sp.")).toEqual([
      { italic: true, text: "Gymnodinium " },
      { italic: false, text: "sp." },
    ]);
    expect(splitTaxonForItalicDisplay("Gymnodinium spp.")).toEqual([
      { italic: true, text: "Gymnodinium " },
      { italic: false, text: "spp." },
    ]);
  });

  it("returns one italic span when no rank abbreviations", () => {
    expect(splitTaxonForItalicDisplay("Ceratium hirundinella")).toEqual([
      { italic: true, text: "Ceratium hirundinella" },
    ]);
  });
});
