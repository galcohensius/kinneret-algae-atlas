/**
 * Prefix absolute public URLs when the app is hosted under a subpath
 * (e.g. GitHub Pages project sites: https://user.github.io/repo-name/).
 * Set NEXT_PUBLIC_BASE_PATH to "/your-repo-name" at build time. Omit for root hosting.
 */
export function publicAssetPath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
