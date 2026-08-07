import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relPath: string): string {
  return readFileSync(path.join(process.cwd(), relPath), "utf8");
}

describe("schema JSON-LD presence", () => {
  it("homepage includes application/ld+json script", () => {
    const src = read("app/page.tsx");
    expect(src).toContain("application/ld+json");
    expect(src).toContain('"@type": "Dataset"');
  });

  it("species detail page includes DefinedTerm JSON-LD", () => {
    const src = read("app/algae/[slug]/page.tsx");
    expect(src).toContain("application/ld+json");
    expect(src).toContain('"@type": "DefinedTerm"');
  });

  it("glossary page includes DefinedTermSet JSON-LD", () => {
    const src = read("app/glossary/page.tsx");
    expect(src).toContain("application/ld+json");
    expect(src).toContain('"@type": "DefinedTermSet"');
  });

  it("about page includes AboutPage JSON-LD", () => {
    const src = read("app/about/page.tsx");
    expect(src).toContain("application/ld+json");
    expect(src).toContain('"@type": "AboutPage"');
  });
});

describe("crawler discovery files", () => {
  it("defines sitemap and robots routes", () => {
    expect(read("app/sitemap.ts")).toContain("kinneret-algae-atlas.org");
    expect(read("app/robots.ts")).toContain("sitemap.xml");
  });
});
