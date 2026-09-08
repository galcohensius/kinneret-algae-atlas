import { readFileSync } from "node:fs";
import path from "node:path";

export type ImageDimensions = { width: number; height: number };

/** Intrinsic size from a PNG or JPEG header; null for anything else or on any read error. */
export function parseImageDimensions(buf: Buffer): ImageDimensions | null {
  // PNG: 8-byte signature, then the IHDR chunk with width and height as big-endian u32.
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47 && buf.toString("ascii", 12, 16) === "IHDR") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: walk the marker segments to the first start-of-frame (SOF0..SOF15, excluding DHT/JPG/DAC).
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 <= buf.length) {
      if (buf[offset] !== 0xff) return null;
      const marker = buf[offset + 1];
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) {
        offset += marker === 0xff ? 1 : 2;
        continue;
      }
      const length = buf.readUInt16BE(offset + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

const cache = new Map<string, ImageDimensions | null>();

/**
 * Dimensions of a root-relative public asset (e.g. `/algae-images/x/plate-1.jpg`), read
 * from `public/` at build time so `<img>` tags can reserve their box and avoid layout shift.
 */
export function publicImageDimensions(src: string): ImageDimensions | null {
  const cached = cache.get(src);
  if (cached !== undefined) return cached;
  let result: ImageDimensions | null = null;
  try {
    const file = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
    result = parseImageDimensions(readFileSync(file));
  } catch {
    result = null;
  }
  cache.set(src, result);
  return result;
}
