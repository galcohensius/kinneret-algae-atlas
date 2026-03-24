import type { RichSegment } from "./algae-types";

/** Matches extractor output: `plate-1.png`, etc. (hero image in detail view). */
const PLATE_IMAGE_PATH_RE = /\/plate-\d+/i;

/**
 * Prefer the first `plate-*` asset as the main figure; otherwise keep document
 * order (first image = hero). Gallery order preserves remaining images.
 */
export function partitionPlateAndGalleryImages(
  images: string[],
  captions: string[],
  captionsRich?: RichSegment[][]
): {
  plateImage: string | undefined;
  plateCaption: string | undefined;
  plateCaptionRich: RichSegment[] | undefined;
  galleryImages: string[];
  galleryCaptions: string[];
  galleryCaptionsRich: (RichSegment[] | undefined)[];
} {
  const richAt = (i: number) =>
    captionsRich && i >= 0 && i < captionsRich.length && captionsRich[i]?.length
      ? captionsRich[i]
      : undefined;

  if (images.length === 0) {
    return {
      plateImage: undefined,
      plateCaption: undefined,
      plateCaptionRich: undefined,
      galleryImages: [],
      galleryCaptions: [],
      galleryCaptionsRich: [],
    };
  }
  const plateIdx = images.findIndex((p) => PLATE_IMAGE_PATH_RE.test(p));
  if (plateIdx < 0) {
    return {
      plateImage: images[0],
      plateCaption: captions[0],
      plateCaptionRich: richAt(0),
      galleryImages: images.slice(1),
      galleryCaptions: captions.slice(1),
      galleryCaptionsRich: images.slice(1).map((_, j) => richAt(j + 1)),
    };
  }
  const galleryImages = [...images.slice(0, plateIdx), ...images.slice(plateIdx + 1)];
  const galleryCaptions = [
    ...captions.slice(0, plateIdx),
    ...captions.slice(plateIdx + 1),
  ];
  const galleryCaptionsRich = galleryImages.map((_, j) => {
    const origIdx = j < plateIdx ? j : j + 1;
    return richAt(origIdx);
  });
  return {
    plateImage: images[plateIdx],
    plateCaption: captions[plateIdx],
    plateCaptionRich: richAt(plateIdx),
    galleryImages,
    galleryCaptions,
    galleryCaptionsRich,
  };
}
