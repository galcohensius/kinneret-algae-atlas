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
        "image_counter": 1,
        "sections_buffer": {},
        "metadata": {"source_file": source_file},
    }


def _append_section_line(record: dict[str, Any], section_name: str, text: str):
    section_lines = record["sections_buffer"].setdefault(section_name, [])
    section_lines.append(text)


def _finalize_record(record: dict[str, Any]) -> AlgaeRecord | None:
    raw_sections = {
        section: " ".join(lines).strip()
        for section, lines in record["sections_buffer"].items()
        if lines
    }
    sections = _normalize_structured_fields(raw_sections)

    if not record["scientific_name"] and not any(sections.values()):
        return None

    return AlgaeRecord(
        scientific_name=record["scientific_name"],
        images=record["images"],
        sections=sections,
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
    source_text = raw_sections.get("notes", "").strip()
    if not source_text:
        source_text = " ".join(value for value in raw_sections.values() if value).strip()
    fields: dict[str, str] = {field_name: "" for field_name, _ in FIELD_ORDER}

    if not source_text:
        return fields

    label_variants = [re.escape(label) for _, labels in FIELD_ORDER for label in labels]
    labels_regex = "|".join(label_variants)
    marker_pattern = re.compile(rf"(?i)\b({labels_regex})\b(?:\s*\([^)]*\))?\s*:")
    markers = list(marker_pattern.finditer(source_text))

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
            end = markers[index + 1].start() if index + 1 < len(markers) else len(source_text)
            value = source_text[start:end].strip()
            if value:
                fields[field_name] = f"{fields[field_name]} {value}".strip()

    if not fields["ecology"] and raw_sections.get("ecology"):
        fields["ecology"] = raw_sections["ecology"].strip()

    if raw_sections.get("morphology") and not fields["morphological_features"]:
        fields["morphological_features"] = raw_sections["morphology"].strip()

    move_inline_further_reading_from_ecology(fields)

    fr = fields.get("further_reading", "").strip()
    if fr:
        fields["further_reading"] = normalize_further_reading_citation_boundaries(fr)

    return fields


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
            continue

        text = block["text"]
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

            if remaining_text:
                _append_section_line(current, default_section, remaining_text)
            continue

        detected_section = detect_section_heading(text=text, alias_lookup=section_alias_lookup)
        if detected_section:
            current_section = detected_section
            continue

        _append_section_line(current, current_section, text)

    finalized = _finalize_record(current)
    if finalized:
        records.append(finalized)

    return records
