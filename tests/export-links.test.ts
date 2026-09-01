/**
 * Link-and-asset checker over the static export (`out/`).
 *
 * Runs after `next build` (npm run test:export). In the default suite it
 * skips when no export exists, so `npm test` never requires a build; with
 * EXPORT_CHECK=1 a missing export is a failure instead of a skip.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { SITE_ORIGIN } from "../lib/site";

const OUT_DIR = path.join(process.cwd(), "out");
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const hasExport = existsSync(OUT_DIR);
const mustRun = process.env.EXPORT_CHECK === "1";

function collectHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

/** href/src plus social preview image targets. */
function extractTargets(html: string): string[] {
  const targets: string[] = [];
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    targets.push(match[1]);
  }
  for (const match of html.matchAll(
    /<meta[^>]+(?:property="og:image"|name="twitter:image")[^>]+content="([^"]+)"/g
  )) {
    targets.push(match[1]);
  }
  return targets;
}

function decode(target: string): string {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

/** Root-relative path of an internal target, or null for external/inline ones. */
function internalPath(target: string, fromDir: string): string | null {
  let t = target;
  if (t.startsWith(SITE_ORIGIN)) t = t.slice(SITE_ORIGIN.length) || "/";
  if (/^(https?:|mailto:|data:|tel:)/.test(t)) return null;
  t = t.split("#")[0].split("?")[0];
  if (!t) return null; // fragment-only, checked separately
  if (BASE_PATH && t.startsWith(BASE_PATH)) t = t.slice(BASE_PATH.length) || "/";
  if (t.startsWith("/")) return decode(t);
  return decode(path.posix.join("/", path.relative(OUT_DIR, fromDir), t));
}

function resolvesInExport(rootRelative: string): boolean {
  const base = path.join(OUT_DIR, rootRelative);
  if (rootRelative.endsWith("/")) return existsSync(path.join(base, "index.html"));
  if (existsSync(base) && statSync(base).isFile()) return true;
  return existsSync(path.join(base, "index.html"));
}

(hasExport || mustRun ? describe : describe.skip)("static export links", () => {
  it("export exists", () => {
    expect(hasExport, "out/ missing; run `npm run build` first").toBe(true);
  });

  const htmlFiles = hasExport ? collectHtmlFiles(OUT_DIR) : [];

  it("finds pages to check", () => {
    expect(htmlFiles.length).toBeGreaterThan(40);
  });

  it("every internal link and asset resolves", () => {
    const failures: string[] = [];
    for (const file of htmlFiles) {
      const page = path.relative(OUT_DIR, file);
      const html = readFileSync(file, "utf8");
      for (const target of new Set(extractTargets(html))) {
        const resolved = internalPath(target, path.dirname(file));
        if (resolved === null) continue;
        if (!resolvesInExport(resolved)) {
          failures.push(`${page} -> ${target}`);
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("fragment links point at existing ids", () => {
    const idsByDoc = new Map<string, Set<string>>();
    const docIds = (file: string): Set<string> => {
      let ids = idsByDoc.get(file);
      if (!ids) {
        ids = new Set(
          [...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) =>
            decode(m[1])
          )
        );
        idsByDoc.set(file, ids);
      }
      return ids;
    };

    const failures: string[] = [];
    for (const file of htmlFiles) {
      const page = path.relative(OUT_DIR, file);
      const html = readFileSync(file, "utf8");
      for (const target of new Set(extractTargets(html))) {
        const hash = target.includes("#") ? target.split("#")[1] : "";
        if (!hash) continue;
        const withoutOrigin = target.startsWith(SITE_ORIGIN)
          ? target.slice(SITE_ORIGIN.length)
          : target;
        if (/^(https?:|mailto:|data:|tel:)/.test(withoutOrigin)) continue;
        let docFile = file;
        const resolved = internalPath(target, path.dirname(file));
        if (resolved !== null) {
          if (!resolvesInExport(resolved)) continue; // reported by the link check
          const base = path.join(OUT_DIR, resolved);
          docFile =
            existsSync(base) && statSync(base).isFile()
              ? base
              : path.join(base, "index.html");
        }
        if (!docIds(docFile).has(decode(hash))) {
          failures.push(`${page} -> ${target}`);
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
