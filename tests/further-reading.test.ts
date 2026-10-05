import { describe, expect, it } from "vitest";
import {
  citationToScholarSearchUrl,
  splitFurtherReadingIndexed,
} from "../lib/further-reading";
import { collapseRichSegmentsWhitespace, sliceRichSegmentsByPlainRange } from "../lib/rich-segments";

/** Join lines with \n as the extractor produces (one paragraph = one citation). */
function fr(...lines: string[]): string {
  return lines.join("\n");
}

function citations(text: string): string[] {
  return splitFurtherReadingIndexed(text).map((part) => part.citation);
}

describe("further-reading citation split", () => {
  it("a colon inside a citation ('Berlin: Springer Spektrum') does not split it", () => {
    const text = fr(
      "Moestrup Ø, Calado AJ. 2018. Süßwasserflora von Mitteleuropa. Dinophyceae. Vol. 6 pp. [i]-xii, [1]-560, 421 figures. Berlin: Springer Spektrum.",
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Archiv für Hydrobiologie 120(3):267-85."
    );
    const parts = citations(text);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("Moestrup");
    expect(parts[0]).toContain("Berlin: Springer Spektrum");
    expect(parts[1]).toContain("Pollingher U");
  });

  it("'Jena & Stuttgart: Gustav Fischer' stays inside the last of four citations", () => {
    const text = fr(
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino Province, Italy. J Limnol. 66:107-141.",
      "Penard E. 1891. Les Peridiniacees du Lac Leman. Bull. Trav. Soc. Bot. Geneve 6: 1-63.",
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch. Hydrobiol. 120: 267-285.",
      "Popovsky, J. & Pfiester, L.A. 1990. Süßwasserflora von Mitteleuropa. Dinophyceae (Dinoflagellida). Vol. 6 pp. 1-272. Jena & Stuttgart: Gustav Fischer."
    );
    const parts = citations(text);
    expect(parts).toHaveLength(4);
    expect(parts[0]).toContain("Hansen G");
    expect(parts[1]).toContain("Penard E");
    expect(parts[2]).toContain("Pollingher U");
    expect(parts[3]).toContain("Popovsky");
    expect(parts[3]).toContain("Jena & Stuttgart: Gustav Fischer");
  });

  it("trailing period is added when missing", () => {
    const text = fr("Pollingher U, Hickel B. 1991. Some journal 120:267-285");
    const parts = citations(text);
    expect(parts[0]).toMatch(/285\.$/);
  });

  it("empty lines between citations are ignored", () => {
    const text = "Citation one.\n\n\nCitation two.";
    const parts = citations(text);
    expect(parts).toHaveLength(2);
  });
});

describe("further-reading rich slices (species page path)", () => {
  it("double spaces and run boundaries do not shift later citations", () => {
    const text = "Smith A.  2001. Title one.\nJones B. 2005. \nSome  Journal 12-34.";
    const segments = [
      { text: "Smith A.  2001. Title one.\nJones B. 2005. ", italic: false, bold: false },
      { text: "\nSome  Journal", italic: true, bold: false },
      { text: " 12-34.", italic: false, bold: false },
    ];
    const collapsed = collapseRichSegmentsWhitespace(segments);
    const slices = splitFurtherReadingIndexed(text).map((p) =>
      sliceRichSegmentsByPlainRange(collapsed, p.normStart, p.normEnd)
    );
    expect(slices.map((runs) => runs.map((r) => r.text).join(""))).toEqual([
      "Smith A. 2001. Title one.",
      "Jones B. 2005.",
      "Some Journal 12-34.",
    ]);
    expect(slices[2][0]).toMatchObject({ text: "Some Journal", italic: true });
  });
});

describe("citationToScholarSearchUrl", () => {
  it("encodes query for Google Scholar", () => {
    const url = citationToScholarSearchUrl("Test Author (1999) Title here.");
    expect(url).toContain("scholar.google.com");
    expect(url).toContain(encodeURIComponent("Test Author (1999) Title here."));
  });
});
