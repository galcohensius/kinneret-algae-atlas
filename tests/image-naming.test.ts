import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const VALID_IMAGE_PATTERN = /\/(thumbnail|plate|figure)-\d+\.[a-z]+$/;
const FALLBACK_IMAGE_PATTERN = /\/image-\d+\.[a-z]+$/;

interface RawRecord {
  scientific_name: string;
  images?: string[];
}

function loadRecords(): RawRecord[] {
  const filePath = resolve(__dirname, "../data/processed/algae_records.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as RawRecord[];
}

describe("algae image naming", () => {
  it("reports total image count across all species", () => {
    const records = loadRecords();
    const total = records.reduce((sum, r) => sum + (r.images?.length ?? 0), 0);
    const bySpecies = records
      .filter((r) => (r.images?.length ?? 0) > 0)
      .map((r) => `  ${r.scientific_name}: ${r.images!.length}`)
      .join("\n");
    console.log(`\nTotal images: ${total} across ${records.length} species\n${bySpecies}`);
    expect(total).toBeGreaterThan(0);
  });

  it("every image is a thumbnail, plate, or figure — no uncaptioned image-N fallbacks", () => {
    const records = loadRecords();
    const violations: { species: string; image: string }[] = [];

    for (const record of records) {
      for (const image of record.images ?? []) {
        if (FALLBACK_IMAGE_PATTERN.test(image)) {
          violations.push({ species: record.scientific_name, image });
        }
      }
    }

    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.species}: ${v.image}`)
        .join("\n");
      expect.fail(
        `${violations.length} image(s) have fallback 'image-N' names — ` +
          `fix the caption in the Word file and re-extract:\n${detail}`
      );
    }
  });

  it("every image path matches a known naming convention", () => {
    const records = loadRecords();
    const unknown: { species: string; image: string }[] = [];

    for (const record of records) {
      for (const image of record.images ?? []) {
        if (!VALID_IMAGE_PATTERN.test(image)) {
          unknown.push({ species: record.scientific_name, image });
        }
      }
    }

    if (unknown.length > 0) {
      const detail = unknown
        .map((v) => `  ${v.species}: ${v.image}`)
        .join("\n");
      expect.fail(
        `${unknown.length} image(s) have unrecognised names (expected thumbnail-N, plate-N, or figure-N):\n${detail}`
      );
    }
  });
});
