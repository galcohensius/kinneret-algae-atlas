import { describe, expect, it } from "vitest";
import {
  normalizeAlgaeRecords,
  sortAlgaeRecordsForCatalog,
  type AlgaeRecord,
  type RawAlgaeRecord,
} from "../lib/algae";

describe("sortAlgaeRecordsForCatalog", () => {
  it("orders by phylum, then scientific name (ignores class/order within same phylum)", () => {
    const records: AlgaeRecord[] = [
      {
        slug: "order-b-name-z",
        title: "Species Z",
        scientificName: "Zea species",
        nameAuthority: null,
        thumbnailUrl: null,
        images: [],
        imageCaptions: [],
        imageCaptionsRich: [],
        morphology: null,
        ecology: null,
        notes: null,
        sections: {
          phylum: "B",
          class: "B1",
          order: "Z-order-should-not-matter",
        },
        sectionsRich: {},
        metadata: {},
        recordUpdated: null,
      },
      {
        slug: "order-a-name-a",
        title: "Species A",
        scientificName: "Alga alpha",
        nameAuthority: null,
        thumbnailUrl: null,
        images: [],
        imageCaptions: [],
        imageCaptionsRich: [],
        morphology: null,
        ecology: null,
        notes: null,
        sections: {
          phylum: "B",
          class: "B1",
          order: "A-order-should-not-matter",
        },
        sectionsRich: {},
        metadata: {},
        recordUpdated: null,
      },
      {
        slug: "phylum-a",
        title: "Species A",
        scientificName: "Alga alpha",
        nameAuthority: null,
        thumbnailUrl: null,
        images: [],
        imageCaptions: [],
        imageCaptionsRich: [],
        morphology: null,
        ecology: null,
        notes: null,
        sections: {
          phylum: "A",
          class: "A1",
          order: "A1a",
        },
        sectionsRich: {},
        metadata: {},
        recordUpdated: null,
      },
    ];

    const sorted = sortAlgaeRecordsForCatalog(records).map((r) => r.slug);
    expect(sorted).toEqual(["phylum-a", "order-a-name-a", "order-b-name-z"]);
  });
});

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

  it("passes through record_updated from metadata", () => {
    const input = [
      {
        scientific_name: "Example algae",
        sections: { notes: "x" },
        metadata: { record_updated: "2026-05-01" },
      },
    ] as unknown as RawAlgaeRecord[];

    const result = normalizeAlgaeRecords(input);
    expect(result[0].recordUpdated).toBe("2026-05-01");
  });
});
