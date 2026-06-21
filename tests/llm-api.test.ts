import { describe, expect, it } from "vitest";
import { toGlossaryApi, toSpeciesDetail, toSpeciesIndexItem } from "../lib/llm-api";
import type { AlgaeRecord } from "../lib/algae-types";
import type { GlossaryData } from "../lib/glossary-types";

function stubRecord(): AlgaeRecord {
  return {
    slug: "eudorina-elegans",
    title: "Eudorina elegans Ehrenberg 1832",
    scientificName: "Eudorina elegans",
    nameAuthority: "Ehrenberg 1832",
    thumbnailUrl: null,
    images: [],
    imageCaptions: [],
    imageCaptionsRich: [],
    morphology: null,
    ecology: null,
    notes: null,
    sections: {
      phylum: "Chlorophyta",
      class: "Chlorophyceae",
      order: "Volvocales",
      ecology: "Rare in monitoring samples.",
      colony_shape: "spherical to ellipsoidal",
      cells_per_colony: "4-16",
    },
    sectionsRich: {},
    metadata: {},
    recordUpdated: "2026-06-10",
  };
}

describe("llm-api species mappings", () => {
  it("builds species index item with citation fields", () => {
    const item = toSpeciesIndexItem(stubRecord());
    expect(item.slug).toBe("eudorina-elegans");
    expect(item.taxonomy.phylum).toBe("Chlorophyta");
    expect(item.citation.per_record).toContain("Electronic publication.");
    expect(item.citation.atlas_attribution).toContain("Dr. Tamar Zohary");
  });

  it("builds species detail key fields and narrative", () => {
    const detail = toSpeciesDetail(stubRecord());
    expect(detail.key_fields.colony_shape).toBe("spherical to ellipsoidal");
    expect(detail.key_fields.cells_per_colony).toBe("4-16");
    expect(detail.narrative.ecology).toContain("Rare in monitoring");
  });
});

describe("llm-api glossary mapping", () => {
  it("returns compact glossary API payload with citation and plates", () => {
    const glossary: GlossaryData = {
      title: "Glossary",
      record_updated: "2026-06-10",
      source_file: "1-Glossary 2026-06-07.doc",
      plates: [{ id: "cox-1996-plate-1", label: "Plate 1", src: "/glossary-images/cox-1996-plate-1.png" }],
      entries: [
        {
          term: "Apex",
          slug: "apex",
          definition: "tip of a cell",
          letter: "A",
          match_phrases: ["Apex"],
        },
      ],
    };
    const payload = toGlossaryApi(glossary);
    expect(payload.citation.per_record).toContain("10 June 2026");
    expect(payload.citation.atlas_attribution).toContain("Dr. Alla Alster");
    expect(payload.entries[0].slug).toBe("apex");
    expect(payload.plates[0].src).toBe(
      "https://kinneret-algae-atlas.org/glossary-images/cox-1996-plate-1.png"
    );
  });
});
