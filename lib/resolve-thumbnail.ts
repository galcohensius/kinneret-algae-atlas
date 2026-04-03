import fs from "node:fs";
import path from "node:path";
import { publicAssetPath } from "./public-path";

/**
 * Optional square preview image per species, not from the Word figure stream.
 * Place under `public/algae-images/{slug}/`; first existing basename wins.
 */
export const THUMBNAIL_FILE_BASENAMES = [
  "thumbnail-1.png",
  "thumbnail-1.jpg",
  "thumbnail-1.jpeg",
  "thumbnail-1.webp",
  "thumbnail.png",
  "thumbnail.jpg",
  "thumbnail.jpeg",
  "thumbnail.webp",
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
