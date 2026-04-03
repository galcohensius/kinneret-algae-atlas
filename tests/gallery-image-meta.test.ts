import { describe, expect, it } from "vitest";
import {
  additionalGallerySectionTitle,
  galleryEnlargeAriaLabel,
  galleryImageAlt,
  galleryImageKindFromPath,
  gallerySequenceLabel,
} from "../lib/gallery-image-meta";

describe("galleryImageKindFromPath", () => {
  it("classifies extractor-style paths", () => {
    expect(galleryImageKindFromPath("/algae-images/x/plate-2.png")).toBe("plate");
    expect(galleryImageKindFromPath("/prefix/figure-1.tif")).toBe("figure");
    expect(galleryImageKindFromPath("/a/image-3.jpg")).toBe("image");
  });
});

describe("galleryImageAlt", () => {
  it("uses plate / figure / image numbers from the filename", () => {
    expect(galleryImageAlt("Durinskia oculata", "/p/plate-2.png", 0)).toContain("plate 2");
    expect(galleryImageAlt("Sp.", "/p/figure-1.png", 0)).toContain("figure 1");
    expect(galleryImageAlt("Sp.", "/p/image-1.tif", 0)).toContain("image 1");
  });
});

describe("additionalGallerySectionTitle", () => {
  it("matches gallery composition", () => {
    expect(additionalGallerySectionTitle(["/a/plate-2.png"])).toBe("Additional plates");
    expect(additionalGallerySectionTitle(["/a/figure-1.png"])).toBe("Additional figures");
    expect(additionalGallerySectionTitle(["/a/plate-2.png", "/a/image-1.tif"])).toBe(
      "Additional plates and figures"
    );
  });
});

describe("gallerySequenceLabel / galleryEnlargeAriaLabel", () => {
  it("prefer filename indices", () => {
    expect(gallerySequenceLabel("/x/plate-2.png", 0)).toBe("Plate 2");
    expect(galleryEnlargeAriaLabel("/x/plate-2.png", 0)).toBe("Enlarge plate 2");
  });
});
