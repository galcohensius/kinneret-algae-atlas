import type { Metadata } from "next";

export const SITE_ORIGIN = "https://kinneret-algae-atlas.org";
export const SITE_NAME = "Kinneret Algae Atlas";

/** Site-wide fallback social preview image. */
const DEFAULT_PREVIEW_IMAGE = "/kinneret-lake.jpg";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * OpenGraph + Twitter-card blocks shared by all pages.
 * `image` is a root-relative public path; `largeImage: false` requests the
 * small square card (for thumbnail-only species records).
 */
export function socialPreviewMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  largeImage?: boolean;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      url: absoluteUrl(opts.path),
      images: [absoluteUrl(opts.image ?? DEFAULT_PREVIEW_IMAGE)],
    },
    twitter: {
      card: (opts.largeImage ?? true) ? "summary_large_image" : "summary",
    },
  };
}
