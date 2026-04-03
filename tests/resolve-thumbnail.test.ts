import { describe, expect, it } from "vitest";
import { isThumbnailImagePath } from "../lib/thumbnail-path-pattern";

describe("isThumbnailImagePath", () => {
  it("matches site thumbnail filenames", () => {
    expect(isThumbnailImagePath("/algae-images/x/thumbnail-1.png")).toBe(true);
    expect(isThumbnailImagePath("/p/thumbnail-2.JPEG")).toBe(true);
    expect(isThumbnailImagePath("/p/thumbnail.webp")).toBe(true);
    expect(isThumbnailImagePath("/p/thumbnail-1.TIF")).toBe(true);
  });

  it("does not match plates or figures", () => {
    expect(isThumbnailImagePath("/algae-images/x/plate-1.png")).toBe(false);
    expect(isThumbnailImagePath("/algae-images/x/figure-1.png")).toBe(false);
    expect(isThumbnailImagePath("/algae-images/x/image-1.png")).toBe(false);
  });
});
