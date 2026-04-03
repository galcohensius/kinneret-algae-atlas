/** Site preview assets under `public/algae-images/{slug}/`, not Word figures. */
export function isThumbnailImagePath(src: string): boolean {
  return /\/thumbnail(?:-\d+)?\.(png|jpe?g|webp)$/i.test(src);
}
