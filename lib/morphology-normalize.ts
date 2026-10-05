/** Colour buckets used to order species within a visual-index group. */

export type ColorBucket = "green" | "blue_green" | "golden_brown" | "brown" | "red" | "other";

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeColor(value: string | undefined): ColorBucket {
  const text = normalizeText(value);
  if (!text) return "other";
  if (text.includes("red") || text.includes("pink")) return "red";
  if (text.includes("blue") && text.includes("green")) return "blue_green";
  if (text.includes("blue-green") || text.includes("blue green")) return "blue_green";
  if (
    text.includes("golden-brown") ||
    text.includes("golden brown") ||
    text.includes("yellow")
  ) {
    return "golden_brown";
  }
  if (text.includes("green")) return "green";
  if (text.includes("brown") || text.includes("khaki") || text.includes("olive")) {
    return "brown";
  }
  return "other";
}

/** Sort position of each colour bucket, green through red. */
export const COLOR_AXIS: Record<ColorBucket, number> = {
  green: 0.1,
  blue_green: 0.3,
  golden_brown: 0.55,
  brown: 0.75,
  red: 0.9,
  other: 0.5,
};
