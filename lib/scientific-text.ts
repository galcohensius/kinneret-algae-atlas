/**
 * Maps ASCII exponent digits and decimal separator to Unicode superscripts for display.
 */
function toSuperscriptExponent(exp: string): string {
  const map: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    ".": "·",
  };
  return [...exp].map((c) => map[c] ?? c).join("");
}

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
  // Sphere / spheroid: (D/2) raised to integer power (Word often drops superscript here).
  s = s.replace(/\(D\/2\)(\d)(?=\s|[,.;)]|$)/g, (_m, d: string) => `(D/2)${toSuperscriptExponent(d)}`);
  // Diameter D with regression or geometric exponent (not the D in "(D/2)").
  s = s.replace(
    /(?<!\()D(\d+(?:\.\d+)?)(?=\s|[,;.]|$|\))/g,
    (_m, exp: string) => `D${toSuperscriptExponent(exp)}`,
  );

  // Temperature (ASCII "oC" in source)
  s = s.replace(/(\d+)\s*oC\b/gi, "$1 °C");

  s = s.replace(/\bg m-2\b/g, "g m⁻²");
  s = s.replace(/\bWatt m-2\b/gi, "Watt m⁻²");
  s = s.replace(/\bmL-1\b/g, "mL⁻¹");
  s = s.replace(/\bcells mL-1\b/gi, "cells mL⁻¹");
  // Liter⁻¹ concentrations (environmental conditions, etc.)
  s = s.replace(/\bmg\s+L-1\b/gi, "mg L⁻¹");
  s = s.replace(/\bmg\s+CaCO3\s+L-1\b/gi, "mg CaCO₃ L⁻¹");
  s = s.replace(/(?:µ|u|\u00B5)S\s+cm-1\b/gi, (match) =>
    match.replace(/cm-1\b/i, "cm⁻¹"),
  );
  s = s.replace(/\bNO3\b/g, "NO₃");
  s = s.replace(/\bNH4\b/g, "NH₄");
  s = s.replace(/\bHCO3\b/g, "HCO₃");

  return s;
}
