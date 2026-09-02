import { describe, expect, it } from "vitest";
import { formatPhylumLabel, PHYLUM_POPULAR_NAMES } from "../lib/phylum-catalog";

describe("phylum-catalog popular names", () => {
  it("maps formal phylum names to popular labels", () => {
    expect(formatPhylumLabel("Bacillariophyta")).toBe("Bacillariophyta (diatoms)");
    expect(formatPhylumLabel("Cyanobacteriophyta")).toBe("Cyanobacteriophyta (blue-greens)");
    expect(formatPhylumLabel("Unknown phylum")).toBe("Unknown phylum");
  });

  it("includes all requested popular names", () => {
    expect(PHYLUM_POPULAR_NAMES.bacillariophyta).toBe("diatoms");
    expect(PHYLUM_POPULAR_NAMES.charophyta).toBe("charophytes");
    expect(PHYLUM_POPULAR_NAMES.chlorophyta).toBe("green algae");
    expect(PHYLUM_POPULAR_NAMES.cryptista).toBe("cryptophytes");
    expect(PHYLUM_POPULAR_NAMES.cyanobacteriophyta).toBe("blue-greens");
    expect(PHYLUM_POPULAR_NAMES.dinoflagellata).toBe("dinoflagellates");
    expect(PHYLUM_POPULAR_NAMES.euglenophyta).toBe("euglenophytes");
    expect(PHYLUM_POPULAR_NAMES.haptophyta).toBe("haptophytes");
    expect(PHYLUM_POPULAR_NAMES.rhodophyta).toBe("red algae");
  });
});
