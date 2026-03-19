import { describe, expect, it, vi } from "vitest";

describe("publicAssetPath", () => {
  it("leaves paths unchanged when NEXT_PUBLIC_BASE_PATH is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const { publicAssetPath } = await import("../lib/public-path");
    expect(publicAssetPath("/algae-images/x.png")).toBe("/algae-images/x.png");
    vi.unstubAllEnvs();
  });

  it("prefixes repo path for GitHub Pages builds", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/kinneret-algae-atlas");
    vi.resetModules();
    const { publicAssetPath } = await import("../lib/public-path");
    expect(publicAssetPath("/algae-images/x.png")).toBe("/kinneret-algae-atlas/algae-images/x.png");
    vi.unstubAllEnvs();
  });
});
