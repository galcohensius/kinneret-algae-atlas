import { describe, expect, it } from "vitest";
import { filterAlgaeByQuery } from "../lib/algae-filter";

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
    },
  },
  {
    title: "Peridinium gatunense Nygaard",
    scientificName: "Peridinium gatunense",
    nameAuthority: "Nygaard",
    sections: { phylum: "Dinoflagellata" },
  },
];

describe("filterAlgaeByQuery", () => {
  it("returns all records for an empty query", () => {
    expect(filterAlgaeByQuery(RECORDS, "  ")).toHaveLength(2);
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

  it("matches nothing for an unknown term", () => {
    expect(filterAlgaeByQuery(RECORDS, "volvox")).toHaveLength(0);
  });

  it("works for records without sections", () => {
    const bare = [{ title: "X y", scientificName: "X y" }];
    expect(filterAlgaeByQuery(bare, "x")).toHaveLength(1);
  });
});
