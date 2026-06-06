import type { GlossaryEntry, GlossaryMatchPhrase, GlossaryTextPart } from "./glossary-types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const WORD_BOUNDARY_BEFORE = String.raw`(?<![\p{L}\p{N}_-])`;
const WORD_BOUNDARY_AFTER = String.raw`(?![\p{L}\p{N}_-])`;

/** Optional English plural for single-word glossary headwords in species prose. */
function phraseToPattern(phrase: string): string {
  const esc = escapeRegExp(phrase);
  if (/\s/.test(phrase)) {
    return esc;
  }
  const lower = phrase.toLowerCase();
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("z")) {
    return `${esc}(?:es)?`;
  }
  if (lower.endsWith("ch") || lower.endsWith("sh")) {
    return `${esc}(?:es)?`;
  }
  if (lower.endsWith("y") && phrase.length > 2 && !/[aeiou]y$/i.test(phrase)) {
    const stem = esc.slice(0, -1);
    return `${stem}(?:y|ies)`;
  }
  return `${esc}s?`;
}

function compilePhraseRegex(phrase: string): RegExp {
  return new RegExp(
    `${WORD_BOUNDARY_BEFORE}${phraseToPattern(phrase)}${WORD_BOUNDARY_AFTER}`,
    "giu"
  );
}

/** Build match phrases sorted longest-first (avoids partial overlaps). */
export function buildGlossaryMatchPhrases(entries: GlossaryEntry[]): GlossaryMatchPhrase[] {
  const phrases: GlossaryMatchPhrase[] = [];
  for (const entry of entries) {
    const seen = new Set<string>();
    for (const phrase of entry.match_phrases) {
      const trimmed = phrase.trim();
      if (!trimmed) continue;
      const dedupe = trimmed.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
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

  const compiled = matchPhrases.map((match) => ({
    match,
    re: compilePhraseRegex(match.phrase),
  }));

  const parts: GlossaryTextPart[] = [];
  let pos = 0;

  while (pos < text.length) {
    let best: {
      start: number;
      length: number;
      matched: string;
      match: GlossaryMatchPhrase;
    } | null = null;

    for (const { match, re } of compiled) {
      re.lastIndex = 0;
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
          match,
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

export { compilePhraseRegex, phraseToPattern };
