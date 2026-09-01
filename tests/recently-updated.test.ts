import { describe, expect, it } from "vitest";
import type { AlgaeRecord } from "../lib/algae-types";
import { selectRecentlyUpdated } from "../lib/recently-updated";

function record(slug: string, recordUpdated: string | null): AlgaeRecord {
  return {
    slug,
    title: slug,
    scientificName: slug,
    nameAuthority: null,
    thumbnailUrl: null,
    images: [],
    imageCaptions: [],
    imageCaptionsRich: [],
    morphology: null,
    ecology: null,
    notes: null,
    sections: {},
    sectionsRich: {},
    metadata: {},
    recordUpdated,
  };
}

describe("selectRecentlyUpdated", () => {
  it("returns only the newest date's records, A-Z", () => {
    const records = [
      record("b-old", "2026-01-01"),
      record("z-new", "2026-03-01"),
      record("a-new", "2026-03-01"),
      record("mid", "2026-02-01"),
    ];
    expect(selectRecentlyUpdated(records).map((r) => r.slug)).toEqual([
      "a-new",
      "z-new",
    ]);
  });

  it("caps the newest batch at max", () => {
    const records = [
      record("old", "2026-01-01"),
      record("d", "2026-03-01"),
      record("c", "2026-03-01"),
      record("b", "2026-03-01"),
      record("a", "2026-03-01"),
    ];
    expect(selectRecentlyUpdated(records, 3).map((r) => r.slug)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("returns [] when all records share one date", () => {
    const records = [record("a", "2026-01-01"), record("b", "2026-01-01")];
    expect(selectRecentlyUpdated(records)).toEqual([]);
  });

  it("ignores undated records", () => {
    const records = [
      record("a", "2026-01-01"),
      record("b", "2026-02-01"),
      record("undated", null),
    ];
    expect(selectRecentlyUpdated(records).map((r) => r.slug)).toEqual(["b"]);
  });
});
