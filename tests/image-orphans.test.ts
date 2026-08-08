import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const IMAGE_DIRS = ["algae-images", "glossary-images"];
const IMAGE_REF_PREFIXES = IMAGE_DIRS.map((d) => `/${d}/`);

const DATA_FILES = [
  "data/processed/algae_records.json",
  "data/processed/supplements.json",
  "data/processed/glossary.json",
];

/** Recursively collect every string that points at a bundled image asset. */
function collectImageRefs(value: unknown, sink: Set<string>): void {
  if (typeof value === "string") {
    if (IMAGE_REF_PREFIXES.some((p) => value.startsWith(p))) {
      sink.add(value);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectImageRefs(item, sink);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectImageRefs(item, sink);
  }
}

function referencedImages(): Set<string> {
  const refs = new Set<string>();
  for (const rel of DATA_FILES) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    collectImageRefs(JSON.parse(readFileSync(path, "utf-8")), refs);
  }
  return refs;
}

/** Every image file on disk, as a public-root-relative URL (e.g. /algae-images/x/plate-1.png). */
function imagesOnDisk(): Set<string> {
  const files = new Set<string>();
  for (const dir of IMAGE_DIRS) {
    const base = join(PUBLIC_DIR, dir);
    if (!existsSync(base)) continue;
    const walk = (abs: string) => {
      for (const entry of readdirSync(abs)) {
        const child = join(abs, entry);
        if (statSync(child).isDirectory()) {
          walk(child);
        } else {
          const rel = child.slice(PUBLIC_DIR.length).split("\\").join("/");
          files.add(rel);
        }
      }
    };
    walk(base);
  }
  return files;
}

describe("image assets have no dead files", () => {
  const refs = referencedImages();
  const disk = imagesOnDisk();

  it("every image on disk is referenced by a record, supplement, or glossary entry", () => {
    const orphans = [...disk].filter((f) => !refs.has(f)).sort();
    if (orphans.length > 0) {
      expect.fail(
        `${orphans.length} orphaned image file(s) on disk are not referenced anywhere ` +
          `(delete them or re-extract):\n${orphans.map((o) => `  ${o}`).join("\n")}`
      );
    }
  });

  it("every referenced image exists on disk", () => {
    const missing = [...refs].filter((f) => !disk.has(f)).sort();
    if (missing.length > 0) {
      expect.fail(
        `${missing.length} referenced image(s) are missing from disk ` +
          `(broken links):\n${missing.map((m) => `  ${m}`).join("\n")}`
      );
    }
  });
});
