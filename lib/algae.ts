import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fixScientificTypography } from "./scientific-text";
import { filterAlgaeByQuery } from "./algae-filter";
import { publicAssetPath } from "./public-path";

const rawAlgaeRecordSchema = z.object({
  scientific_name: z.string().nullable(),
  images: z.array(z.string()).optional().default([]),
  image_captions: z.array(z.string()).optional().default([]),
  sections: z.record(z.string(), z.string()),
  sections_rich: z
    .record(
      z.string(),
      z.array(
        z.object({
          text: z.string(),
          italic: z.boolean(),
          bold: z.boolean(),
        })
      )
    )
    .optional()
    .default({}),
  metadata: z.record(z.string(), z.unknown())
});

const rawAlgaeArraySchema = z.array(rawAlgaeRecordSchema);

export type RawAlgaeRecord = z.infer<typeof rawAlgaeRecordSchema>;

import type { AlgaeRecord } from "./algae-types";

export type { AlgaeRecord };

const PRIMARY_SECTION_ORDER = ["morphology", "ecology"];

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeSlugInput(input: string): string {
  const trimmed = input.trim();
  const withoutBrackets = trimmed.replace(/^\[+|\]+$/g, "");
  return slugify(withoutBrackets);
}

/** Genus + epithet (and optional infraspecific rank) from a full taxon header; used for stable URLs. */
export function taxonNameForSlug(fullHeader: string): string {
  const s = fullHeader.trim();
  if (!s) {
    return s;
  }
  const binomial =
    /^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)/.exec(
      s
    );
  if (binomial) {
    return binomial[1]!.trim();
  }
  const genus = /^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b/.exec(s);
  if (genus) {
    return genus[1]!.trim();
  }
  return s;
}

function getSafeName(raw: RawAlgaeRecord, index: number): string {
  const trimmed = raw.scientific_name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : `unnamed-algae-${index + 1}`;
}

/** @see {@link partitionPlateAndGalleryImages} in `./partition-plate-images` (client-safe). */
export { partitionPlateAndGalleryImages } from "./partition-plate-images";

function sectionsWithPreferredOrder(sections: Record<string, string>): Record<string, string> {
  const ordered: Record<string, string> = {};
  let furtherReadingValue: string | undefined;

  for (const key of PRIMARY_SECTION_ORDER) {
    if (sections[key]) {
      ordered[key] = sections[key];
    }
  }

  for (const [key, value] of Object.entries(sections)) {
    if (key === "further_reading") {
      // Ensure "Further reading" always renders last regardless of original
      // insertion order in the source JSON.
      furtherReadingValue = value;
      continue;
    }
    if (!ordered[key]) {
      ordered[key] = value;
    }
  }

  if (furtherReadingValue !== undefined) {
    ordered["further_reading"] = furtherReadingValue;
  }

  return ordered;
}

export function normalizeAlgaeRecords(input: RawAlgaeRecord[]): AlgaeRecord[] {
  const slugCounts = new Map<string, number>();

  return input.map((raw, index) => {
    const scientificName = getSafeName(raw, index);
    const baseSlug = slugify(taxonNameForSlug(scientificName));
    const existingCount = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, existingCount + 1);
    const slug = existingCount === 0 ? baseSlug : `${baseSlug}-${existingCount + 1}`;

    const sections = sectionsWithPreferredOrder(raw.sections);
    const fixedSections: Record<string, string> = {};
    for (const [key, value] of Object.entries(sections)) {
      fixedSections[key] = fixScientificTypography(value);
    }
    const morphology = fixedSections.morphology ?? null;
    const ecology = fixedSections.ecology ?? null;
    const notes = fixedSections.notes ?? null;

    return {
      slug,
      title: fixScientificTypography(scientificName),
      scientificName: fixScientificTypography(scientificName),
      images: (raw.images ?? []).map((p) => publicAssetPath(p)),
      imageCaptions: raw.image_captions ?? [],
      morphology,
      ecology,
      notes,
      sections: fixedSections,
      sectionsRich: Object.fromEntries(
        Object.entries(raw.sections_rich ?? {}).map(([key, segments]) => [
          key,
          segments.map((seg) => ({
            text: fixScientificTypography(seg.text),
            italic: seg.italic,
            bold: seg.bold,
          })),
        ])
      ),
      metadata: raw.metadata
    };
  });
}

export async function getAllAlgae(): Promise<AlgaeRecord[]> {
  const filePath = path.join(process.cwd(), "data", "processed", "algae_records.json");
  const content = await readFile(filePath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  const validated = rawAlgaeArraySchema.parse(parsed);
  return normalizeAlgaeRecords(validated);
}

export async function getAlgaBySlug(slug: string): Promise<AlgaeRecord | null> {
  const allAlgae = await getAllAlgae();
  const normalized = normalizeSlugInput(slug);
  return allAlgae.find((item) => item.slug === normalized) ?? null;
}

export async function searchAlgae(query: string): Promise<AlgaeRecord[]> {
  const allAlgae = await getAllAlgae();
  return filterAlgaeByQuery(allAlgae, query);
}

export async function validateAlgaeDataFile(): Promise<{ count: number }> {
  const algae = await getAllAlgae();
  return { count: algae.length };
}
