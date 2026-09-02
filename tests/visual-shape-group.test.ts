import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAlgaeRecords, type RawAlgaeRecord } from "../lib/algae";
import {
  classifyVisualShapeGroup,
  VISUAL_SHAPE_GROUP_ORDER,
} from "../lib/visual-shape-group";

function loadCatalogRecords() {
  const filePath = resolve(__dirname, "../data/processed/algae_records.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as RawAlgaeRecord[];
  return normalizeAlgaeRecords(raw);
}

describe("visual-shape-group", () => {
  const records = loadCatalogRecords();
  const bySlug = new Map(records.map((record) => [record.slug, record]));

  it("assigns the requested morphology clusters", () => {
    expect(classifyVisualShapeGroup(bySlug.get("mougeotia")!)).toBe("filamentous");
    expect(classifyVisualShapeGroup(bySlug.get("aulacoseira-granulata")!)).toBe("filamentous");
    expect(classifyVisualShapeGroup(bySlug.get("microcystis-aeruginosa")!)).toBe(
      "colonial_cyanobacteria"
    );
    expect(classifyVisualShapeGroup(bySlug.get("eudorina-elegans")!)).toBe("coenobial");
    expect(classifyVisualShapeGroup(bySlug.get("pandorina-morum")!)).toBe("coenobial");
    expect(classifyVisualShapeGroup(bySlug.get("gymnodinium")!)).toBe("large_flagellate");
    expect(classifyVisualShapeGroup(bySlug.get("cryptomonas")!)).toBe("large_flagellate");
    expect(classifyVisualShapeGroup(bySlug.get("euglena")!)).toBe("large_flagellate");
    expect(classifyVisualShapeGroup(bySlug.get("phacus-longicauda")!)).toBe("large_flagellate");
    expect(classifyVisualShapeGroup(bySlug.get("tetraselmis-cordiformis")!)).toBe(
      "large_flagellate"
    );
    expect(classifyVisualShapeGroup(bySlug.get("chrysochromulina-parva")!)).toBe(
      "small_single_cell"
    );
    expect(classifyVisualShapeGroup(bySlug.get("plagioselmis-nannoplanctica")!)).toBe(
      "small_single_cell"
    );
  });

  it("classifies every catalog species into a known group", () => {
    for (const record of records) {
      const group = classifyVisualShapeGroup(record);
      expect(VISUAL_SHAPE_GROUP_ORDER).toContain(group);
    }
  });
});
