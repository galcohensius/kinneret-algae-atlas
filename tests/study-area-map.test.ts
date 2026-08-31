import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("study-area-map.svg", () => {
  it("is valid UTF-8 XML (invalid encoding breaks img rendering in browsers)", () => {
    const svgPath = resolve(__dirname, "../public/study-area-map.svg");
    const bytes = readFileSync(svgPath);
    const text = bytes.toString("utf-8");
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain("32.833&#176; N");
    expect(bytes.includes(0xb0)).toBe(false);
  });
});
