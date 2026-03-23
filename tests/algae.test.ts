import { describe, expect, it } from "vitest";
import { normalizeAlgaeRecords, type RawAlgaeRecord } from "../lib/algae";

describe("normalizeAlgaeRecords", () => {
  it("adds fallback name when scientific name is missing", () => {
    const input: RawAlgaeRecord[] = [
      { scientific_name: null, sections: { notes: "x" }, metadata: {} }
    ];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].scientificName).toBe("unnamed-algae-1");
    expect(result[0].slug).toBe("unnamed-algae-1");
  });

  it("preserves preferred section order for morphology and ecology", () => {
    const input: RawAlgaeRecord[] = [
      {
        scientific_name: "Example algae",
        sections: { notes: "notes", ecology: "eco", morphology: "morph" },
        metadata: {}
      }
    ];

    const result = normalizeAlgaeRecords(input);
    expect(Object.keys(result[0].sections)).toEqual(["morphology", "ecology", "notes"]);
  });

  it("handles slug collisions by adding suffixes", () => {
    const input: RawAlgaeRecord[] = [
      { scientific_name: "Ceratium hirundinella", sections: {}, metadata: {} },
      { scientific_name: "Ceratium hirundinella", sections: {}, metadata: {} }
    ];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].slug).toBe("ceratium-hirundinella");
    expect(result[1].slug).toBe("ceratium-hirundinella-2");
  });

  it('moves "further_reading" to the end of sections', () => {
    const input: RawAlgaeRecord[] = [
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
    ];

    const result = normalizeAlgaeRecords(input);
    expect(Object.keys(result[0].sections)).toEqual(["morphology", "ecology", "notes", "further_reading"]);
  });
});
