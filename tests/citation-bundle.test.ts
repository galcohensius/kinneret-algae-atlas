import { describe, expect, it } from "vitest";
import {
  buildAtlasAttribution,
  buildCitationBundle,
  buildRecordCitation,
  CANONICAL_AUTHORS,
} from "../lib/cite-this-record";

describe("citation bundle", () => {
  it("emits canonical attribution with Dr. titles", () => {
    const attribution = buildAtlasAttribution();
    expect(attribution).toContain(CANONICAL_AUTHORS[0]);
    expect(attribution).toContain(CANONICAL_AUTHORS[1]);
  });

  it("builds per-record citation with publisher and atlas URL", () => {
    const citation = buildRecordCitation("2026-06-10");
    expect(citation).toContain("10 June 2026");
    expect(citation).toContain("Electronic publication.");
    expect(citation).toContain("https://kinneret-algae-atlas.org/");
  });

  it("cites a record's own authors when it has them, the atlas authors otherwise", () => {
    expect(buildRecordCitation("2026-06-10")).toMatch(/^Dr\. Tamar Zohary, Dr\. Alla Alster\. /);
    expect(buildRecordCitation("2026-06-10", ["Ruth Kaplan-Levy", "Tamar Zohary"])).toMatch(
      /^Ruth Kaplan-Levy, Tamar Zohary\. 10 June 2026\. /
    );
  });

  it("returns both citation layers in one bundle", () => {
    const bundle = buildCitationBundle("2026-06-10");
    expect(bundle.recordCitation).toContain("10 June 2026");
    expect(bundle.atlasAttribution).toContain("Kinneret Limnological Institute");
  });
});
