import { describe, expect, it } from "vitest";
import { buildAlgaeSearchHaystack, filterAlgaeByQuery } from "../lib/algae-filter";
import { toAlgaeIndexRecord } from "../lib/algae";
import type { AlgaeRecord } from "../lib/algae-types";

type FilterableRecord = {
  title: string;
  scientificName: string;
  nameAuthority?: string | null;
  sections?: Record<string, string>;
  searchHaystack?: string;
};

const RECORDS: FilterableRecord[] = [
  {
    title: "Microcystis aeruginosa (Kützing) Kützing",
    scientificName: "Microcystis aeruginosa",
    nameAuthority: "(Kützing) Kützing",
    sections: {
      phylum: "Cyanobacteriophyta",
      previous_name_used: "Anacystis cyanea",
      organization: "Colonial",
      color: "Blue-green",
      habitat: "Planktonic",
    },
  },
  {
    title: "Peridinium gatunense Nygaard",
    scientificName: "Peridinium gatunense",
    nameAuthority: "Nygaard",
    sections: {
      phylum: "Dinoflagellata",
      organization: "Solitary",
    },
  },
  {
    title: "Mougeotia Agardh",
    scientificName: "Mougeotia",
    sections: {
      phylum: "Charophyta",
      organization: "Filamentous",
      color: "Green",
    },
  },
];

describe("buildAlgaeSearchHaystack", () => {
  it("includes phylum popular names", () => {
    const haystack = buildAlgaeSearchHaystack(RECORDS[2]);
    expect(haystack).toContain("charophytes");
  });

  it("includes feature fields", () => {
    const haystack = buildAlgaeSearchHaystack(RECORDS[0]);
    expect(haystack).toContain("colonial");
    expect(haystack).toContain("blue-green");
    expect(haystack).toContain("blue-greens");
  });
});

describe("filterAlgaeByQuery", () => {
  it("returns all records for an empty query", () => {
    expect(filterAlgaeByQuery(RECORDS, "  ")).toHaveLength(3);
  });

  it("matches scientific name case-insensitively", () => {
    expect(filterAlgaeByQuery(RECORDS, "peridinium")).toEqual([RECORDS[1]]);
  });

  it("matches a previous name", () => {
    expect(filterAlgaeByQuery(RECORDS, "anacystis")).toEqual([RECORDS[0]]);
  });

  it("matches phylum", () => {
    expect(filterAlgaeByQuery(RECORDS, "dinoflag")).toEqual([RECORDS[1]]);
  });

  it("matches phylum popular names", () => {
    expect(filterAlgaeByQuery(RECORDS, "charophytes")).toEqual([RECORDS[2]]);
    expect(filterAlgaeByQuery(RECORDS, "blue-greens")).toEqual([RECORDS[0]]);
  });

  it("matches feature fields such as organization and color", () => {
    expect(filterAlgaeByQuery(RECORDS, "filamentous")).toEqual([RECORDS[2]]);
    expect(filterAlgaeByQuery(RECORDS, "colonial")).toEqual([RECORDS[0]]);
    expect(filterAlgaeByQuery(RECORDS, "planktonic")).toEqual([RECORDS[0]]);
  });

  it("uses precomputed searchHaystack when present", () => {
    const slim = [
      {
        title: "Hidden",
        scientificName: "Hidden",
        searchHaystack: "custom token only",
      },
    ];
    expect(filterAlgaeByQuery(slim, "custom token")).toHaveLength(1);
    expect(filterAlgaeByQuery(slim, "hidden")).toHaveLength(0);
  });

  it("matches nothing for an unknown term", () => {
    expect(filterAlgaeByQuery(RECORDS, "volvox")).toHaveLength(0);
  });

  it("works for records without sections", () => {
    const bare = [{ title: "X y", scientificName: "X y" }];
    expect(filterAlgaeByQuery(bare, "x")).toHaveLength(1);
  });
});

describe("toAlgaeIndexRecord", () => {
  it("keeps card fields and precomputes searchHaystack", () => {
    const full: AlgaeRecord = {
      slug: "mougeotia",
      title: "Mougeotia Agardh",
      scientificName: "Mougeotia",
      nameAuthority: null,
      thumbnailUrl: "/algae-images/mougeotia/thumbnail-1.jpg",
      images: ["/algae-images/mougeotia/plate-1.jpg"],
      imageCaptions: ["long caption"],
      imageCaptionsRich: [],
      morphology: null,
      ecology: "Long ecology text that should not ship to the home index.",
      notes: null,
      sections: {
        phylum: "Charophyta",
        organization: "Filamentous",
      },
      sectionsRich: {},
      metadata: {},
      recordUpdated: "2026-08-17",
    };

    const slim = toAlgaeIndexRecord(full);
    expect(slim).toEqual({
      slug: "mougeotia",
      scientificName: "Mougeotia",
      thumbnailUrl: "/algae-images/mougeotia/thumbnail-1.jpg",
      sections: { phylum: "Charophyta" },
      recordUpdated: "2026-08-17",
      searchHaystack: buildAlgaeSearchHaystack(full),
    });
    expect(JSON.stringify(slim).length).toBeLessThan(JSON.stringify(full).length);
  });
});
