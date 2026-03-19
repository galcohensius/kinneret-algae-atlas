/**
 * Fixes text extracted from Word docs where Symbol/Wingdings map to PUA code points
 * and common unit formatting is plain ASCII.
 */
export function fixScientificTypography(text: string): string {
  let s = text;

  // Legacy Word Symbol font → Unicode (common PUA mappings)
  s = s.replace(/\uF06D/g, "\u00B5"); // "micro" glyph → µ
  s = s.replace(/\uF070/g, "\u03C0"); // pi glyph → π
  s = s.replace(/\uF020/g, " "); // odd space / placeholder
  s = s.replace(/\uFEFF/g, ""); // BOM if any

  // Thin/narrow spaces sometimes embedded in equations
  s = s.replace(/[\u2009\u200A\u202F]/g, " ");

  // Units
  s = s.replace(/\u00B5m3/g, "µm³");
  s = s.replace(/\u00B5m2/g, "µm²");
  s = s.replace(/µm3\b/g, "µm³");
  s = s.replace(/µm2\b/g, "µm²");
  s = s.replace(/mm3\b/g, "mm³");
  s = s.replace(/\b(\d+)\s*m3\b/g, "$1 m³");
  s = s.replace(/\(D\/2\)3\b/g, "(D/2)³");

  // Temperature (ASCII "oC" in source)
  s = s.replace(/(\d+)\s*oC\b/gi, "$1 °C");

  s = s.replace(/\bg m-2\b/g, "g m⁻²");
  s = s.replace(/\bmL-1\b/g, "mL⁻¹");
  s = s.replace(/\bcells mL-1\b/gi, "cells mL⁻¹");
  s = s.replace(/\bNO3\b/g, "NO₃");
  s = s.replace(/\bNH4\b/g, "NH₄");
  s = s.replace(/\bHCO3\b/g, "HCO₃");

  return s;
}
