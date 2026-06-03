"""Parse glossary plain text exported from Word."""

from __future__ import annotations

import re
from datetime import date
from typing import Any

# En-dash, em-dash, or spaced hyphen between term and definition.
_TERM_DEF_RE = re.compile(r"^\s*(.+?)\s+[–—]\s+(.+?)\s*$")
_TITLE_RE = re.compile(r"^glossary\s*:", re.I)


def _slugify(term: str) -> str:
    base = term.strip().lower()
    # Drop parenthetical qualifiers for stable anchors (e.g. "Apex (plural: apices)" → apex).
    base = re.sub(r"\s*\([^)]*\)\s*$", "", base).strip()
    normalized = re.sub(r"[^\w\s-]", "", base)
    normalized = re.sub(r"\s+", "-", normalized).strip("-")
    normalized = re.sub(r"-{2,}", "-", normalized)
    return normalized or "term"


def _match_phrases(term: str) -> list[str]:
    """Phrases to match in species prose (longest-first sorting applied later)."""
    stripped = term.strip()
    phrases: list[str] = []

    plural = re.match(r"^(.+?)\s*\(\s*plural:\s*([^)]+)\)\s*$", stripped, re.I)
    if plural:
        head = plural.group(1).strip()
        plural_form = plural.group(2).strip()
        if head:
            phrases.append(head)
        if plural_form:
            phrases.append(plural_form)
    else:
        phrases.append(stripped)

    # Deduplicate case-insensitively while preserving first casing.
    seen: set[str] = set()
    out: list[str] = []
    for p in phrases:
        key = p.casefold()
        if key and key not in seen:
            seen.add(key)
            out.append(p)
    return out


def parse_glossary_lines(lines: list[str]) -> tuple[str, list[dict[str, Any]]]:
    """
    Return (title, entries). Each entry:
    { term, slug, definition, letter, match_phrases }.
    """
    title = "Glossary"
    entries: list[dict[str, Any]] = []
    seen_slugs: dict[str, int] = {}

    for raw in lines:
        line = raw.replace("\x07", "").strip()
        if not line:
            continue
        if _TITLE_RE.match(line) and not entries:
            title = line.rstrip(":").strip() or title
            continue

        m = _TERM_DEF_RE.match(line)
        if not m:
            continue

        term = m.group(1).strip()
        definition = m.group(2).strip()
        if not term or not definition:
            continue

        slug_base = _slugify(term)
        count = seen_slugs.get(slug_base, 0)
        seen_slugs[slug_base] = count + 1
        slug = slug_base if count == 0 else f"{slug_base}-{count + 1}"

        letter = term[0].upper() if term else "#"
        if not letter.isalpha():
            letter = "#"

        entries.append(
            {
                "term": term,
                "slug": slug,
                "definition": definition,
                "letter": letter,
                "match_phrases": _match_phrases(term),
            }
        )

    return title, entries


def parse_glossary_text(text: str) -> dict[str, Any]:
    """Parse full glossary document text into JSON-serializable dict."""
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = normalized.split("\n")
    title, entries = parse_glossary_lines(lines)
    return {
        "title": title,
        "record_updated": date.today().isoformat(),
        "entries": entries,
    }
