import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAlgaeRecords, type RawAlgaeRecord } from "../lib/algae";
import {
  averageGridDistanceForMorphologyThreshold,
  computeVisualIndexLayout,
  morphologyDistance,
} from "../lib/visual-index-layout";
import { classifyVisualShapeGroup } from "../lib/visual-shape-group";
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

  it("keeps same-shape-group pairs closer than cross-group pairs on average", () => {
    const placements = computeVisualIndexLayout(records);
    const placementBySlug = new Map(placements.map((p) => [p.slug, p]));

    let sameGroupPairs = 0;
    let sameGroupDistance = 0;
    let crossGroupPairs = 0;
    let crossGroupDistance = 0;

    for (let i = 0; i < records.length; i += 1) {
      for (let j = i + 1; j < records.length; j += 1) {
        const a = placementBySlug.get(records[i].slug);
        const b = placementBySlug.get(records[j].slug);
        if (!a || !b) continue;

        const distance = gridDistance(placements, records[i].slug, records[j].slug);
        const sameGroup =
          classifyVisualShapeGroup(records[i]) === classifyVisualShapeGroup(records[j]);

        if (sameGroup) {
          sameGroupPairs += 1;
          sameGroupDistance += distance;
        } else {
          crossGroupPairs += 1;
          crossGroupDistance += distance;
        }
      }
    }

    expect(sameGroupPairs).toBeGreaterThan(0);
    expect(crossGroupPairs).toBeGreaterThan(0);
    expect(sameGroupDistance / sameGroupPairs).toBeLessThan(
      crossGroupDistance / crossGroupPairs
    );
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

  it("clusters coenobial species nearer than unrelated morphotypes", () => {
    const placements = computeVisualIndexLayout(records);
    const coenobialDistance = gridDistance(placements, "eudorina-elegans", "pandorina-morum");
    const unrelatedDistance = gridDistance(placements, "eudorina-elegans", "gymnodinium");

    expect(coenobialDistance).toBeLessThan(unrelatedDistance);
  });

  it("clusters small single-cell species nearer than large flagellates", () => {
    const placements = computeVisualIndexLayout(records);
    const smallDistance = gridDistance(
      placements,
      "chrysochromulina-parva",
      "plagioselmis-nannoplanctica"
    );
    const unrelatedDistance = gridDistance(
      placements,
      "chrysochromulina-parva",
      "gymnodinium"
    );

    expect(smallDistance).toBeLessThan(unrelatedDistance);
  });

  it("keeps small shape groups on one row", () => {
    const placements = computeVisualIndexLayout(records);
    const filamentSlugs = ["aulacoseira-granulata", "bangia-atropurpurea", "mougeotia"];
    const rows = new Set(
      filamentSlugs.map((slug) => placements.find((p) => p.slug === slug)?.row)
    );
    expect(rows.size).toBe(1);
  });

  it("separates shape groups on the grid vertically", () => {
    const placements = computeVisualIndexLayout(records);
    const placementBySlug = new Map(placements.map((p) => [p.slug, p]));
    const filament = placementBySlug.get("mougeotia")!;
    const colonial = placementBySlug.get("microcystis-aeruginosa")!;
    const large = placementBySlug.get("gymnodinium")!;
    const small = placementBySlug.get("chrysochromulina-parva")!;

    expect(filament.row).toBeLessThan(colonial.row);
    expect(colonial.row).toBeLessThan(large.row);
    expect(large.row).toBeLessThan(small.row);
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
