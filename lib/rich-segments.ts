import type { RichSegment } from "./algae-types";

/** Slice rich runs by plain-text character offsets (aligned to joined segment text). */
export function sliceRichSegmentsByPlainRange(
  segments: RichSegment[],
  start: number,
  end: number
): RichSegment[] {
  const result: RichSegment[] = [];
  let pos = 0;
  for (const seg of segments) {
    const len = seg.text.length;
    const segEnd = pos + len;
    if (segEnd <= start) {
      pos = segEnd;
      continue;
    }
    if (pos >= end) break;
    const lo = Math.max(0, start - pos);
    const hi = Math.min(len, end - pos);
    if (lo < hi) {
      const chunk = seg.text.slice(lo, hi);
      if (chunk) {
        result.push({ text: chunk, italic: seg.italic, bold: seg.bold });
      }
    }
    pos = segEnd;
  }
  return result;
}
