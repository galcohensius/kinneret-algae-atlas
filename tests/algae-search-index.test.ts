import { describe, expect, it } from "vitest";
import {
  buildAlgaeSearchIndex,
  filterCatalogBySearchIndex,
} from "../lib/algae-search-index";
import { toAlgaeCatalogRecord } from "../lib/algae";
import type { AlgaeRecord } from "../lib/algae-types";

const RECORDS: AlgaeRecord[] = [
  {
    slug: "microcystis-aeruginosa",
    title: "Microcystis aeruginosa",
    scientificName: "Microcystis aeruginosa",
    nameAuthority: null,
    thumbnailUrl: null,
    images: [],
    imageCaptions: [],
    imageCaptionsRich: [],
    morphology: null,
    ecology: null,
    notes: null,
    sections: {
      phylum: "Cyanobacteriophyta",
      organization: "Colonial",
    },
    sectionsRich: {},
    metadata: {},
    recordUpdated: null,
  },
  {
    slug: "mougeotia",
    title: "Mougeotia",
    scientificName: "Mougeotia",
    nameAuthority: null,
    thumbnailUrl: null,
    images: [],
    imageCaptions: [],
    imageCaptionsRich: [],
    morphology: null,
    ecology: null,
    notes: null,
    sections: { phylum: "Charophyta", organization: "Filamentous" },
    sectionsRich: {},
    metadata: {},
    recordUpdated: null,
  },
];

describe("buildAlgaeSearchIndex", () => {
  it("builds slug and haystack entries from full records", () => {
    const index = buildAlgaeSearchIndex(RECORDS);
    expect(index).toHaveLength(2);
    expect(index[0].slug).toBe("microcystis-aeruginosa");
    expect(index[0].searchHaystack).toContain("colonial");
    expect(index[1].searchHaystack).toContain("charophytes");
  });
});

describe("filterCatalogBySearchIndex", () => {
  it("filters catalog rows using a loaded search index", () => {
    const catalog = RECORDS.map(toAlgaeCatalogRecord);
    const index = new Map(buildAlgaeSearchIndex(RECORDS).map((entry) => [entry.slug, entry.searchHaystack]));
    expect(filterCatalogBySearchIndex(catalog, index, "charophytes").map((r) => r.slug)).toEqual([
      "mougeotia",
    ]);
  });
});
