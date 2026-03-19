import { describe, expect, it } from "vitest";
import { fixScientificTypography } from "../lib/scientific-text";

describe("fixScientificTypography", () => {
  it("replaces legacy Word Symbol micro and pi", () => {
    const raw = "7.6 \uF06Dm and V,\uF020\uF06Dm3 = 4/3 \uF070 (D/2)3.";
    const fixed = fixScientificTypography(raw);
    expect(fixed).toContain("µm");
    expect(fixed).toContain("π");
    expect(fixed).toContain("(D/2)³");
  });
});
