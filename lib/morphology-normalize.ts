/** Stable morphology buckets for visual-index clustering. */

export type OrganizationBucket =
  | "single_flagellate"
  | "single_non_flagellate"
  | "colonial"
  | "filament"
  | "other";

export type ColorBucket = "green" | "blue_green" | "golden_brown" | "brown" | "red" | "other";

export type CellShapeBucket = "sphere" | "cylinder" | "oval" | "horned" | "other";

export type ColonyShapeBucket =
  | "spherical"
  | "irregular"
  | "filament_chain"
  | "none"
  | "other";

export type MorphologyProfile = {
  organization: OrganizationBucket;
  color: ColorBucket;
  cellShape: CellShapeBucket;
  colonyShape: ColonyShapeBucket;
};

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeOrganization(value: string | undefined): OrganizationBucket {
  const text = normalizeText(value);
  if (!text) return "other";
  if (text.includes("filament")) return "filament";
  if (text.includes("flagellated coenob") || text.includes("coenob")) return "colonial";
  if (
    text.includes("colonial") ||
    text.includes("colonies") ||
    text.includes("colony")
  ) {
    return "colonial";
  }
  if (text.includes("flagellat")) return "single_flagellate";
  if (text.includes("single cell")) return "single_non_flagellate";
  return "other";
}

export function normalizeColor(value: string | undefined): ColorBucket {
  const text = normalizeText(value);
  if (!text) return "other";
  if (text.includes("red") || text.includes("pink")) return "red";
  if (text.includes("blue") && text.includes("green")) return "blue_green";
  if (text.includes("blue-green") || text.includes("blue green")) return "blue_green";
  if (
    text.includes("golden-brown") ||
    text.includes("golden brown") ||
    text.includes("yellow")
  ) {
    return "golden_brown";
  }
  if (text.includes("green")) return "green";
  if (text.includes("brown") || text.includes("khaki") || text.includes("olive")) {
    return "brown";
  }
  return "other";
}

export function normalizeCellShape(value: string | undefined): CellShapeBucket {
  const text = normalizeText(value);
  if (!text) return "other";
  if (
    text.includes("horn") ||
    text.includes("chinese hat") ||
    text.includes("mushroom")
  ) {
    return "horned";
  }
  if (text.includes("cylinder") || text.includes("cylindrical")) return "cylinder";
  if (
    text.includes("sphere") ||
    text.includes("spheroid") ||
    text.includes("spherical") ||
    text.includes("round")
  ) {
    return "sphere";
  }
  if (
    text.includes("oval") ||
    text.includes("ovoid") ||
    text.includes("drop") ||
    text.includes("leaf") ||
    text.includes("prolate")
  ) {
    return "oval";
  }
  return "other";
}

export function normalizeColonyShape(value: string | undefined): ColonyShapeBucket {
  const text = normalizeText(value);
  if (!text) return "none";
  if (text.includes("filament") || text.includes("chain")) return "filament_chain";
  if (text.includes("irregular") || text.includes("variable") || text.includes("rectangular")) {
    return "irregular";
  }
  if (text.includes("spherical") || text.includes("sphere") || text.includes("subspherical")) {
    return "spherical";
  }
  return "other";
}

export function normalizeMorphology(sections: Record<string, string>): MorphologyProfile {
  return {
    organization: normalizeOrganization(sections.organization),
    color: normalizeColor(sections.color),
    cellShape: normalizeCellShape(sections.cell_shape),
    colonyShape: normalizeColonyShape(sections.colony_shape),
  };
}

/** Semantic axis positions in [0, 1] for force-layout seeding. */
export const ORGANIZATION_AXIS: Record<OrganizationBucket, number> = {
  single_flagellate: 0.1,
  single_non_flagellate: 0.25,
  colonial: 0.55,
  filament: 0.85,
  other: 0.5,
};

export const COLOR_AXIS: Record<ColorBucket, number> = {
  green: 0.1,
  blue_green: 0.3,
  golden_brown: 0.55,
  brown: 0.75,
  red: 0.9,
  other: 0.5,
};
