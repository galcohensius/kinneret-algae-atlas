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

  const record = {
    taxon: "Aulacoseira granulata",
    url: "https://kinneret-algae-atlas.org/algae/aulacoseira-granulata/",
  };

  it("cites a record by authors, taxon, date, publisher and its own page", () => {
    expect(buildRecordCitation("2026-09-01", undefined, record)).toBe(
      "Zohary T, Alster A. Aulacoseira granulata. 1 September 2026. Electronic publication. " +
        "Israel Oceanographic & Limnological Research. " +
        "https://kinneret-algae-atlas.org/algae/aulacoseira-granulata/"
    );
  });

  it("does not double the period after a taxon ending in sp.", () => {
    expect(
      buildRecordCitation("2026-09-01", undefined, { ...record, taxon: "Koinonema sp." })
    ).toContain("Koinonema sp. 1 September 2026.");
  });

  it("cites the atlas itself when no record is given", () => {
    expect(buildRecordCitation("2026-06-10")).toBe(
      "Zohary T, Alster A. 10 June 2026. Atlas of Kinneret microalgae. Electronic publication. " +
        "Israel Oceanographic & Limnological Research. https://kinneret-algae-atlas.org/"
    );
  });

  it("cites a record's own authors when it has them", () => {
    expect(
      buildRecordCitation("2026-06-10", ["Ruth Kaplan-Levy", "Tamar Zohary"], record)
    ).toMatch(/^Ruth Kaplan-Levy, Tamar Zohary\. Aulacoseira granulata\. 10 June 2026\. /);
  });

  it("returns both citation layers in one bundle", () => {
    const bundle = buildCitationBundle("2026-06-10");
    expect(bundle.recordCitation).toContain("10 June 2026");
    expect(bundle.atlasAttribution).toContain("Kinneret Limnological Institute");
  });
});
