import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { buildGlossaryIndex, type GlossaryIndex } from "./glossary";

const glossaryEntrySchema = z.object({
  term: z.string().min(1),
  slug: z.string().min(1),
  definition: z.string().min(1),
  letter: z.string().min(1),
  match_phrases: z.array(z.string()).min(1),
});

const glossaryPlateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  src: z.string().min(1),
});

const glossaryDataSchema = z.object({
  title: z.string(),
  record_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_file: z.string().optional(),
  plates: z.array(glossaryPlateSchema).optional(),
  entries: z.array(glossaryEntrySchema).min(1),
});

export async function getGlossary(): Promise<GlossaryIndex> {
  const filePath = path.join(process.cwd(), "data", "processed", "glossary.json");
  const content = await readFile(filePath, "utf8");
  const parsed = glossaryDataSchema.parse(JSON.parse(content) as unknown);
  return buildGlossaryIndex(parsed);
}

export async function validateGlossaryFile(): Promise<{ count: number }> {
  const index = await getGlossary();
  return { count: index.data.entries.length };
}
