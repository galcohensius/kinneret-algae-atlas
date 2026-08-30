import type { AlgaeRecord } from "./algae-types";
import {
  COLOR_AXIS,
  normalizeMorphology,
  ORGANIZATION_AXIS,
  type MorphologyProfile,
} from "./morphology-normalize";
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
};

type Point = { x: number; y: number };

const ORGANIZATION_WEIGHT = 3;
const COLOR_WEIGHT = 2;
const CELL_SHAPE_WEIGHT = 2;
const COLONY_SHAPE_WEIGHT = 1;

const FORCE_ITERATIONS = 45;
const ATTRACTION_STRENGTH = 0.08;
const REPULSION_STRENGTH = 0.0025;
const TARGET_DISTANCE_SCALE = 0.12;

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

function seedPositions(profiles: MorphologyProfile[]): Point[] {
  return profiles.map((profile) => ({
    x: COLOR_AXIS[profile.color],
    y: ORGANIZATION_AXIS[profile.organization],
  }));
}

function refinePositions(positions: Point[], distances: number[][]): Point[] {
  const next = positions.map((point) => ({ ...point }));

  for (let iteration = 0; iteration < FORCE_ITERATIONS; iteration += 1) {
    const forces = next.map(() => ({ x: 0, y: 0 }));

    for (let i = 0; i < next.length; i += 1) {
      for (let j = i + 1; j < next.length; j += 1) {
        const dx = next[j].x - next[i].x;
        const dy = next[j].y - next[i].y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.001) {
          dist = 0.001;
        }

        const morphDist = distances[i][j];
        const target = TARGET_DISTANCE_SCALE * (1 + morphDist * 0.35);

        if (morphDist <= 3) {
          const pull = (dist - target) * ATTRACTION_STRENGTH;
          const nx = dx / dist;
          const ny = dy / dist;
          forces[i].x += pull * nx;
          forces[i].y += pull * ny;
          forces[j].x -= pull * nx;
          forces[j].y -= pull * ny;
        }

        const repulse = REPULSION_STRENGTH / (dist * dist);
        const rx = dx / dist;
        const ry = dy / dist;
        forces[i].x -= repulse * rx;
        forces[i].y -= repulse * ry;
        forces[j].x += repulse * rx;
        forces[j].y += repulse * ry;
      }
    }

    for (let i = 0; i < next.length; i += 1) {
      next[i].x = clamp01(next[i].x + forces[i].x);
      next[i].y = clamp01(next[i].y + forces[i].y);
    }
  }

  return next;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function snapToGrid(slugs: string[], positions: Point[]): GridPlacement[] {
  const count = slugs.length;
  if (count === 0) return [];

  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const ordered = slugs
    .map((slug, index) => ({ slug, ...positions[index] }))
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.slug.localeCompare(b.slug);
    });

  const occupied = new Set<string>();
  const placements: GridPlacement[] = [];

  for (const item of ordered) {
    let bestCol = 0;
    let bestRow = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const key = `${col},${row}`;
        if (occupied.has(key)) continue;

        const targetX = cols <= 1 ? 0.5 : col / (cols - 1);
        const targetY = rows <= 1 ? 0.5 : row / (rows - 1);
        const score = Math.hypot(item.x - targetX, item.y - targetY);
        if (score < bestScore) {
          bestScore = score;
          bestCol = col;
          bestRow = row;
        }
      }
    }

    occupied.add(`${bestCol},${bestRow}`);
    placements.push({ slug: item.slug, col: bestCol, row: bestRow });
  }

  return placements.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
}

function buildDistanceMatrix(profiles: MorphologyProfile[]): number[][] {
  const size = profiles.length;
  const matrix: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) {
      const distance = morphologyDistance(profiles[i], profiles[j]);
      matrix[i][j] = distance;
      matrix[j][i] = distance;
    }
  }

  return matrix;
}

export function computeVisualIndexLayout(records: AlgaeRecord[]): GridPlacement[] {
  const sorted = [...records].sort((a, b) => a.slug.localeCompare(b.slug));
  const profiles = sorted.map((record) => normalizeMorphology(record.sections));
  const distances = buildDistanceMatrix(profiles);
  const positions = refinePositions(seedPositions(profiles), distances);
  return snapToGrid(
    sorted.map((record) => record.slug),
    positions
  );
}

export function buildVisualIndexCells(records: AlgaeRecord[]): VisualIndexCell[] {
  const placementBySlug = new Map(computeVisualIndexLayout(records).map((p) => [p.slug, p]));

  return records
    .map((record) => {
      const placement = placementBySlug.get(record.slug);
      if (!placement) return null;

      const phylum = (record.sections.phylum ?? "").trim() || "Unclassified";
      const { plateImage } = partitionPlateAndGalleryImages(
        record.images,
        record.imageCaptions
      );

      return {
        slug: record.slug,
        scientificName: record.scientificName,
        phylum,
        accent: getPhylumAccent(phylum),
        imageUrl: record.thumbnailUrl ?? plateImage ?? null,
        col: placement.col,
        row: placement.row,
      };
    })
    .filter((cell): cell is VisualIndexCell => cell !== null)
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
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
