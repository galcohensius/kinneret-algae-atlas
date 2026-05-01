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

  it("superscripts biovolume exponents on D and (D/2)", () => {
    expect(fixScientificTypography("0.9405 D2.8596 (regression")).toContain("D²·⁸⁵⁹⁶");
    expect(fixScientificTypography("V = (4/3)π L (D/2)2 (prolate")).toContain("(D/2)²");
    expect(fixScientificTypography("(π/12) *D2 *(D+h)")).toContain("D²");
    expect(fixScientificTypography("2.099 D2.623")).toContain("D²·⁶²³");
  });

  it("superscripts common environmental / chemistry units using plain -1 / m-2", () => {
    const env =
      "alkalinity < 130 mg L-1, chloride > 230 mg L-1, conductivity > 1050 µS cm-1, " +
      "CaCO3 case 90-140 mg CaCO3 L-1, (320-385 Watt m-2)";
    const fixed = fixScientificTypography(env);
    expect(fixed).toContain("mg L⁻¹");
    expect(fixed).toContain("cm⁻¹");
    expect(fixed).toContain("mg CaCO₃ L⁻¹");
    expect(fixed).toContain("Watt m⁻²");
  });
});
