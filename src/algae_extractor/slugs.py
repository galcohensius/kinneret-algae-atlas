"""Species slugs shared by the extractor, the multi-document merge and the static API.

The web app derives the same slug from ``scientific_name`` in ``lib/algae.ts``
(``slugify(taxonNameForSlug(...))``); image directory names, merge keys and
``/api/species/{slug}.json`` must agree with it, so there is one implementation here.
The glossary uses its own, differently shaped anchors (``glossary_extractor.parse``).
"""

from __future__ import annotations

import re
import unicodedata

# Epithet / genus-only prefix of a taxon header (before the authority), with an
# optional "1. " list number.
SLUG_BINOMIAL_RE = re.compile(
    r"^(?:\d+\.?\s*)?"
    r"([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)"
)
SLUG_GENUS_RE = re.compile(r"^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b")


def slugify(value: str) -> str:
    """ASCII, lower-case, hyphen-separated slug; diacritics are folded (NFKD)."""
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.strip().lower()
    normalized = re.sub(r"[^a-z0-9\s-]", "", normalized)
    normalized = re.sub(r"\s+", "-", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "unnamed"


def taxon_name_for_slug(full_header: str) -> str:
    """Binomial (or genus) part of a record header, or the header itself when neither matches."""
    header = (full_header or "").strip()
    if not header:
        return header
    match = SLUG_BINOMIAL_RE.match(header) or SLUG_GENUS_RE.match(header)
    return match.group(1).strip() if match else header


def taxon_slug(full_header: str) -> str:
    """Slug of a record header: image directory name, merge key and API slug."""
    return slugify(taxon_name_for_slug(full_header))
