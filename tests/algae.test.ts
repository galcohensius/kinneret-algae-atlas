import { describe, expect, it } from "vitest";
import { normalizeAlgaeRecords, type RawAlgaeRecord } from "../lib/algae";

describe("normalizeAlgaeRecords", () => {
  it("adds fallback name when scientific name is missing", () => {
    const input = [
      { scientific_name: null, sections: { notes: "x" }, metadata: {} }
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].scientificName).toBe("unnamed-algae-1");
    expect(result[0].slug).toBe("unnamed-algae-1");
    expect(result[0].thumbnailUrl).toBeNull();
  });

  it("preserves preferred section order for morphology and ecology", () => {
    const input = [
      {
        scientific_name: "Example algae",
        sections: { notes: "notes", ecology: "eco", morphology: "morph" },
        metadata: {}
      }
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(Object.keys(result[0].sections)).toEqual(["morphology", "ecology", "notes"]);
  });

  it("handles slug collisions by adding suffixes", () => {
    const input = [
      { scientific_name: "Ceratium hirundinella", sections: {}, metadata: {} },
      { scientific_name: "Ceratium hirundinella", sections: {}, metadata: {} }
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].slug).toBe("ceratium-hirundinella");
    expect(result[1].slug).toBe("ceratium-hirundinella-2");
  });

  it("keeps slug from taxon only when scientific_name includes authority", () => {
    const input = [
      {
        scientific_name: "Ceratium hirundinella (O.F. Muller) Dujardin 1841",
        sections: {},
        metadata: {}
      }
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].slug).toBe("ceratium-hirundinella");
    expect(result[0].scientificName).toBe("Ceratium hirundinella");
    expect(result[0].nameAuthority).toContain("1841");
    expect(result[0].title).toContain("Ceratium hirundinella");
    expect(result[0].title).toContain("1841");
  });

  it("uses thumbnail path from images when present", () => {
    const input = [
      {
        scientific_name: "Gymnodinium sp.",
        images: [
          "/algae-images/gymnodinium-sp/thumbnail-1.png",
          "/algae-images/gymnodinium-sp/plate-1.png",
        ],
        sections: {},
        metadata: {},
      },
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].thumbnailUrl).toContain("thumbnail-1.png");
  });

  it('moves "further_reading" to the end of sections', () => {
    const input = [
      {
        scientific_name: "Example algae",
        sections: {
          ecology: "eco",
          further_reading: "refs",
          notes: "notes",
          morphology: "morph",
        },
        metadata: {},
      },
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(Object.keys(result[0].sections)).toEqual(["morphology", "ecology", "notes", "further_reading"]);
  });
});
