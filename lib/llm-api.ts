import type { AlgaeRecord } from "./algae-types";
import type { GlossaryData } from "./glossary-types";
import { buildCitationBundle } from "./cite-this-record";

const ATLAS_URL = "https://kinneret-algae-atlas.org";

export type SpeciesIndexItem = {
  slug: string;
  scientific_name: string;
  canonical_url: string;
  taxonomy: {
    phylum: string;
    class: string;
    order: string;
  };
  record_updated: string | null;
  citation: {
    per_record: string;
    atlas_attribution: string;
  };
};

export type SpeciesDetail = SpeciesIndexItem & {
  name_authority: string | null;
  key_fields: Record<string, string>;
  narrative: {
    morphology: string;
    ecology: string;
    environmental_conditions: string;
    further_reading: string;
  };
};

function canonicalUrl(path: string): string {
  return `${ATLAS_URL}${path}`;
}

function taxonomyFromRecord(record: AlgaeRecord): SpeciesIndexItem["taxonomy"] {
  return {
    phylum: (record.sections.phylum ?? "").trim(),
    class: (record.sections.class ?? "").trim(),
    order: (record.sections.order ?? "").trim(),
  };
}

const KEY_FIELDS = [
  "habitat",
  "organization",
  "color",
  "cell_shape",
  "colony_shape",
  "cell_diameter_d",
  "cell_length_l",
  "biovolume_per_cell",
  "biovolume_equation",
  "filament_length",
  "cells_per_filament",
  "colony_diameter",
  "cells_per_colony",
  "distinctive_attributes",
] as const;

export function toSpeciesIndexItem(record: AlgaeRecord): SpeciesIndexItem {
  const citation = buildCitationBundle(record.recordUpdated);
  return {
    slug: record.slug,
    scientific_name: record.scientificName,
    canonical_url: canonicalUrl(`/algae/${record.slug}`),
    taxonomy: taxonomyFromRecord(record),
    record_updated: record.recordUpdated,
    citation: {
      per_record: citation.recordCitation,
      atlas_attribution: citation.atlasAttribution,
    },
  };
}

export function toSpeciesDetail(record: AlgaeRecord): SpeciesDetail {
  const keyFields: Record<string, string> = {};
  for (const field of KEY_FIELDS) {
    const value = (record.sections[field] ?? "").trim();
    if (value) {
      keyFields[field] = value;
    }
  }

  const base = toSpeciesIndexItem(record);
  return {
    ...base,
    name_authority: record.nameAuthority,
    key_fields: keyFields,
    narrative: {
      morphology: (record.sections.morphological_features ?? "").trim(),
      ecology: (record.sections.ecology ?? "").trim(),
      environmental_conditions: (record.sections.environmental_conditions ?? "").trim(),
      further_reading: (record.sections.further_reading ?? "").trim(),
    },
  };
}

export function toGlossaryApi(glossary: GlossaryData) {
  return {
    title: glossary.title,
    canonical_url: canonicalUrl("/glossary/"),
    record_updated: glossary.record_updated,
    source_file: glossary.source_file ?? null,
    citation: {
      per_record: buildCitationBundle(glossary.record_updated).recordCitation,
      atlas_attribution: buildCitationBundle(glossary.record_updated).atlasAttribution,
    },
    plates: (glossary.plates ?? []).map((plate) => ({
      id: plate.id,
      label: plate.label,
      src: canonicalUrl(plate.src),
    })),
    entries: glossary.entries.map((entry) => ({
      term: entry.term,
      slug: entry.slug,
      definition: entry.definition,
      letter: entry.letter,
    })),
  };
}
