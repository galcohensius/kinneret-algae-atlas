import type { GlossaryEntry, GlossaryMatchPhrase, GlossaryTextPart } from "./glossary-types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build match phrases sorted longest-first (avoids partial overlaps). */
export function buildGlossaryMatchPhrases(entries: GlossaryEntry[]): GlossaryMatchPhrase[] {
  const phrases: GlossaryMatchPhrase[] = [];
  for (const entry of entries) {
    for (const phrase of entry.match_phrases) {
      const trimmed = phrase.trim();
      if (!trimmed) continue;
      phrases.push({
        phrase: trimmed,
        slug: entry.slug,
        term: entry.term,
        definition: entry.definition,
      });
    }
  }
  return phrases.sort((a, b) => b.phrase.length - a.phrase.length);
}

/**
 * Split plain text into literal runs and glossary term runs (word-boundary, case-insensitive).
 */
export function linkGlossaryInPlainText(
  text: string,
  matchPhrases: GlossaryMatchPhrase[]
): GlossaryTextPart[] {
  if (!text || matchPhrases.length === 0) {
    return [{ type: "text", text }];
  }

  const parts: GlossaryTextPart[] = [];
  let pos = 0;

  while (pos < text.length) {
    let best: {
      start: number;
      length: number;
      matched: string;
      match: GlossaryMatchPhrase;
    } | null = null;

    for (const candidate of matchPhrases) {
      const re = new RegExp(
        `(?<![\\p{L}\\p{N}_-])${escapeRegExp(candidate.phrase)}(?![\\p{L}\\p{N}_-])`,
        "giu"
      );
      const slice = text.slice(pos);
      const m = re.exec(slice);
      if (!m || m.index < 0) continue;

      const start = pos + m.index;
      const length = m[0].length;
      if (
        !best ||
        start < best.start ||
        (start === best.start && length > best.length)
      ) {
        best = {
          start,
          length,
          matched: m[0],
          match: candidate,
        };
      }
    }

    if (!best) {
      parts.push({ type: "text", text: text.slice(pos) });
      break;
    }

    if (best.start > pos) {
      parts.push({ type: "text", text: text.slice(pos, best.start) });
    }

    parts.push({
      type: "term",
      text: best.matched,
      slug: best.match.slug,
      term: best.match.term,
      definition: best.match.definition,
    });
    pos = best.start + best.length;
  }

  return parts.length > 0 ? parts : [{ type: "text", text }];
}
