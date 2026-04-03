/**
 * Derive display metadata from extractor filenames (`plate-1.png`, `figure-2.png`, …).
 */

const PLATE_PATH_RE = /\/plate-(\d+)/i;
const FIGURE_PATH_RE = /\/figure-(\d+)/i;
const IMAGE_PATH_RE = /\/image-(\d+)/i;

export type GalleryImageKind = "plate" | "figure" | "image";

export function galleryImageKindFromPath(src: string): GalleryImageKind {
  if (PLATE_PATH_RE.test(src)) return "plate";
  if (FIGURE_PATH_RE.test(src)) return "figure";
  return "image";
}

/** Short label for UI, e.g. "Plate 2", "Figure 1". */
export function gallerySequenceLabel(src: string, galleryIndex: number): string {
  const plate = src.match(PLATE_PATH_RE);
  if (plate) return `Plate ${plate[1]}`;
  const fig = src.match(FIGURE_PATH_RE);
  if (fig) return `Figure ${fig[1]}`;
  const img = src.match(IMAGE_PATH_RE);
  if (img) return `Image ${img[1]}`;
  return `Image ${galleryIndex + 1}`;
}

export function galleryImageAlt(recordTitle: string, src: string, galleryIndex: number): string {
  const plate = src.match(PLATE_PATH_RE);
  if (plate) return `${recordTitle} — plate ${plate[1]} (from source)`;
  const fig = src.match(FIGURE_PATH_RE);
  if (fig) return `${recordTitle} — figure ${fig[1]} (from source)`;
  const img = src.match(IMAGE_PATH_RE);
  if (img) return `${recordTitle} — image ${img[1]} (from source)`;
  return `${recordTitle} — image ${galleryIndex + 1} (from source)`;
}

export function galleryEnlargeAriaLabel(src: string, galleryIndex: number): string {
  const plate = src.match(PLATE_PATH_RE);
  if (plate) return `Enlarge plate ${plate[1]}`;
  const fig = src.match(FIGURE_PATH_RE);
  if (fig) return `Enlarge figure ${fig[1]}`;
  const img = src.match(IMAGE_PATH_RE);
  if (img) return `Enlarge image ${img[1]}`;
  return `Enlarge image ${galleryIndex + 1}`;
}

/** Section heading for images after the hero plate (or hero first image). */
export function additionalGallerySectionTitle(gallerySrcs: string[]): string {
  let hasPlate = false;
  let hasNonPlate = false;
  for (const s of gallerySrcs) {
    if (galleryImageKindFromPath(s) === "plate") hasPlate = true;
    else hasNonPlate = true;
  }
  if (hasPlate && hasNonPlate) return "Additional plates and figures";
  if (hasPlate) return "Additional plates";
  return "Additional figures";
}
