import fs from "node:fs";
import path from "node:path";
import { publicAssetPath } from "./public-path";

/**
 * Home algae index cards only: the extractor saves the first image per taxon as `thumbnail-1.*`
 * under `public/algae-images/{slug}/` (after the header and any previous-name lines).
 * First existing basename wins for manual overrides.
 */
export const THUMBNAIL_FILE_BASENAMES = [
  "thumbnail-1.png",
  "thumbnail-1.jpg",
  "thumbnail-1.jpeg",
  "thumbnail-1.webp",
  "thumbnail-1.tif",
  "thumbnail-1.tiff",
  "thumbnail.png",
  "thumbnail.jpg",
  "thumbnail.jpeg",
  "thumbnail.webp",
  "thumbnail.tif",
  "thumbnail.tiff",
] as const;

export function resolveThumbnailUrl(slug: string): string | null {
  const dir = path.join(process.cwd(), "public", "algae-images", slug);
  for (const name of THUMBNAIL_FILE_BASENAMES) {
    if (fs.existsSync(path.join(dir, name))) {
      return publicAssetPath(`/algae-images/${slug}/${name}`);
    }
  }
  return null;
}
