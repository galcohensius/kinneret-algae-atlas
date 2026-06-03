import { describe, expect, it } from "vitest";
import { splitPreviousNameForDisplay } from "../lib/previous-name-display";

describe("splitPreviousNameForDisplay", () => {
  it("splits primary taxon and Previously referred to tail", () => {
    const result = splitPreviousNameForDisplay(
      "Peridiniopsis oculatum (Stein) Bourrelly 1968 (Previously referred to as Glenodinium oculatum Stein 1883)"
    );
    expect(result.primaryTaxon).toBe("Peridiniopsis oculatum");
    expect(result.primaryAuthority).toBe("(Stein) Bourrelly 1968");
    expect(result.secondary).toBe(
      "(Previously referred to as Glenodinium oculatum Stein 1883)"
    );
  });

  it("parses simple previous name without secondary", () => {
    const result = splitPreviousNameForDisplay("Carteria cordiformis Diesing 1866");
    expect(result.primaryTaxon).toBe("Carteria cordiformis");
    expect(result.primaryAuthority).toBe("Diesing 1866");
    expect(result.secondary).toBeNull();
  });
});
