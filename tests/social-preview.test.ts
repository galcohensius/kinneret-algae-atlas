import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl, socialPreviewMetadata } from "../lib/site";

function read(relPath: string): string {
  return readFileSync(path.join(process.cwd(), relPath), "utf8");
}

describe("socialPreviewMetadata", () => {
  it("builds absolute OpenGraph url and image", () => {
    const meta = socialPreviewMetadata({
      title: "Test",
      description: "Desc",
      path: "/algae/foo/",
      image: "/algae-images/foo/plate.jpg",
    });
    expect(meta.openGraph?.url).toBe("https://kinneret-algae-atlas.org/algae/foo/");
    expect(meta.openGraph?.images).toEqual([
      "https://kinneret-algae-atlas.org/algae-images/foo/plate.jpg",
    ]);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to the site image and small card", () => {
    const meta = socialPreviewMetadata({
      title: "Test",
      description: "Desc",
      path: "/",
      largeImage: false,
    });
    expect(meta.openGraph?.images).toEqual([
      "https://kinneret-algae-atlas.org/kinneret-lake.jpg",
    ]);
    expect(meta.twitter).toMatchObject({ card: "summary" });
  });

  it("absoluteUrl leaves full URLs untouched", () => {
    expect(absoluteUrl("https://example.org/x")).toBe("https://example.org/x");
    expect(absoluteUrl("no-slash")).toBe("https://kinneret-algae-atlas.org/no-slash");
  });
});

describe("pages declare social preview metadata", () => {
  const pages = [
    "app/page.tsx",
    "app/algae/[slug]/page.tsx",
    "app/glossary/page.tsx",
    "app/supplements/page.tsx",
    "app/visual-index/page.tsx",
    "app/about/page.tsx",
  ];

  for (const page of pages) {
    it(`${page} spreads socialPreviewMetadata`, () => {
      expect(read(page)).toContain("...socialPreviewMetadata(");
    });
  }
});
