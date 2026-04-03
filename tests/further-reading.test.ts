import { describe, expect, it } from "vitest";
import { citationToScholarSearchUrl, splitFurtherReadingCitations } from "../lib/further-reading";

describe("splitFurtherReadingCitations", () => {
  it("keeps a single citation as one item", () => {
    const one =
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino province, Italy. Journal of Limnology. 66(2):107-41.";
    expect(splitFurtherReadingCitations(one)).toHaveLength(1);
  });

  it("splits Peridiniopsis-style multiple papers", () => {
    const text =
      "Berman-Frank I, Zohary T, Erez J, Dubinsky Z (1994) CO2 availability. Limnol Oceanogr 39:1822-1834. Pollingher U, Hickel B (1991) Dinoflagellate associations. Arch Hydrobiol 120:267-285. Zohary T, Erez J, Gophen M, Berman-Frank I, Stiller M (1994) Seasonality. Limnol Oceanogr 39:1030-1043. P. gatunense and other dinoflagellates: Pollingher 1985, 1988.";
    const parts = splitFurtherReadingCitations(text);
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[0]).toContain("Berman-Frank");
    expect(parts[1]).toContain("Pollingher U, Hickel B (1991)");
  });

  it("splits Diplopsalis-style two blocks", () => {
    const text =
      "Moestrup, Ø. & Calado, A.J. (2018). Süßwasserflora. Berlin: Springer Spektrum. Pollingher & Hickel 1991. Pollingher U, Hickel B. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Archiv für Hydrobiologie 120(3):267-85.";
    const parts = splitFurtherReadingCitations(text);
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[parts.length - 1]).toContain("Pollingher U, Hickel B");
  });

  it("splits after surname + initial. + year (European / monograph style)", () => {
    const text =
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino Province, Italy. J Limnol. 66:107-141. Penard E. 1891. Les Peridiniacees du Lac Leman. Bull. Trav. Soc. Bot. Geneve 6: 1-63. Pollingher U, Hickel B. 1991. Dinoflagellate associations.";
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain("Hansen G");
    expect(parts[0]).toContain("107-141");
    expect(parts[0]).not.toContain("Penard");
    expect(parts[1]).toMatch(/^Penard E\. 1891/);
    expect(parts[2]).toContain("Pollingher U");
  });

  it("does not split journal abbreviations like J. Limnol. inside one citation", () => {
    const one =
      "Hansen G, Flaim G. 2007. Title here. J. Limnol. 66(2):107-141.";
    expect(splitFurtherReadingCitations(one)).toHaveLength(1);
  });
});

describe("citationToScholarSearchUrl", () => {
  it("encodes query for Google Scholar", () => {
    const url = citationToScholarSearchUrl("Test Author (1999) Title here.");
    expect(url).toContain("scholar.google.com");
    expect(url).toContain(encodeURIComponent("Test Author (1999) Title here."));
  });
});
