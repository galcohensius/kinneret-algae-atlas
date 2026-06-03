import { publicAssetPath } from "./public-path";

export function glossaryEntryHref(slug: string): string {
  return `${publicAssetPath("/glossary/")}#${slug}`;
}
