from pathlib import Path
from typing import Any
import re

from .config import load_config
from .models import AlgaeRecord
from .parsers.scientific_name import compile_scientific_name_patterns, detect_record_start
from .parsers.sections import build_section_alias_lookup, detect_section_heading
from .reader import iter_docx_content_blocks


def _new_record(source_file: str) -> dict[str, Any]:
    return {
        "scientific_name": None,
        "images": [],
        "image_captions": [],
        "image_counter": 1,
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
        sections=sections,
        sections_rich=sections_rich,
        metadata=record["metadata"],
    )


def _slugify(value: str) -> str:
    normalized = re.sub(r"\s+", "-", value.strip().lower())
    normalized = re.sub(r"[^a-z0-9-]", "", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "unnamed"


FIELD_ORDER: list[tuple[str, list[str]]] = [
    ("previously_identified", ["previously identified", "previous name used", "synonyms"]),
    ("organization", ["organization"]),
    ("color", ["color"]),
    ("cell_shape", ["cell shape"]),
    ("cell_size_or_diameter", ["cell size", "cell diameter"]),
    ("biovolume_per_cell", ["biovolume/cell", "biovolume per cell"]),
    ("biovolume_equation", ["biovolume equation"]),
    ("morphological_features", ["morphological features"]),
    ("diagnostic_features", ["diagnostic features"]),
    ("ecology", ["ecology"]),
    ("further_reading", ["further reading"]),
]


_IMAGE_CAPTION_RE = re.compile(
    r"^(?:Plate|Figure|Fig\.)\s*\d+[A-Za-z]?\s*[\.:]",
    flags=re.IGNORECASE,
)


def _looks_like_image_caption(text: str) -> bool:
    # Captions are typically standalone paragraphs right under the
    # corresponding image (e.g. "Plate 1. ...", "Figure 2. ...", "Fig. 1. ...").
    return bool(_IMAGE_CAPTION_RE.match(text.strip()))


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
    tail_plain = eco_plain[m.end() :].strip()

    fields_plain["ecology"] = prefix_plain
    fields_styles["ecology"] = eco_styles[: len(prefix_plain)]

    if not tail_plain:
        return

    existing = fields_plain.get("further_reading", "").strip()
    fields_plain["further_reading"] = (f"{existing} {tail_plain}" if existing else tail_plain).strip()


def normalize_further_reading_citation_boundaries(text: str) -> str:
    """
    Word often pastes the next author directly after a page range without a period
    (e.g. '120:267-285 Hansen G,'). Insert '. ' so citation lists split reliably on the site.
    Only targets journal-style vol:ppp-ppp followed by space + Author pattern.
    """
    if not text.strip():
        return text
    return re.sub(
        r"(\d{1,4}:\d+-\d+)\s+([A-Z][a-zA-Z'\-]+ [A-Z][a-zA-Z'\-]?)",
        r"\1. \2",
        text,
    )


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

    label_variants = [re.escape(label) for _, labels in FIELD_ORDER for label in labels]
    labels_regex = "|".join(label_variants)
    marker_pattern = re.compile(rf"(?i)\b({labels_regex})\b(?:\s*\([^)]*\))?\s*:")
    markers = list(marker_pattern.finditer(source_plain))

    if markers:
        for index, marker in enumerate(markers):
            label_text = marker.group(1).lower()
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

    if raw_sections_plain.get("morphology") and not fields_plain["morphological_features"]:
        morph_plain = raw_sections_plain["morphology"].strip()
        morph_styles = raw_sections_styles.get("morphology", _neutral_char_styles(morph_plain))
        if len(morph_styles) != len(morph_plain):
            morph_styles = _neutral_char_styles(morph_plain)
        fields_plain["morphological_features"] = morph_plain
        fields_styles["morphological_features"] = morph_styles

    move_inline_further_reading_from_ecology_rich(fields_plain, fields_styles)

    fr = fields_plain.get("further_reading", "").strip()
    if fr:
        fields_plain["further_reading"] = normalize_further_reading_citation_boundaries(fr)

    # Build rich segments for everything except further_reading (we render it as
    # a citation list that depends on exact citation splitting).
    sections_rich: dict[str, list[dict[str, Any]]] = {}
    for key, _ in FIELD_ORDER:
        if key == "further_reading":
            continue
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
    image_index: int,
    algae_name: str,
    images_output_dir: Path,
    images_public_prefix: str,
) -> str:
    safe_name = _slugify(algae_name)
    algae_images_dir = images_output_dir / safe_name
    algae_images_dir.mkdir(parents=True, exist_ok=True)
    filename = f"image-{image_index}{extension}"
    output_file = algae_images_dir / filename
    output_file.write_bytes(blob)
    public_prefix = images_public_prefix.rstrip("/")
    return f"{public_prefix}/{safe_name}/{filename}"


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

    for index, block in enumerate(blocks):
        if block["type"] == "image":
            if resolved_images_output_dir is None:
                continue
            algae_name = current.get("scientific_name") or f"record-{len(records) + 1}"
            image_path = _save_image(
                blob=block["blob"],
                extension=block["extension"],
                image_index=current["image_counter"],
                algae_name=algae_name,
                images_output_dir=resolved_images_output_dir,
                images_public_prefix=images_public_prefix,
            )
            current["image_counter"] += 1
            current["images"].append(image_path)
            expect_image_caption = True
            continue

        text = block["text"]
        if expect_image_caption:
            if _looks_like_image_caption(text):
                current["image_captions"].append(text)
                expect_image_caption = False
                continue
            # We expected a caption right after the image but didn't see one.
            # Stop skipping paragraphs so we don't drop real content.
            expect_image_caption = False
        should_block = any(text.lower().startswith(prefix) for prefix in blocked_starts)
        record_start = None if should_block else detect_record_start(text=text, compiled_patterns=record_start_patterns)
        if record_start and following_markers:
            lookahead_slice = [
                candidate for candidate in blocks[index + 1 : index + 1 + marker_lookahead] if candidate["type"] == "paragraph"
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
            finalized = _finalize_record(current)
            if finalized:
                records.append(finalized)

            current = _new_record(source_file=source_file)
            current["scientific_name"] = detected_name
            current_section = default_section
            expect_image_caption = False

            if remaining_text:
                _append_section_line(current, default_section, remaining_text, char_styles=None)
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

    finalized = _finalize_record(current)
    if finalized:
        records.append(finalized)

    return records
