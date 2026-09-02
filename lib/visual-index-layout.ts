import type { AlgaeRecord } from "./algae-types";
import {
  COLOR_AXIS,
  normalizeMorphology,
  type MorphologyProfile,
} from "./morphology-normalize";
import {
  classifyVisualShapeGroup,
  formatVisualShapeGroupLabel,
  VISUAL_SHAPE_GROUP_ORDER,
  type VisualShapeGroup,
} from "./visual-shape-group";
import { getPhylumAccent } from "./phylum-catalog";
import { partitionPlateAndGalleryImages } from "./partition-plate-images";

export type GridPlacement = {
  slug: string;
  col: number;
  row: number;
};

export type VisualIndexCell = {
  slug: string;
  scientificName: string;
  phylum: string;
  accent: string;
  imageUrl: string | null;
  col: number;
  row: number;
  shapeGroup: VisualShapeGroup;
};

export type VisualIndexSection = {
  group: VisualShapeGroup;
  label: string;
  cells: VisualIndexCell[];
};

const ORGANIZATION_WEIGHT = 3;
const COLOR_WEIGHT = 2;
const CELL_SHAPE_WEIGHT = 2;
const COLONY_SHAPE_WEIGHT = 1;

export function morphologyDistance(a: MorphologyProfile, b: MorphologyProfile): number {
  let distance = 0;
  if (a.organization !== b.organization) distance += ORGANIZATION_WEIGHT;
  if (a.color !== b.color) distance += COLOR_WEIGHT;
  if (a.cellShape !== b.cellShape) distance += CELL_SHAPE_WEIGHT;
  if (
    a.colonyShape !== "none" &&
    b.colonyShape !== "none" &&
    a.colonyShape !== b.colonyShape
  ) {
    distance += COLONY_SHAPE_WEIGHT;
  }
  return distance;
}

function gridManhattan(a: GridPlacement, b: GridPlacement): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function shapeGroupColumnCount(count: number): number {
  if (count <= 5) return count;
  return Math.max(1, Math.ceil(Math.sqrt(count)));
}

function buildCell(record: AlgaeRecord, col: number, row: number, shapeGroup: VisualShapeGroup): VisualIndexCell {
  const phylum = (record.sections.phylum ?? "").trim() || "Unclassified";
  const { plateImage } = partitionPlateAndGalleryImages(record.images, record.imageCaptions);

  return {
    slug: record.slug,
    scientificName: record.scientificName,
    phylum,
    accent: getPhylumAccent(phylum),
    imageUrl: record.thumbnailUrl ?? plateImage ?? null,
    col,
    row,
    shapeGroup,
  };
}

export function buildVisualIndexSections(records: AlgaeRecord[]): VisualIndexSection[] {
  const sections: VisualIndexSection[] = [];

  for (const group of VISUAL_SHAPE_GROUP_ORDER) {
    const groupRecords = records
      .filter((record) => classifyVisualShapeGroup(record) === group)
      .sort((a, b) => {
        const colorA = COLOR_AXIS[normalizeMorphology(a.sections).color];
        const colorB = COLOR_AXIS[normalizeMorphology(b.sections).color];
        if (colorA !== colorB) return colorA - colorB;
        return a.slug.localeCompare(b.slug);
      });

    if (groupRecords.length === 0) continue;

    const cols = shapeGroupColumnCount(groupRecords.length);
    const cells = groupRecords.map((record, index) =>
      buildCell(record, index % cols, Math.floor(index / cols), group)
    );

    sections.push({
      group,
      label: formatVisualShapeGroupLabel(group),
      cells,
    });
  }

  return sections;
}

export function computeVisualIndexLayout(records: AlgaeRecord[]): GridPlacement[] {
  const placements: GridPlacement[] = [];
  let rowCursor = 0;
  let isFirstGroup = true;

  for (const section of buildVisualIndexSections(records)) {
    if (!isFirstGroup) {
      rowCursor += 1;
    }
    isFirstGroup = false;

    const rows = Math.max(...section.cells.map((cell) => cell.row)) + 1;

    for (const cell of section.cells) {
      placements.push({
        slug: cell.slug,
        col: cell.col,
        row: rowCursor + cell.row,
      });
    }

    rowCursor += rows;
  }

  return placements.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
}

export function buildVisualIndexCells(records: AlgaeRecord[]): VisualIndexCell[] {
  return buildVisualIndexSections(records).flatMap((section) => section.cells);
}

/** Compare grid distance for pairs with low vs high morphology distance (for tests). */
export function averageGridDistanceForMorphologyThreshold(
  records: AlgaeRecord[],
  maxMorphDistance: number
): { matchedPairs: number; averageGridDistance: number } {
  const placements = computeVisualIndexLayout(records);
  const placementBySlug = new Map(placements.map((p) => [p.slug, p]));
  const profileBySlug = new Map(
    records.map((record) => [record.slug, normalizeMorphology(record.sections)])
  );

  let matchedPairs = 0;
  let totalGridDistance = 0;

  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const morphDist = morphologyDistance(
        profileBySlug.get(records[i].slug)!,
        profileBySlug.get(records[j].slug)!
      );
      if (morphDist > maxMorphDistance) continue;

      const a = placementBySlug.get(records[i].slug);
      const b = placementBySlug.get(records[j].slug);
      if (!a || !b) continue;

      matchedPairs += 1;
      totalGridDistance += gridManhattan(a, b);
    }
  }

  return {
    matchedPairs,
    averageGridDistance:
      matchedPairs === 0 ? Number.POSITIVE_INFINITY : totalGridDistance / matchedPairs,
  };
}
