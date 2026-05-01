import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { RichSegment } from "./algae-types";
import type { SupplementRecord } from "./supplement-types";

export type { SupplementRecord };

const richSegmentSchema = z.object({
  text: z.string(),
  italic: z.boolean(),
  bold: z.boolean(),
  href: z.string().optional(),
});

const rawSupplementSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  linked_taxa: z.array(z.string()).optional().default([]),
  sections: z.record(z.string(), z.string()).optional().default({}),
  sections_rich: z
    .record(z.string(), z.array(richSegmentSchema))
    .optional()
    .default({}),
  images: z.array(z.string()).optional().default([]),
  image_captions: z.array(z.string()).optional().default([]),
  image_captions_rich: z
    .array(z.array(richSegmentSchema))
    .optional()
    .default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

const rawSupplementArraySchema = z.array(rawSupplementSchema);

type RawSupplement = z.infer<typeof rawSupplementSchema>;

function toRichSegment(seg: z.infer<typeof richSegmentSchema>): RichSegment {
  return {
    text: seg.text,
    italic: seg.italic,
    bold: seg.bold,
    ...(seg.href ? { href: seg.href } : {}),
  };
}

function normalizeSupplementRecord(raw: RawSupplement): SupplementRecord {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    linkedTaxa: raw.linked_taxa,
    sections: raw.sections,
    sectionsRich: Object.fromEntries(
      Object.entries(raw.sections_rich).map(([key, segs]) => [
        key,
        segs.map(toRichSegment),
      ])
    ),
    images: raw.images,
    imageCaptions: raw.image_captions,
    imageCaptionsRich: raw.image_captions_rich.map((arr) =>
      arr.map(toRichSegment)
    ),
    metadata: raw.metadata,
  };
}

export async function getAllSupplements(): Promise<SupplementRecord[]> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "processed",
    "supplements.json"
  );
  const content = await readFile(filePath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  const validated = rawSupplementArraySchema.parse(parsed);
  return validated.map(normalizeSupplementRecord);
}

export async function getSupplementBySlug(
  slug: string
): Promise<SupplementRecord | null> {
  const all = await getAllSupplements();
  return all.find((s) => s.slug === slug) ?? null;
}
