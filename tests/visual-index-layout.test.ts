import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAlgaeRecords, type RawAlgaeRecord } from "../lib/algae";
import {
  averageGridDistanceForMorphologyThreshold,
  computeVisualIndexLayout,
  morphologyDistance,
} from "../lib/visual-index-layout";
import { normalizeMorphology } from "../lib/morphology-normalize";

function loadCatalogRecords() {
  const filePath = resolve(__dirname, "../data/processed/algae_records.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as RawAlgaeRecord[];
  return normalizeAlgaeRecords(raw);
}

function gridDistance(
  placements: ReturnType<typeof computeVisualIndexLayout>,
  slugA: string,
  slugB: string
): number {
  const a = placements.find((p) => p.slug === slugA);
  const b = placements.find((p) => p.slug === slugB);
  if (!a || !b) {
    throw new Error(`Missing placement for ${slugA} or ${slugB}`);
  }
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

describe("visual-index-layout", () => {
  const records = loadCatalogRecords();

  it("places every species exactly once with deterministic layout", () => {
    const first = computeVisualIndexLayout(records);
    const second = computeVisualIndexLayout(records);

    expect(first).toHaveLength(records.length);
    expect(new Set(first.map((p) => p.slug)).size).toBe(records.length);
    expect(first).toEqual(second);
  });

  it("keeps morphologically similar pairs closer than dissimilar pairs on average", () => {
    const close = averageGridDistanceForMorphologyThreshold(records, 1);
    const far = averageGridDistanceForMorphologyThreshold(records, 6);

    expect(close.matchedPairs).toBeGreaterThan(0);
    expect(far.matchedPairs).toBeGreaterThan(0);
    expect(close.averageGridDistance).toBeLessThan(far.averageGridDistance);
  });

  it("clusters Microcystis species near each other", () => {
    const placements = computeVisualIndexLayout(records);
    const microcystisSlugs = [
      "microcystis",
      "microcystis-aeruginosa",
      "microcystis-botrys",
      "microcystis-flos-aquae",
      "microcystis-wesenbergii",
    ];

    const distances: number[] = [];
    for (let i = 0; i < microcystisSlugs.length; i += 1) {
      for (let j = i + 1; j < microcystisSlugs.length; j += 1) {
        distances.push(gridDistance(placements, microcystisSlugs[i], microcystisSlugs[j]));
      }
    }

    const averageMicrocystisDistance =
      distances.reduce((sum, value) => sum + value, 0) / distances.length;

    const randomPairs = [
      ["gymnodinium", "aulacoseira-granulata"],
      ["euglena", "microcystis-aeruginosa"],
      ["bangia-atropurpurea", "chlamydomonas-sp"],
    ] as const;

    for (const [slugA, slugB] of randomPairs) {
      expect(averageMicrocystisDistance).toBeLessThan(gridDistance(placements, slugA, slugB));
    }
  });

  it("places filamentous species nearer than unrelated morphotypes", () => {
    const placements = computeVisualIndexLayout(records);
    const filamentDistance = gridDistance(placements, "aulacoseira-granulata", "mougeotia");
    const unrelatedDistance = gridDistance(placements, "aulacoseira-granulata", "gymnodinium");

    expect(filamentDistance).toBeLessThan(unrelatedDistance);
  });

  it("assigns zero morphology distance to identical profiles", () => {
    const profile = normalizeMorphology({
      organization: "colonial",
      color: "blue-green",
      cell_shape: "sphere",
      colony_shape: "spherical",
    });

    expect(morphologyDistance(profile, { ...profile })).toBe(0);
  });
});
