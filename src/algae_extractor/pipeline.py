from pathlib import Path
from typing import Any
import re

from .config import load_config
from .models import AlgaeRecord
from .parsers.scientific_name import compile_scientific_name_patterns, detect_record_start
from .parsers.sections import build_section_alias_lookup, detect_section_heading
from .reader import iter_docx_content_blocks


def _strict_record_start_patterns(
    compiled_patterns: list[re.Pattern[str]],
) -> list[re.Pattern[str]]:
    """
    Subset of record-start patterns safe for mid-paragraph (.search) use.
    Excludes the loose terminal-only binomial pattern to avoid false splits
    (e.g. 'Gymnodinium never ...').
    """
    return [
        p
        for p in compiled_patterns
        if r"\d{4}" in p.pattern or r"\(" in p.pattern
    ]


def _find_inline_record_split(
    text: str,
    strict_patterns: list[re.Pattern[str]],
    all_patterns: list[re.Pattern[str]],
) -> tuple[int, str, str] | None:
    """
    If a new taxon header appears after sentence-ending punctuation (not at the
    start of the paragraph), return (byte_index, scientific_name, remainder).

    Remainder is the same as detect_record_start(suffix)[1] (text after the name).
    """
    best: tuple[int, str, str] | None = None
    for pattern in strict_patterns:
        for m in pattern.finditer(text):
            idx = m.start()
            if idx == 0:
                continue
            before = text[:idx].rstrip()
            if not before or before[-1] not in ".!?":
                continue
            suffix = text[idx:]
            started = detect_record_start(text=suffix, compiled_patterns=all_patterns)
            if not started:
                continue
            name, remainder = started
            if best is None or idx < best[0]:
                best = (idx, name, remainder)
    return best


def _new_record(source_file: str) -> dict[str, Any]:
    return {
        "scientific_name": None,
        "images": [],
        "image_captions": [],
        "image_captions_rich": [],
        "image_counter": 1,
        "plate_image_counter": 1,
        "figure_image_counter": 1,
        # sections_buffer[section_name] = list of {text, char_styles}
        # char_styles is a per-character style bitmask aligned to `text`.
        # bit 1: italic, bit 2: bold, bit 0: neutral
        "sections_buffer": {},
        "metadata": {"source_file": source_file},
    }


def _neutral_char_styles(text: str) -> list[int]:
    # Neutral style for characters when we don't have run-level info.
    return [0] * len(text)


def _append_section_line(
    record: dict[str, Any],
    section_name: str,
    text: str,
    char_styles: list[int] | None = None,
):
    section_lines = record["sections_buffer"].setdefault(section_name, [])
    section_lines.append(
        {
            "text": text,
            "char_styles": char_styles if char_styles is not None else _neutral_char_styles(text),
        }
    )


def _finalize_record(record: dict[str, Any]) -> AlgaeRecord | None:
    raw_sections_plain: dict[str, str] = {}
    raw_sections_styles: dict[str, list[int]] = {}

    for section, lines in record["sections_buffer"].items():
        if not lines:
            continue

        plain_parts: list[str] = [item["text"] for item in lines if item["text"]]
        if not plain_parts:
            continue

        styles_parts: list[list[int]] = [item["char_styles"] for item in lines if item["text"]]

        # Join paragraphs with spaces to match the old `" ".join(lines)` behavior.
        joined_plain = " ".join(plain_parts).strip()
        joined_styles: list[int] = []
        for i, styles in enumerate(styles_parts):
            joined_styles.extend(styles)
            if i + 1 < len(styles_parts):
                joined_styles.append(0)  # neutral space

        # `strip()` should not change length (paragraph text is already stripped),
        # but keep it safe.
        if joined_plain and len(joined_plain) != len(joined_styles):
            # Fallback: neutralize if lengths drift for any reason.
            joined_styles = _neutral_char_styles(joined_plain)

        raw_sections_plain[section] = joined_plain
        raw_sections_styles[section] = joined_styles

    sections, sections_rich = _normalize_structured_fields(raw_sections_plain, raw_sections_styles)

    if not record["scientific_name"] and not any(sections.values()):
        return None

    return AlgaeRecord(
        scientific_name=record["scientific_name"],
        images=record["images"],
        image_captions=record["image_captions"],
        image_captions_rich=record["image_captions_rich"],
        sections=sections,
        sections_rich=sections_rich,
        metadata=record["metadata"],
    )


