import { describe, expect, it } from "vitest";
import { parseImageDimensions, publicImageDimensions } from "../lib/image-dimensions";

function pngHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  buf.writeUInt32BE(0x89504e47, 0);
  buf.writeUInt32BE(0x0d0a1a0a, 4);
  buf.writeUInt32BE(13, 8);
  buf.write("IHDR", 12, "ascii");
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function jpegHeader(width: number, height: number): Buffer {
  // SOI, an APP0 segment to skip, then SOF0 with precision/height/width.
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46]);
  const sof0 = Buffer.alloc(9);
  sof0[0] = 0xff;
  sof0[1] = 0xc0;
  sof0.writeUInt16BE(11, 2);
  sof0[4] = 8;
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof0, Buffer.alloc(4)]);
}

describe("parseImageDimensions", () => {
  it("reads PNG IHDR", () => {
    expect(parseImageDimensions(pngHeader(640, 480))).toEqual({ width: 640, height: 480 });
  });

  it("reads JPEG SOF0 past an APP segment", () => {
    expect(parseImageDimensions(jpegHeader(1024, 768))).toEqual({ width: 1024, height: 768 });
  });

  it("returns null for unknown data", () => {
    expect(parseImageDimensions(Buffer.from("not an image"))).toBeNull();
  });
});

describe("publicImageDimensions", () => {
  it("returns null for a missing file", () => {
    expect(publicImageDimensions("/does-not-exist.png")).toBeNull();
  });

  it("reads a shipped asset", () => {
    const dims = publicImageDimensions("/kinneret-lake.jpg");
    expect(dims).not.toBeNull();
    expect(dims!.width).toBeGreaterThan(0);
  });
});
