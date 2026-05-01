import type { RichSegment } from "./algae-types";
import { isThumbnailImagePath } from "./thumbnail-path-pattern";

/** Matches extractor output: `plate-1.png`, etc. (hero image in detail view). */
const PLATE_IMAGE_PATH_RE = /\/plate-\d+/i;

function dropThumbnailPaths(
  images: string[],
  captions: string[],
  captionsRich: RichSegment[][] | undefined
): { images: string[]; captions: string[]; captionsRich: RichSegment[][] | undefined } {
  const keep: number[] = [];
  for (let i = 0; i < images.length; i++) {
    if (!isThumbnailImagePath(images[i]!)) keep.push(i);
  }
  if (keep.length === images.length) {
    return { images, captions, captionsRich };
  }
  return {
    images: keep.map((i) => images[i]!),
    captions: keep.map((i) => captions[i] ?? ""),
    captionsRich:
      captionsRich !== undefined
        ? keep.map((i) => captionsRich[i] ?? [])
        : undefined,
  };
}

export type PlateFigureSlot = {
  src: string;
  caption: string;
  captionRich: RichSegment[] | undefined;
};

function isPlatePath(src: string): boolean {
  return PLATE_IMAGE_PATH_RE.test(src);
}

/**
 * Prefer the first `plate-*` asset as the hero figure; include every consecutive
 * `plate-*` after it (Plates 1–n from Word stay together). Remaining assets —
 * figures, stray images before the first plate — go to the gallery block.
 * Paths matching `thumbnail-*.png` (site previews) are ignored here.
 */
export function partitionPlateAndGalleryImages(
  images: string[],
  captions: string[],
  captionsRich?: RichSegment[][]
): {
  plateImage: string | undefined;
  plateCaption: string | undefined;
  plateCaptionRich: RichSegment[] | undefined;
  plateFigures: PlateFigureSlot[];
  galleryImages: string[];
  galleryCaptions: string[];
  galleryCaptionsRich: (RichSegment[] | undefined)[];
} {
  const richAt = (i: number) =>
    captionsRich && i >= 0 && i < captionsRich.length && captionsRich[i]?.length
      ? captionsRich[i]
      : undefined;

  const dropped = dropThumbnailPaths(images, captions, captionsRich);
  images = dropped.images;
  captions = dropped.captions;
  captionsRich = dropped.captionsRich;

  if (images.length === 0) {
    return {
      plateImage: undefined,
      plateCaption: undefined,
      plateCaptionRich: undefined,
      plateFigures: [],
      galleryImages: [],
      galleryCaptions: [],
      galleryCaptionsRich: [],
    };
  }
  const plateIdx = images.findIndex((p) => isPlatePath(p));
  if (plateIdx < 0) {
    return {
      plateImage: images[0],
      plateCaption: captions[0],
      plateCaptionRich: richAt(0),
      plateFigures: [
        {
          src: images[0]!,
          caption: captions[0] ?? "",
          captionRich: richAt(0),
        },
      ],
      galleryImages: images.slice(1),
      galleryCaptions: captions.slice(1),
      galleryCaptionsRich: images.slice(1).map((_, j) => richAt(j + 1)),
    };
  }

  let runEnd = plateIdx;
  while (runEnd + 1 < images.length && isPlatePath(images[runEnd + 1]!)) {
    runEnd += 1;
  }

  const plateFigures: PlateFigureSlot[] = [];
  for (let i = plateIdx; i <= runEnd; i++) {
    plateFigures.push({
      src: images[i]!,
      caption: captions[i] ?? "",
      captionRich: richAt(i),
    });
  }

  const galleryImages = [...images.slice(0, plateIdx), ...images.slice(runEnd + 1)];
  const galleryCaptions = [...captions.slice(0, plateIdx), ...captions.slice(runEnd + 1)];
  const galleryCaptionsRich = galleryImages.map((_, j) => {
    const origIdx = j < plateIdx ? j : j + (runEnd - plateIdx + 1);
    return richAt(origIdx);
  });

  const firstPlate = plateFigures[0]!;
  return {
    plateImage: firstPlate.src,
    plateCaption: firstPlate.caption,
    plateCaptionRich: firstPlate.captionRich,
    plateFigures,
    galleryImages,
    galleryCaptions,
    galleryCaptionsRich,
  };
}
