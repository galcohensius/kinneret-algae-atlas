import { describe, expect, it } from "vitest";
import {
  formatPhylumLabel,
  groupAlgaeByPhylum,
  listAlgaeInAtlasOrder,
  PHYLUM_POPULAR_NAMES,
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

  it("slugifies phylum names", () => {
    expect(phylumToSlug("Bacillariophyta")).toBe("bacillariophyta");
  });
});

describe("phylum-catalog popular names", () => {
  it("maps formal phylum names to popular labels", () => {
    expect(formatPhylumLabel("Bacillariophyta")).toBe("Bacillariophyta (diatoms)");
    expect(formatPhylumLabel("Cyanobacteriophyta")).toBe("Cyanobacteriophyta (blue-greens)");
    expect(formatPhylumLabel("Unknown phylum")).toBe("Unknown phylum");
  });

  it("includes all requested popular names", () => {
    expect(PHYLUM_POPULAR_NAMES.bacillariophyta).toBe("diatoms");
    expect(PHYLUM_POPULAR_NAMES.charophyta).toBe("charophytes");
    expect(PHYLUM_POPULAR_NAMES.chlorophyta).toBe("green algae");
    expect(PHYLUM_POPULAR_NAMES.cryptista).toBe("cryptophytes");
    expect(PHYLUM_POPULAR_NAMES.cyanobacteriophyta).toBe("blue-greens");
    expect(PHYLUM_POPULAR_NAMES.dinoflagellata).toBe("dinoflagellates");
    expect(PHYLUM_POPULAR_NAMES.euglenophyta).toBe("euglenophytes");
    expect(PHYLUM_POPULAR_NAMES.haptophyta).toBe("haptophytes");
    expect(PHYLUM_POPULAR_NAMES.rhodophyta).toBe("red algae");
  });
});
