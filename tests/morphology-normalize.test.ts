import { describe, expect, it } from "vitest";
import {
  normalizeCellShape,
  normalizeColor,
  normalizeColonyShape,
  normalizeMorphology,
  normalizeOrganization,
} from "../lib/morphology-normalize";

describe("morphology-normalize", () => {
  it("maps organization text to stable buckets", () => {
    expect(normalizeOrganization("flagellated single cells")).toBe("single_flagellate");
    expect(normalizeOrganization("single flagellated cells")).toBe("single_flagellate");
    expect(normalizeOrganization("colonial")).toBe("colonial");
    expect(normalizeOrganization("colonies of 2-8 cells")).toBe("colonial");
    expect(normalizeOrganization("filamentous")).toBe("filament");
    expect(normalizeOrganization("flagellated coenobia")).toBe("colonial");
  });

  it("maps color text to stable buckets", () => {
    expect(normalizeColor("yellow to golden-brown")).toBe("golden_brown");
    expect(normalizeColor("blue-green")).toBe("blue_green");
    expect(normalizeColor("grass green")).toBe("green");
    expect(normalizeColor("dark red-brown")).toBe("red");
    expect(normalizeColor("brown")).toBe("brown");
  });

  it("maps cell shape text to stable buckets", () => {
    expect(normalizeCellShape("sphere")).toBe("sphere");
    expect(normalizeCellShape("spherical")).toBe("sphere");
    expect(normalizeCellShape("cylinder")).toBe("cylinder");
    expect(normalizeCellShape("a spheroid from which 2 horns extend")).toBe("horned");
    expect(normalizeCellShape("leaf-shaped")).toBe("oval");
  });

  it("maps colony shape text to stable buckets", () => {
    expect(normalizeColonyShape("")).toBe("none");
    expect(normalizeColonyShape("spherical")).toBe("spherical");
    expect(normalizeColonyShape("irregular")).toBe("irregular");
    expect(normalizeColonyShape("filament, made of a chain of cylindrical cells")).toBe(
      "filament_chain"
    );
  });

  it("normalizes a full morphology profile from sections", () => {
    expect(
      normalizeMorphology({
        organization: "colonial",
        color: "blue-green",
        cell_shape: "sphere",
        colony_shape: "mostly spherical",
      })
    ).toEqual({
      organization: "colonial",
      color: "blue_green",
      cellShape: "sphere",
      colonyShape: "spherical",
    });
  });
});
