import { describe, expect, it } from "vitest";
import { splitIntoBalancedRows } from "../lib/split-balanced-rows";

describe("splitIntoBalancedRows", () => {
  it("keeps a single item on one row", () => {
    expect(splitIntoBalancedRows(["A"], (s) => s.length)).toEqual([["A"]]);
  });

  it("keeps two items on one row", () => {
    expect(splitIntoBalancedRows(["A", "B"], (s) => s.length)).toEqual([["A", "B"]]);
  });

  it("keeps three items on one row to avoid a lone second-row orphan", () => {
    expect(splitIntoBalancedRows(["A", "B", "C"], (s) => s.length)).toEqual([["A", "B", "C"]]);
  });

  it("splits four items evenly", () => {
    const rows = splitIntoBalancedRows(["A", "B", "C", "D"], (s) => s.length);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(2);
    expect(rows[1]).toHaveLength(2);
  });

  it("never leaves a single item on either row when splitting five or more", () => {
    const items = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const rows = splitIntoBalancedRows(items, (s) => s.length);
    expect(rows).toHaveLength(2);
    expect(rows[0].length).toBeGreaterThanOrEqual(2);
    expect(rows[1].length).toBeGreaterThanOrEqual(2);
  });

  it("balances phylum-style labels by character count", () => {
    const phyla = [
      "Bacillariophyta",
      "Charophyta",
      "Chlorophyta",
      "Cryptista",
      "Cyanobacteriophyta",
      "Dinoflagellata",
      "Euglenophyta",
      "Haptophyta",
      "Rhodophyta",
    ];
    const rows = splitIntoBalancedRows(phyla, (name) => name.length);
    expect(rows.flat()).toEqual(phyla);
    expect(rows[0].length).toBeGreaterThanOrEqual(2);
    expect(rows[1].length).toBeGreaterThanOrEqual(2);
  });
});
