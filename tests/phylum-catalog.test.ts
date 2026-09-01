import { describe, expect, it } from "vitest";
import {
  groupAlgaeByPhylum,
  listAlgaeInAtlasOrder,
  phylumToSlug,
} from "../lib/phylum-catalog";
import type { AlgaeRecord } from "../lib/algae-types";

function stubRecord(phylum: string, slug: string, scientificName: string): AlgaeRecord {
  return {
    slug,
    title: scientificName,
    scientificName,
    nameAuthority: null,
    thumbnailUrl: null,
    images: [],
    imageCaptions: [],
    imageCaptionsRich: [],
    morphology: null,
    ecology: null,
    notes: null,
    sections: { phylum },
    sectionsRich: {},
    metadata: {},
    recordUpdated: null,
  };
}

describe("listAlgaeInAtlasOrder", () => {
  it("flattens the catalog groups covering every record exactly once", () => {
    const records = [
      stubRecord("B", "b-1", "Beta one"),
      stubRecord("B", "b-2", "Beta two"),
      stubRecord("A", "a-1", "Alpha one"),
    ];
    const ordered = listAlgaeInAtlasOrder(records);
    expect(ordered.map((r) => r.slug)).toEqual(["b-1", "b-2", "a-1"]);
    expect(new Set(ordered.map((r) => r.slug)).size).toBe(records.length);
  });
});

describe("groupAlgaeByPhylum", () => {
  it("groups consecutive records with the same phylum", () => {
    const records = [
      stubRecord("B", "b-1", "Beta one"),
      stubRecord("B", "b-2", "Beta two"),
      stubRecord("A", "a-1", "Alpha one"),
    ];
    const groups = groupAlgaeByPhylum(records);
    expect(groups).toHaveLength(2);
    expect(groups[0].phylum).toBe("B");
    expect(groups[0].records).toHaveLength(2);
    expect(groups[1].phylum).toBe("A");
  });

  it("uses unclassified slug for empty phylum", () => {
    const groups = groupAlgaeByPhylum([stubRecord("", "x", "X")]);
    expect(groups[0].phylum).toBe("Unclassified");
    expect(groups[0].slug).toBe("unclassified");
  });
});

describe("phylumToSlug", () => {
  it("slugifies phylum names for anchors", () => {
    expect(phylumToSlug("Dinoflagellata")).toBe("dinoflagellata");
  });
});
