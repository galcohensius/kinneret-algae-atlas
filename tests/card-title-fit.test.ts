import { describe, expect, it } from "vitest";
import { getAllAlgae } from "../lib/algae";
import { getAllSupplements } from "../lib/supplements";

type TitleCase = {
  label: string;
  title: string;
  kind: "algae" | "supplement";
};

/**
 * Conservative text-fit guard for index cards.
 *
 * This is not a pixel-perfect browser rendering test. It protects the current
 * card design by estimating whether titles fit within a small number of lines
 * at the narrowest supported card width. If font size, card width, thumbnail
 * size, or title data changes enough to risk ugly wrapping, this test fails.
 */
function estimatedLines(title: string, availableWidthPx: number, fontSizePx: number): number {
  const avgGlyphWidthPx = fontSizePx * 0.56;
  const charsPerLine = Math.floor(availableWidthPx / avgGlyphWidthPx);
  const words = title.split(/\s+/).filter(Boolean);
  let lines = 1;
  let current = 0;

  for (const word of words) {
    const next = current === 0 ? word.length : current + 1 + word.length;
    if (next <= charsPerLine) {
      current = next;
      continue;
    }
    lines += 1;
    current = word.length;
  }

  return lines;
}

describe("index card title sizing", () => {
  it("keeps algae and supplement titles within readable line counts", async () => {
    const algae = await getAllAlgae();
    const supplements = await getAllSupplements();
    const titles: TitleCase[] = [
      ...algae.map((record) => ({
        label: record.slug,
        title: record.scientificName,
        kind: "algae" as const,
      })),
      ...supplements.map((record) => ({
        label: record.slug,
        title: record.title,
        kind: "supplement" as const,
      })),
    ];

    const cardMinWidthPx = 360;
    const cardPaddingPx = 32;
    const thumbnailWidthPx = 100;
    const cardGapPx = 12;
    const titleWidthPx = cardMinWidthPx - cardPaddingPx - thumbnailWidthPx - cardGapPx;

    const failures = titles.flatMap((item) => {
      const mobileLines = estimatedLines(item.title, titleWidthPx, 23.2); // 1.45rem
      const desktopLines = estimatedLines(item.title, titleWidthPx, 26.4); // 1.65rem
      const maxLines = 4;
      return Math.max(mobileLines, desktopLines) <= maxLines
        ? []
        : [`${item.label}: ${item.title} (${mobileLines}/${desktopLines} lines)`];
    });

    expect(failures).toEqual([]);
  });
});