def _slugify(value: str) -> str:
    normalized = re.sub(r"\s+", "-", value.strip().lower())
    normalized = re.sub(r"[^a-z0-9-]", "", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "unnamed"


# Epithet / genus-only prefix of a taxon header (before authority), for image dirs and parity with web slugs.
_TAXON_SLUG_BINOMIAL_RE = re.compile(
    r"^(?:\d+\.?\s*)?"
    r"([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)"
)
_TAXON_SLUG_GENUS_RE = re.compile(r"^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b")


def _taxon_name_for_slug(full_header: str) -> str:
    s = (full_header or "").strip()
    if not s:
        return s
    m = _TAXON_SLUG_BINOMIAL_RE.match(s)
    if m:
        return m.group(1).strip()
    m = _TAXON_SLUG_GENUS_RE.match(s)
    if m:
        return m.group(1).strip()
    return s


def _full_scientific_header(detected_name: str, remainder: str) -> str:
    r = remainder.strip()
    if r:
        return f"{detected_name.strip()} {r}".strip()
    return detected_name.strip()


FIELD_ORDER: list[tuple[str, list[str]]] = [
    ("phylum", ["phylum"]),
    ("class", ["class"]),
    ("order", ["order"]),
    ("habitat", ["habitat"]),
    ("previous_name_used", ["previously identified", "previous name used", "synonyms"]),
    ("organization", ["organization"]),
    ("color", ["color"]),
    ("cell_shape", ["cell shape"]),
    # Longer phrases first. Single-word "diameter"/"length" use _compile_field_marker_pattern
    # (parentheses required before ':') so narrative "diameter: 37 µm" does not split fields.
    ("cell_diameter_d", ["cell diameter", "cell size", "diameter"]),
    ("cell_length_l", ["cell length", "length"]),
    ("biovolume_per_cell", ["biovolume/cell", "biovolume per cell"]),
    ("biovolume_equation", ["biovolume equation"]),
    ("morphological_features", ["morphological features"]),
    ("distinctive_attributes", ["distinctive attributes", "diagnostic features"]),
    ("ecology", ["ecology"]),
    ("environmental_conditions", ["environmental conditions"]),
    ("further_reading", ["further reading"]),
]


# Single-word field labels where a bare "word:" appears in narrative (e.g.
# "diameter: 37 µm") and must not start a new field. Word uses "Diameter (D):".
_SINGLE_WORD_MARKERS_REQUIRE_PARENS_BEFORE_COLON = frozenset({"diameter", "length"})


def _compile_field_marker_pattern() -> re.Pattern[str]:
    """
    Match "Label:" or "Label (tag):" field starters in the notes blob.

    Multi-word labels and most single-word labels allow an optional parenthetical
    before the colon. Only diameter/length use a strict "(…)" before ':' so we
    do not split on narrative "diameter: 37 µm".
    """
    multi: list[str] = []
    single_loose: list[str] = []
    single_strict: list[str] = []
    for _name, labels in FIELD_ORDER:
        for label in labels:
            esc = re.escape(label)
            if " " in label:
                multi.append(esc)
            elif label in _SINGLE_WORD_MARKERS_REQUIRE_PARENS_BEFORE_COLON:
                single_strict.append(esc)
            else:
                single_loose.append(esc)
    multi.sort(key=len, reverse=True)
    single_loose.sort(key=len, reverse=True)
    single_strict.sort(key=len, reverse=True)
    multi_alt = "|".join(multi)
    loose_alt = "|".join(single_loose)
    strict_alt = "|".join(single_strict)
    return re.compile(
        rf"(?i)(?:\b({multi_alt})\b(?:\s*\([^)]*\))?\s*:"
        rf"|\b({loose_alt})\b(?:\s*\([^)]*\))?\s*:"
        rf"|\b({strict_alt})\b\s*\([^)]+\)\s*:)"
    )


def _marker_label_from_match(match: re.Match[str]) -> str:
    g1, g2, g3 = match.group(1), match.group(2), match.group(3)
    return (g1 or g2 or g3 or "").lower()


_IMAGE_CAPTION_RE = re.compile(
    r"^(?:Plate|Figures?|Fig\.)\s*\d+[A-Za-z]?\s*[\.:]",
    flags=re.IGNORECASE,
)


def _looks_like_image_caption(text: str) -> bool:
    # Captions are typically standalone paragraphs right under the
    # corresponding image (e.g. "Plate 1. ...", "Plate1 : ...", "Figures 2. ...").
    return bool(_IMAGE_CAPTION_RE.match(text.strip()))


def _image_filename_stem_from_caption_peek(peek_text: str | None) -> str | None:
    """
    If the paragraph after an image is a plate/figure caption, return
    'plate' or 'figure' for use in filenames (plate-1.png, figure-1.png).
    """
    if not peek_text:
        return None
    stripped = peek_text.strip()
    if not _looks_like_image_caption(stripped):
        return None
    # \s* allows both "Plate 1" and "Plate1" (no word boundary between "e" and "1").
    if re.match(r"^Plate\s*\d", stripped, flags=re.IGNORECASE):
        return "plate"
    # Note: do not use \b after "Fig." — the dot is non-word, so \b does not
    # match before the space before the figure number (e.g. "Fig. 3. …").
    if re.match(r"^(?:Figures?|Fig\.)\s*", stripped, flags=re.IGNORECASE):
        return "figure"
    return None


def move_inline_further_reading_from_ecology(fields: dict[str, str]) -> None:
    """
    If ecology ends with an inline 'Further reading:' block (Word-style), move
    the citation tail into further_reading so JSON matches the web app's section.
    Uses the last match so accidental earlier mentions stay in ecology.
    """
    eco = fields.get("ecology", "").strip()
    if not eco:
        return

    matches = list(re.finditer(r"(?i)\bfurther reading\s*:", eco))
    if not matches:
        return

    m = matches[-1]
    prefix = eco[: m.start()].rstrip()
    tail = eco[m.end() :].strip()
    fields["ecology"] = prefix
    if not tail:
        return
    existing = fields.get("further_reading", "").strip()
    fields["further_reading"] = (f"{existing} {tail}" if existing else tail).strip()


def move_inline_further_reading_from_ecology_rich(
    fields_plain: dict[str, str],
    fields_styles: dict[str, list[int]],
) -> None:
    """
    Same as `move_inline_further_reading_from_ecology`, but also trims the
    per-character styles for the ecology field.
    """
    eco_plain = fields_plain.get("ecology", "").strip()
    if not eco_plain:
        return

    eco_styles = fields_styles.get("ecology", [])
    if not eco_styles or len(eco_styles) != len(eco_plain):
        eco_styles = _neutral_char_styles(eco_plain)

    matches = list(re.finditer(r"(?i)\bfurther reading\s*:", eco_plain))
    if not matches:
        return

    m = matches[-1]
    prefix_plain = eco_plain[: m.start()].rstrip()
    fields_plain["ecology"] = prefix_plain
    fields_styles["ecology"] = eco_styles[: len(prefix_plain)]

    tail_raw_plain = eco_plain[m.end() :]
    if not tail_raw_plain.strip():
        return

    left_trim = len(tail_raw_plain) - len(tail_raw_plain.lstrip())
    right_trim = len(tail_raw_plain) - len(tail_raw_plain.rstrip())
    tail_plain = tail_raw_plain.strip()

    tail_styles_raw = eco_styles[m.end() :]
    if right_trim > 0:
        tail_styles = tail_styles_raw[left_trim : len(tail_styles_raw) - right_trim]
    else:
        tail_styles = tail_styles_raw[left_trim:]

    existing_plain = fields_plain.get("further_reading", "").strip()
    existing_styles = fields_styles.get("further_reading", [])
    if existing_plain:
        if not existing_styles or len(existing_styles) != len(existing_plain):
            existing_styles = _neutral_char_styles(existing_plain)
        fields_plain["further_reading"] = f"{existing_plain} {tail_plain}".strip()
        fields_styles["further_reading"] = existing_styles + [0] + tail_styles
    else:
        fields_plain["further_reading"] = tail_plain
        fields_styles["further_reading"] = tail_styles


# Word sometimes runs prose after a sample-size parenthetical without a new field
# label (e.g. "... (N=580) its cellular volume increases ... Ecology: ...").
_SAMPLE_SIZE_THEN_PROSE_RE = re.compile(r"(?i)\(N=\d+\)\s+([a-z])")

_MEASUREMENT_FIELDS_ORPHAN_TAIL = (
    "cell_diameter_d",
    "cell_length_l",
    "biovolume_per_cell",
)


def move_orphan_prose_after_sample_size_from_measurement_fields_rich(
    fields_plain: dict[str, str],
    fields_styles: dict[str, list[int]],
) -> None:
    """
    If a measurement line ends with ``(N=…)`` and lowercase prose follows in the
    same parsed chunk (no ``Ecology:`` in between), move that tail into
    ``ecology`` so narrative ``diameter: …`` inside the prose does not rely on a
    field marker.
    """
    for field in _MEASUREMENT_FIELDS_ORPHAN_TAIL:
        plain = fields_plain.get(field, "")
        if not plain.strip():
            continue
        m = _SAMPLE_SIZE_THEN_PROSE_RE.search(plain)
        if not m:
            continue

        split_at = m.start(1)
        raw_head = plain[:split_at]
        head_plain = raw_head.rstrip()
        head_len = len(head_plain)
        raw_tail = plain[head_len:]
        left_trim = len(raw_tail) - len(raw_tail.lstrip())
        tail_plain = raw_tail.lstrip()
        if not tail_plain:
            continue

        styles = fields_styles.get(field, [])
        if not styles or len(styles) != len(plain):
            styles = _neutral_char_styles(plain)
        head_styles = styles[:head_len]
        tail_styles_raw = styles[head_len + left_trim :]
        right_trim = len(raw_tail) - len(raw_tail.rstrip())
        if right_trim > 0:
            tail_styles = tail_styles_raw[: len(tail_styles_raw) - right_trim]
        else:
            tail_styles = tail_styles_raw
        if len(head_styles) != len(head_plain):
            head_styles = _neutral_char_styles(head_plain)
        if len(tail_styles) != len(tail_plain):
            tail_styles = _neutral_char_styles(tail_plain)

        fields_plain[field] = head_plain
        fields_styles[field] = head_styles

        eco_plain = fields_plain.get("ecology", "").strip()
        eco_styles = fields_styles.get("ecology", [])
        if eco_plain:
            if not eco_styles or len(eco_styles) != len(eco_plain):
                eco_styles = _neutral_char_styles(eco_plain)
            fields_plain["ecology"] = f"{tail_plain} {eco_plain}".strip()
            fields_styles["ecology"] = tail_styles + [0] + eco_styles
        else:
            fields_plain["ecology"] = tail_plain
            fields_styles["ecology"] = tail_styles


def move_inline_environmental_conditions_from_ecology_rich(
    fields_plain: dict[str, str],
    fields_styles: dict[str, list[int]],
) -> None:
    """
    In some Word exports, "Environmental conditions:" is pasted as an inline
    tail inside the Ecology field instead of being its own labeled section.

    Split the last inline "Environmental conditions:" from ecology and store it
    under `environmental_conditions`, trimming per-character styles accordingly.
    """
    eco_plain = fields_plain.get("ecology", "").strip()
    if not eco_plain:
        return

    eco_styles = fields_styles.get("ecology", [])
    if not eco_styles or len(eco_styles) != len(eco_plain):
        eco_styles = _neutral_char_styles(eco_plain)

    matches = list(re.finditer(r"(?i)\benvironmental conditions\s*:", eco_plain))
    if not matches:
        return

    m = matches[-1]

    # Keep the ecology prefix (everything before the label).
    prefix_plain = eco_plain[: m.start()].rstrip()
    fields_plain["ecology"] = prefix_plain
    fields_styles["ecology"] = eco_styles[: len(prefix_plain)]

    # Extract and trim the environmental conditions tail.
    tail_raw_plain = eco_plain[m.end() :]
    if not tail_raw_plain.strip():
        return

    left_trim = len(tail_raw_plain) - len(tail_raw_plain.lstrip())
    right_trim = len(tail_raw_plain) - len(tail_raw_plain.rstrip())
    tail_plain = tail_raw_plain.strip()

    tail_styles_raw = eco_styles[m.end() :]
    if right_trim > 0:
        tail_styles = tail_styles_raw[left_trim : len(tail_styles_raw) - right_trim]
    else:
        tail_styles = tail_styles_raw[left_trim:]

    # Append into existing value if marker parsing already filled it.
    existing_plain = fields_plain.get("environmental_conditions", "").strip()
    existing_styles = fields_styles.get("environmental_conditions", [])
    if existing_plain:
        if not existing_styles or len(existing_styles) != len(existing_plain):
            existing_styles = _neutral_char_styles(existing_plain)
        fields_plain["environmental_conditions"] = f"{existing_plain} {tail_plain}".strip()
        fields_styles["environmental_conditions"] = existing_styles + [0] + tail_styles
    else:
        fields_plain["environmental_conditions"] = tail_plain
        fields_styles["environmental_conditions"] = tail_styles


_FR_CITE_BOUNDARY_RE = re.compile(
    r"(\d{1,4}:\d+-\d+)(\s+)([A-Z][a-zA-Z'\-]+ [A-Z][a-zA-Z'\-]?)"
)


def normalize_further_reading_citation_boundaries(text: str) -> str:
    """
    Word often pastes the next author directly after a page range without a period
    (e.g. '120:267-285 Hansen G,'). Insert '. ' so citation lists split reliably on the site.
    Only targets journal-style vol:ppp-ppp followed by space + Author pattern.
    """
    if not text.strip():
        return text
    return _FR_CITE_BOUNDARY_RE.sub(r"\1. \3", text)


def normalize_further_reading_citation_boundaries_rich(
    text: str, styles: list[int]
) -> tuple[str, list[int]]:
    """
    Same plain-text transformation as `normalize_further_reading_citation_boundaries`,
    but keeps per-character style flags aligned (inserted period and space are neutral).
    """
    if not text.strip():
        return text, styles
    if len(styles) != len(text):
        new_plain = normalize_further_reading_citation_boundaries(text)
        return new_plain, _neutral_char_styles(new_plain)
    out_plain: list[str] = []
    out_styles: list[int] = []
    last = 0
    for m in _FR_CITE_BOUNDARY_RE.finditer(text):
        out_plain.append(text[last : m.start()])
        out_styles.extend(styles[last : m.start()])
        g1, g3 = m.group(1), m.group(3)
        out_plain.append(f"{g1}. {g3}")
        out_styles.extend(styles[m.start(1) : m.end(1)])
        out_styles.append(0)
        out_styles.append(0)
        out_styles.extend(styles[m.start(3) : m.end(3)])
        last = m.end()
    out_plain.append(text[last:])
    out_styles.extend(styles[last:])
    new_plain = "".join(out_plain)
    if len(new_plain) != len(out_styles):
        new_plain = normalize_further_reading_citation_boundaries(text)
        return new_plain, _neutral_char_styles(new_plain)
    return new_plain, out_styles


def _normalize_structured_fields(raw_sections: dict[str, str]) -> dict[str, str]:
    raise RuntimeError("Old signature removed; use _normalize_structured_fields_rich(...)")


def _styles_int_to_segment_flags(style_int: int) -> tuple[bool, bool]:
    italic = bool(style_int & 1)
    bold = bool(style_int & 2)
    return italic, bold


def _char_styles_to_rich_segments(text: str, char_styles: list[int]) -> list[dict[str, Any]]:
    if not text:
        return []
    if len(text) != len(char_styles):
        char_styles = _neutral_char_styles(text)

    segments: list[dict[str, Any]] = []
    cur_style = char_styles[0]
    start = 0
    for i in range(1, len(text)):
        if char_styles[i] != cur_style:
            chunk = text[start:i]
            italic, bold = _styles_int_to_segment_flags(cur_style)
            segments.append({"text": chunk, "italic": italic, "bold": bold})
            start = i
            cur_style = char_styles[i]

    chunk = text[start:]
    italic, bold = _styles_int_to_segment_flags(cur_style)
    segments.append({"text": chunk, "italic": italic, "bold": bold})
    return segments


def _normalize_structured_fields_rich(
    raw_sections_plain: dict[str, str],
    raw_sections_styles: dict[str, list[int]],
) -> tuple[dict[str, str], dict[str, list[dict[str, Any]]]]:
    source_plain = raw_sections_plain.get("notes", "").strip()
    source_styles = raw_sections_styles.get("notes", [])
    if not source_plain:
        plain_parts: list[str] = []
        styles_parts: list[list[int]] = []
        for section, value in raw_sections_plain.items():
            if value:
                plain_parts.append(value)
                styles_parts.append(raw_sections_styles.get(section, _neutral_char_styles(value)))
        source_plain = " ".join(plain_parts).strip()
        joined_styles: list[int] = []
        for i, styles in enumerate(styles_parts):
            joined_styles.extend(styles)
            if i + 1 < len(styles_parts):
                joined_styles.append(0)
        source_styles = joined_styles

    fields_plain: dict[str, str] = {field_name: "" for field_name, _ in FIELD_ORDER}
    fields_styles: dict[str, list[int]] = {field_name: [] for field_name, _ in FIELD_ORDER}

    if not source_plain:
        return fields_plain, {}

    marker_pattern = _compile_field_marker_pattern()
    markers = list(marker_pattern.finditer(source_plain))

    if markers:
        for index, marker in enumerate(markers):
            label_text = _marker_label_from_match(marker)
            field_name = next(
                (
                    name
                    for name, labels in FIELD_ORDER
                    if label_text in labels
                ),
                None,
            )
            if not field_name:
                continue

            start = marker.end()
            end = markers[index + 1].start() if index + 1 < len(markers) else len(source_plain)

            slice_plain = source_plain[start:end]
            value_plain = slice_plain.strip()
            if not value_plain:
                continue

            left_trim = len(slice_plain) - len(slice_plain.lstrip())
            right_trim = len(slice_plain) - len(slice_plain.rstrip())

            slice_styles = source_styles[start + left_trim : end - right_trim]
            if len(slice_styles) != len(value_plain):
                slice_styles = _neutral_char_styles(value_plain)

            if fields_plain[field_name]:
                fields_plain[field_name] = f"{fields_plain[field_name]} {value_plain}".strip()
                fields_styles[field_name].append(0)  # separator space
                fields_styles[field_name].extend(slice_styles)
            else:
                fields_plain[field_name] = value_plain
                fields_styles[field_name] = slice_styles[:]

    if not fields_plain["ecology"] and raw_sections_plain.get("ecology"):
        eco_plain = raw_sections_plain["ecology"].strip()
        eco_styles = raw_sections_styles.get("ecology", _neutral_char_styles(eco_plain))
        if len(eco_styles) != len(eco_plain):
            eco_styles = _neutral_char_styles(eco_plain)
        fields_plain["ecology"] = eco_plain
        fields_styles["ecology"] = eco_styles

    for sec_key in ("phylum", "class", "order", "habitat"):
        if fields_plain[sec_key].strip() or not raw_sections_plain.get(sec_key, "").strip():
            continue
        sub_plain = raw_sections_plain[sec_key].strip()
        sub_styles = raw_sections_styles.get(sec_key, _neutral_char_styles(sub_plain))
        if len(sub_styles) != len(sub_plain):
            sub_styles = _neutral_char_styles(sub_plain)
        fields_plain[sec_key] = sub_plain
        fields_styles[sec_key] = sub_styles

    if raw_sections_plain.get("morphology") and not fields_plain["morphological_features"]:
        morph_plain = raw_sections_plain["morphology"].strip()
        morph_styles = raw_sections_styles.get("morphology", _neutral_char_styles(morph_plain))
        if len(morph_styles) != len(morph_plain):
            morph_styles = _neutral_char_styles(morph_plain)
        fields_plain["morphological_features"] = morph_plain
        fields_styles["morphological_features"] = morph_styles

    move_orphan_prose_after_sample_size_from_measurement_fields_rich(
        fields_plain, fields_styles
    )

    move_inline_further_reading_from_ecology_rich(fields_plain, fields_styles)
    move_inline_environmental_conditions_from_ecology_rich(fields_plain, fields_styles)

    fr_raw = fields_plain.get("further_reading", "") or ""
    if fr_raw.strip():
        fr_plain = fr_raw.strip()
        left = len(fr_raw) - len(fr_raw.lstrip())
        right = len(fr_raw) - len(fr_raw.rstrip())
        raw_st = fields_styles.get("further_reading", [])
        if raw_st and len(raw_st) == len(fr_raw):
            fr_styles = raw_st[left : len(raw_st) - right] if right else raw_st[left:]
        else:
            fr_styles = _neutral_char_styles(fr_plain)
        if len(fr_styles) != len(fr_plain):
            fr_styles = _neutral_char_styles(fr_plain)
        new_fr, new_st = normalize_further_reading_citation_boundaries_rich(fr_plain, fr_styles)
        fields_plain["further_reading"] = new_fr
        fields_styles["further_reading"] = new_st

    sections_rich: dict[str, list[dict[str, Any]]] = {}
    for key, _ in FIELD_ORDER:
        value_plain = fields_plain.get(key, "").strip()
        if not value_plain:
            continue
        value_styles = fields_styles.get(key, [])
        if len(value_styles) != len(value_plain):
            value_styles = _neutral_char_styles(value_plain)
        sections_rich[key] = _char_styles_to_rich_segments(value_plain, value_styles)

    return fields_plain, sections_rich


def _normalize_structured_fields(
    raw_sections_plain: dict[str, str],
    raw_sections_styles: dict[str, list[int]],
) -> tuple[dict[str, str], dict[str, list[dict[str, Any]]]]:
    return _normalize_structured_fields_rich(raw_sections_plain, raw_sections_styles)


def _save_image(
    blob: bytes,
    extension: str,
    filename_stem: str,
    algae_name: str,
    images_output_dir: Path,
    images_public_prefix: str,
) -> str:
    safe_name = _slugify(_taxon_name_for_slug(algae_name))
    algae_images_dir = images_output_dir / safe_name
    algae_images_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{filename_stem}{extension}"
    output_file = algae_images_dir / filename
    output_file.write_bytes(blob)
    public_prefix = images_public_prefix.rstrip("/")
    return f"{public_prefix}/{safe_name}/{filename}"


def _flush_missing_image_caption(current: dict[str, Any]) -> None:
    """Keep `image_captions` index-aligned with `images` when no caption paragraph follows."""
    current["image_captions"].append("")
    current["image_captions_rich"].append([])


def extract_records(
    docx_path: str | Path,
    config_path: str | Path | None = None,
    images_output_dir: str | Path | None = None,
    images_public_prefix: str = "/algae-images",
) -> list[AlgaeRecord]:
    config = load_config(config_path)
    section_alias_lookup = build_section_alias_lookup(config["section_aliases"])
    record_start_patterns = compile_scientific_name_patterns(config["record_start_patterns"])
    default_section = config.get("default_section", "notes")
    blocked_starts = [value.lower() for value in config.get("record_start_blocked_prefixes", [])]
    following_markers = [value.lower() for value in config.get("record_following_markers", [])]
    marker_lookahead = int(config.get("record_following_marker_lookahead", 4))

    source_file = Path(docx_path).name
    records: list[AlgaeRecord] = []
    current = _new_record(source_file=source_file)
    current_section = default_section
    resolved_images_output_dir = Path(images_output_dir) if images_output_dir else None
    expect_image_caption = False

    blocks = list(iter_docx_content_blocks(docx_path))
    pending_relaxed_record_markers = False

    for index, block in enumerate(blocks):
        if block["type"] == "page_break":
            if expect_image_caption:
                _flush_missing_image_caption(current)
                expect_image_caption = False
            finalized = _finalize_record(current)
            if finalized:
                records.append(finalized)
            current = _new_record(source_file=source_file)
            current_section = default_section
            pending_relaxed_record_markers = True
            continue

        if block["type"] == "image":
            if resolved_images_output_dir is None:
                continue
            if expect_image_caption:
                _flush_missing_image_caption(current)
                expect_image_caption = False
            algae_name = current.get("scientific_name") or f"record-{len(records) + 1}"
            peek_text: str | None = None
            if index + 1 < len(blocks):
                nxt = blocks[index + 1]
                if nxt["type"] == "paragraph":
                    peek_text = nxt["text"]
            kind = _image_filename_stem_from_caption_peek(peek_text)
            if kind == "plate":
                stem = f"plate-{current['plate_image_counter']}"
                current["plate_image_counter"] += 1
            elif kind == "figure":
                stem = f"figure-{current['figure_image_counter']}"
                current["figure_image_counter"] += 1
            else:
                stem = f"image-{current['image_counter']}"
                current["image_counter"] += 1
            image_path = _save_image(
                blob=block["blob"],
                extension=block["extension"],
                filename_stem=stem,
                algae_name=algae_name,
                images_output_dir=resolved_images_output_dir,
                images_public_prefix=images_public_prefix,
            )
            current["images"].append(image_path)
            expect_image_caption = True
            continue

        text = block["text"]
        if expect_image_caption:
            if _looks_like_image_caption(text):
                char_styles = block.get("char_styles")
                if isinstance(char_styles, list) and len(char_styles) == len(text):
                    caption_rich = _char_styles_to_rich_segments(text, char_styles)
                else:
                    caption_rich = _char_styles_to_rich_segments(
                        text, _neutral_char_styles(text)
                    )
                current["image_captions"].append(text)
                current["image_captions_rich"].append(caption_rich)
                expect_image_caption = False
                continue
            # We expected a caption right after the image but didn't see one.
            # Stop skipping paragraphs so we don't drop real content.
            _flush_missing_image_caption(current)
            expect_image_caption = False
        use_relaxed_record_markers = pending_relaxed_record_markers
        if pending_relaxed_record_markers:
            pending_relaxed_record_markers = False

        should_block = any(text.lower().startswith(prefix) for prefix in blocked_starts)
        record_start = None if should_block else detect_record_start(text=text, compiled_patterns=record_start_patterns)
        if record_start and following_markers and not use_relaxed_record_markers:
            lookahead_slice = [
                candidate
                for candidate in blocks[index + 1 : index + 1 + marker_lookahead]
                if candidate["type"] == "paragraph"
            ]
            next_starts_with_marker = any(
                candidate["text"].lower().startswith(marker)
                for candidate in lookahead_slice
                for marker in following_markers
            )
            if not next_starts_with_marker:
                record_start = None
        if record_start:
            detected_name, remaining_text = record_start
            if expect_image_caption:
                _flush_missing_image_caption(current)
                expect_image_caption = False
            finalized = _finalize_record(current)
            if finalized:
                records.append(finalized)

            current = _new_record(source_file=source_file)
            current["scientific_name"] = _full_scientific_header(
                detected_name, remaining_text or ""
            )
            current_section = default_section

            continue

        if not should_block:
            strict_patterns = _strict_record_start_patterns(record_start_patterns)
            inline = _find_inline_record_split(
                text, strict_patterns, record_start_patterns
            )
            if inline:
                split_idx, detected_name, remainder = inline
                prefix = text[:split_idx]
                if prefix.strip():
                    char_styles = block.get("char_styles")
                    prefix_trimmed = prefix.rstrip()
                    if char_styles is not None and len(char_styles) == len(text):
                        prefix_styles = char_styles[: len(prefix_trimmed)]
                    else:
                        prefix_styles = None
                    _append_section_line(
                        current, current_section, prefix_trimmed, prefix_styles
                    )
                if expect_image_caption:
                    _flush_missing_image_caption(current)
                    expect_image_caption = False
                finalized = _finalize_record(current)
                if finalized:
                    records.append(finalized)

                current = _new_record(source_file=source_file)
                current["scientific_name"] = _full_scientific_header(
                    detected_name, remainder or ""
                )
                current_section = default_section

                continue

        detected_section = detect_section_heading(text=text, alias_lookup=section_alias_lookup)
        if detected_section:
            current_section = detected_section
            continue

        _append_section_line(
            current,
            current_section,
            text,
            char_styles=block.get("char_styles"),
        )

    if expect_image_caption:
        _flush_missing_image_caption(current)
    finalized = _finalize_record(current)
    if finalized:
        records.append(finalized)

    return records
