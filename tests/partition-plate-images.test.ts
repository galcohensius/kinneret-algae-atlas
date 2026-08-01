import { describe, expect, it } from "vitest";
import {
  partitionEcologyAndLaterFigures,
  partitionPlateAndGalleryImages,
} from "../lib/partition-plate-images";

describe("partitionPlateAndGalleryImages", () => {
  it("keeps consecutive plates together before figures", () => {
    const images = [
      "/algae-images/x/thumbnail-1.jpg",
      "/algae-images/x/plate-1.png",
      "/algae-images/x/plate-2.png",
      "/algae-images/x/plate-3.png",
      "/algae-images/x/figure-1.png",
    ];
    const captions = ["", "P1", "P2", "P3", "F1"];
    const out = partitionPlateAndGalleryImages(images, captions);
    expect(out.plateFigures.map((p) => p.src)).toEqual([
      "/algae-images/x/plate-1.png",
      "/algae-images/x/plate-2.png",
      "/algae-images/x/plate-3.png",
    ]);
    expect(out.galleryImages).toEqual(["/algae-images/x/figure-1.png"]);
    expect(out.galleryCaptions).toEqual(["F1"]);
    expect(out.plateImage).toBe("/algae-images/x/plate-1.png");
  });

  it("puts images before the first plate only in the gallery", () => {
    const images = ["/a/stray.png", "/a/plate-1.png", "/a/plate-2.png"];
    const captions = ["S", "P1", "P2"];
    const out = partitionPlateAndGalleryImages(images, captions);
    expect(out.plateFigures).toHaveLength(2);
    expect(out.galleryImages).toEqual(["/a/stray.png"]);
    expect(out.galleryCaptions).toEqual(["S"]);
  });
});

describe("partitionEcologyAndLaterFigures", () => {
  it("puts figures 1–2 after ecology and 3+ later", () => {
    const out = partitionEcologyAndLaterFigures(
      [
        "/a/figure-1.png",
        "/a/figure-2.png",
        "/a/figure-3.png",
        "/a/figure-4.png",
        "/a/stray.png",
      ],
      ["F1", "F2", "F3", "F4", "S"],
      [undefined, undefined, undefined, undefined, undefined]
    );
    expect(out.ecologyFigures.map((f) => f.src)).toEqual([
      "/a/figure-1.png",
      "/a/figure-2.png",
    ]);
    expect(out.laterFigures.map((f) => f.src)).toEqual([
      "/a/figure-3.png",
      "/a/figure-4.png",
      "/a/stray.png",
    ]);
  });
});
