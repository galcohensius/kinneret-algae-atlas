import glossaryJson from "../data/processed/glossary.json";
import { buildGlossaryIndex } from "./glossary";
import type { GlossaryData } from "./glossary-types";

/** Client-safe glossary index (bundled at build time). */
export const glossaryIndex = buildGlossaryIndex(glossaryJson as GlossaryData);
