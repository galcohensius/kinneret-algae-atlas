import type { AlgaeRecord } from "./algae-types";

/** Shape clusters for the visual index (user-defined morphology groups). */
export type VisualShapeGroup =
  | "filamentous"
  | "colonial_cyanobacteria"
  | "coenobial"
  | "large_flagellate"
  | "small_single_cell"
  | "other";

export const VISUAL_SHAPE_GROUP_ORDER: VisualShapeGroup[] = [
  "filamentous",
  "colonial_cyanobacteria",
  "coenobial",
  "large_flagellate",
  "small_single_cell",
  "other",
];

/** Vertical axis seed in [0, 1] for grid placement. */
export const SHAPE_GROUP_AXIS: Record<VisualShapeGroup, number> = {
  filamentous: 0.08,
  colonial_cyanobacteria: 0.28,
  coenobial: 0.48,
  large_flagellate: 0.68,
  small_single_cell: 0.88,
  other: 0.5,
};

const SMALL_SINGLE_CELL_SLUGS = new Set([
  "chrysochromulina-parva",
  "plagioselmis-nannoplanctica",
]);

const LARGE_FLAGELLATE_SLUGS = new Set([
  "cryptomonas",
  "euglena",
  "phacus-longicauda",
  "tetraselmis-cordiformis",
  "trachelomonas",
  "chlamydomonas-sp",
]);

function isColonialCyanobacterium(phylum: string, organization: string): boolean {
  if (!phylum.includes("cyanobacteriophyta")) return false;
  return (
    organization.includes("colonial") ||
    organization.includes("colonies") ||
    organization.includes("colony")
  );
}

export function classifyVisualShapeGroup(record: AlgaeRecord): VisualShapeGroup {
  const organization = (record.sections.organization ?? "").trim().toLowerCase();
  const phylum = (record.sections.phylum ?? "").trim().toLowerCase();

  if (SMALL_SINGLE_CELL_SLUGS.has(record.slug)) {
    return "small_single_cell";
  }

  if (organization.includes("filament")) {
    return "filamentous";
  }

  if (organization.includes("coenob")) {
    return "coenobial";
  }

  if (isColonialCyanobacterium(phylum, organization)) {
    return "colonial_cyanobacteria";
  }

  if (LARGE_FLAGELLATE_SLUGS.has(record.slug)) {
    return "large_flagellate";
  }

  if (phylum.includes("dinoflagellata")) {
    return "large_flagellate";
  }

  if (organization.includes("flagellat")) {
    return "large_flagellate";
  }

  return "other";
}

export function shapeGroupSortIndex(group: VisualShapeGroup): number {
  const index = VISUAL_SHAPE_GROUP_ORDER.indexOf(group);
  return index === -1 ? VISUAL_SHAPE_GROUP_ORDER.length : index;
}
