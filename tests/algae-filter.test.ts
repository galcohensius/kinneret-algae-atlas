import { describe, expect, it } from "vitest";
import { buildAlgaeSearchHaystack, filterAlgaeByQuery } from "../lib/algae-filter";

type FilterableRecord = {
  title: string;
  scientificName: string;
  nameAuthority?: string | null;
  sections?: Record<string, string>;
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

  it("matches nothing for an unknown term", () => {
    expect(filterAlgaeByQuery(RECORDS, "volvox")).toHaveLength(0);
  });

  it("works for records without sections", () => {
    const bare = [{ title: "X y", scientificName: "X y" }];
    expect(filterAlgaeByQuery(bare, "x")).toHaveLength(1);
  });
});
