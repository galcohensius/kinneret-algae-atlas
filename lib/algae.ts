import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const rawAlgaeRecordSchema = z.object({
  scientific_name: z.string().nullable(),
  images: z.array(z.string()).optional().default([]),
  sections: z.record(z.string(), z.string()),
  metadata: z.record(z.string(), z.unknown())
});

const rawAlgaeArraySchema = z.array(rawAlgaeRecordSchema);

export type RawAlgaeRecord = z.infer<typeof rawAlgaeRecordSchema>;

export type AlgaeRecord = {
  slug: string;
  title: string;
  scientificName: string;
  images: string[];
  morphology: string | null;
  ecology: string | null;
  notes: string | null;
  sections: Record<string, string>;
  metadata: Record<string, unknown>;
};

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

function getSafeName(raw: RawAlgaeRecord, index: number): string {
  const trimmed = raw.scientific_name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : `unnamed-algae-${index + 1}`;
}

function sectionsWithPreferredOrder(sections: Record<string, string>): Record<string, string> {
  const ordered: Record<string, string> = {};

  for (const key of PRIMARY_SECTION_ORDER) {
    if (sections[key]) {
      ordered[key] = sections[key];
    }
  }

  for (const [key, value] of Object.entries(sections)) {
    if (!ordered[key]) {
      ordered[key] = value;
    }
  }

  return ordered;
}

export function normalizeAlgaeRecords(input: RawAlgaeRecord[]): AlgaeRecord[] {
  const slugCounts = new Map<string, number>();

  return input.map((raw, index) => {
    const scientificName = getSafeName(raw, index);
    const baseSlug = slugify(scientificName);
    const existingCount = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, existingCount + 1);
    const slug = existingCount === 0 ? baseSlug : `${baseSlug}-${existingCount + 1}`;

    const sections = sectionsWithPreferredOrder(raw.sections);
    const morphology = sections.morphology ?? null;
    const ecology = sections.ecology ?? null;
    const notes = sections.notes ?? null;

    return {
      slug,
      title: scientificName,
      scientificName,
      images: raw.images,
      morphology,
      ecology,
      notes,
      sections,
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
  const normalizedQuery = query.trim().toLowerCase();
  const allAlgae = await getAllAlgae();

  if (!normalizedQuery) {
    return allAlgae;
  }

  return allAlgae.filter((record) =>
    record.scientificName.toLowerCase().includes(normalizedQuery)
  );
}

export async function validateAlgaeDataFile(): Promise<{ count: number }> {
  const algae = await getAllAlgae();
  return { count: algae.length };
}
