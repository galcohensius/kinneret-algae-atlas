import { describe, expect, it } from "vitest";
import { normalizeColor } from "../lib/morphology-normalize";

describe("morphology-normalize", () => {
  it("maps color text to stable buckets", () => {
    expect(normalizeColor("yellow to golden-brown")).toBe("golden_brown");
    expect(normalizeColor("blue-green")).toBe("blue_green");
    expect(normalizeColor("grass green")).toBe("green");
    expect(normalizeColor("dark red-brown")).toBe("red");
    expect(normalizeColor("brown")).toBe("brown");
  });
});
