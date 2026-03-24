/** Matches extractor output: `plate-1.png`, etc. (hero image in detail view). */
const PLATE_IMAGE_PATH_RE = /\/plate-\d+/i;

/**
 * Prefer the first `plate-*` asset as the main figure; otherwise keep document
 * order (first image = hero). Gallery order preserves remaining images.
 */
export function partitionPlateAndGalleryImages(
  images: string[],
  captions: string[]
): {
  plateImage: string | undefined;
  plateCaption: string | undefined;
  galleryImages: string[];
  galleryCaptions: string[];
} {
  if (images.length === 0) {
    return {
      plateImage: undefined,
      plateCaption: undefined,
      galleryImages: [],
      galleryCaptions: []
    };
  }
  const plateIdx = images.findIndex((p) => PLATE_IMAGE_PATH_RE.test(p));
  if (plateIdx < 0) {
    return {
      plateImage: images[0],
      plateCaption: captions[0],
      galleryImages: images.slice(1),
      galleryCaptions: captions.slice(1)
    };
  }
  return {
    plateImage: images[plateIdx],
    plateCaption: captions[plateIdx],
    galleryImages: [...images.slice(0, plateIdx), ...images.slice(plateIdx + 1)],
    galleryCaptions: [...captions.slice(0, plateIdx), ...captions.slice(plateIdx + 1)]
  };
}
