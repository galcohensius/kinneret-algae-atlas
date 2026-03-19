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
    sections = {
        section: " ".join(lines).strip()
        for section, lines in record["sections_buffer"].items()
        if lines
    }
    if not record["scientific_name"] and not sections:
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
