import type { AlgaeRecord } from "./algae-types";

/**
 * Muted accent colors per phylum (readable on light and dark backgrounds).
 *
 * Name → color (Greek roots in the phylum name):
 *   Chlorophyta — chloros (green)
 *   Rhodophyta — rhodon (rose / red)
 *
 * Green by biology rather than name (freshwater green algae); kept lighter than
 * Chlorophyta's dark forest green to stay distinct:
 *   Charophyta
 *
 * No color in the name; hue chosen for distinction and typical field appearance:
 *   Cryptista, Cyanobacteriophyta, Dinoflagellata, Euglenophyta, Haptophyta
 *
 * Bacillariophyta — bacillum (rod); diatoms; golden-brown silica frustules:
 *   Bacillariophyta
 */
const PHYLUM_ACCENTS: Record<string, string> = {
  bacillariophyta: "#b45309", // diatoms; golden-brown silica frustules
  chlorophyta: "#15803d", // chloros = green
  rhodophyta: "#be123c", // rhodon = rose-red
  charophyta: "#22c55e", // green algae; bright spring green, kept lighter than Chlorophyta's dark forest green to stay distinct
  cyanobacteriophyta: "#0891b2", // blue-green cyanobacteria
  dinoflagellata: "#7e22ce", // purple
  cryptista: "#ca8a04", // light brown / amber
  euglenophyta: "#84cc16", // green-yellow
  haptophyta: "#2563eb", // no color in name; marine coccolithophores
  unclassified: "#64748b",
};

const FALLBACK_PALETTE = [
  PHYLUM_ACCENTS.chlorophyta,
  PHYLUM_ACCENTS.rhodophyta,
  PHYLUM_ACCENTS.cryptista,
  PHYLUM_ACCENTS.cyanobacteriophyta,
  PHYLUM_ACCENTS.dinoflagellata,
  PHYLUM_ACCENTS.euglenophyta,
  PHYLUM_ACCENTS.haptophyta,
];

export type PhylumCatalogGroup = {
  phylum: string;
  slug: string;
  accent: string;
  records: AlgaeRecord[];
};

export function phylumToSlug(phylum: string): string {
  const normalized = phylum
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "unclassified";
}

export function getPhylumAccent(phylum: string): string {
  const key = phylumToSlug(phylum);
  if (PHYLUM_ACCENTS[key]) {
    return PHYLUM_ACCENTS[key];
  }
  let hash = 0;
  for (const ch of key) {
    hash = (hash + ch.charCodeAt(0)) % FALLBACK_PALETTE.length;
  }
  return FALLBACK_PALETTE[hash] ?? PHYLUM_ACCENTS.unclassified;
}

/**
 * Group consecutive records by phylum. Input should already be sorted
 * (see sortAlgaeRecordsForCatalog).
 */
/** Atlas browse order: the phylum-catalog groups flattened (phylum, then A-Z within it). */
export function listAlgaeInAtlasOrder(records: AlgaeRecord[]): AlgaeRecord[] {
  return groupAlgaeByPhylum(records).flatMap((group) => group.records);
}

export function groupAlgaeByPhylum(records: AlgaeRecord[]): PhylumCatalogGroup[] {
  const groups: PhylumCatalogGroup[] = [];

  for (const record of records) {
    const phylum = (record.sections.phylum ?? "").trim() || "Unclassified";
    const last = groups[groups.length - 1];
    if (last && last.phylum === phylum) {
      last.records.push(record);
      continue;
    }
    groups.push({
      phylum,
      slug: phylumToSlug(phylum),
      accent: getPhylumAccent(phylum),
      records: [record],
    });
  }

  return groups;
}
