import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAlgaeRecords, type RawAlgaeRecord } from "../lib/algae";
import {
  buildVisualIndexSections,
  SHAPE_GROUP_MAX_COLS,
  type VisualIndexSection,
} from "../lib/visual-index-layout";
import { VISUAL_SHAPE_GROUP_ORDER } from "../lib/visual-shape-group";

function loadCatalogRecords() {
  const filePath = resolve(__dirname, "../data/processed/algae_records.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as RawAlgaeRecord[];
  return normalizeAlgaeRecords(raw);
}

function sectionColumnCount(section: VisualIndexSection): number {
  return Math.max(...section.cells.map((cell) => cell.col)) + 1;
}

function sectionRowCounts(section: VisualIndexSection): number[] {
  const counts = new Map<number, number>();
  for (const cell of section.cells) {
    counts.set(cell.row, (counts.get(cell.row) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, count]) => count);
}

function expectedRowCounts(count: number, cols: number): number[] {
  const fullRows = Math.floor(count / cols);
  const remainder = count % cols;
  const rows = Array.from({ length: fullRows }, () => cols);
  if (remainder > 0) rows.push(remainder);
  return rows;
}

describe("visual-index-layout", () => {
  const records = loadCatalogRecords();

  it("places every species exactly once, in shape groups in catalog order", () => {
    const sections = buildVisualIndexSections(records);
    const slugs = sections.flatMap((section) => section.cells.map((cell) => cell.slug));
    expect(slugs.sort()).toEqual(records.map((record) => record.slug).sort());

    const groupPositions = sections.map((section) => VISUAL_SHAPE_GROUP_ORDER.indexOf(section.group));
    expect(groupPositions).toEqual([...groupPositions].sort((a, b) => a - b));
    expect(new Set(groupPositions).size).toBe(groupPositions.length);
  });

  it("uses a shared 5-column cap for every large morphotype group", () => {
    const sections = buildVisualIndexSections(records);
    expect(sections.length).toBeGreaterThan(0);

    for (const section of sections) {
      const cols = Math.min(section.cells.length, SHAPE_GROUP_MAX_COLS);
      expect(sectionColumnCount(section)).toBe(cols);
      expect(sectionRowCounts(section)).toEqual(expectedRowCounts(section.cells.length, cols));
    }
  });
});
