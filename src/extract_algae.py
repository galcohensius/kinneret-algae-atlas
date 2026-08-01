import argparse
import fnmatch
import json
import re
from pathlib import Path

from algae_extractor.config import load_config
from algae_extractor.pipeline import extract_records, prune_catalog_images


_BINOMIAL_RE = re.compile(
    r"^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)"
)
_GENUS_RE = re.compile(r"^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b")


def _slugify(value: str) -> str:
    normalized = re.sub(r"\s+", "-", value.strip().lower())
    normalized = re.sub(r"[^a-z0-9-]", "", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "unnamed"


def _record_merge_key(record: dict, index: int) -> str:
    scientific_name = (record.get("scientific_name") or "").strip()
    if not scientific_name:
        return f"unnamed-{index + 1}"
    binomial = _BINOMIAL_RE.match(scientific_name)
    if binomial:
        return _slugify(binomial.group(1))
    genus = _GENUS_RE.match(scientific_name)
    if genus:
        return _slugify(genus.group(1))
    return _slugify(scientific_name)


def _merge_text(existing: str, incoming: str) -> str:
    a = (existing or "").strip()
    b = (incoming or "").strip()
    if not a:
        return b
    if not b or a == b:
        return a
    return f"{a}\n\n{b}"


def _merge_rich_segments(existing: list[dict], incoming: list[dict]) -> list[dict]:
    if not existing:
        return list(incoming or [])
    if not incoming:
        return list(existing)
    if existing == incoming:
        return list(existing)
    out = list(existing)
    out.append({"text": "\n\n", "italic": False, "bold": False})
    out.extend(incoming)
    return out


def _merge_record_metadata(existing: dict, incoming: dict) -> dict:
    merged = dict(existing or {})
    source_files: list[str] = []

    for candidate in (
        merged.get("source_file"),
        *(merged.get("source_files") or []),
        (incoming or {}).get("source_file"),
        *((incoming or {}).get("source_files") or []),
    ):
        if isinstance(candidate, str) and candidate and candidate not in source_files:
            source_files.append(candidate)

    if source_files:
        merged["source_file"] = source_files[0]
        merged["source_files"] = source_files

    incoming_record_updated = (incoming or {}).get("record_updated")
    current_record_updated = merged.get("record_updated")
    if isinstance(incoming_record_updated, str):
        if not isinstance(current_record_updated, str) or incoming_record_updated > current_record_updated:
            merged["record_updated"] = incoming_record_updated

    for key, value in (incoming or {}).items():
        if key in {"source_file", "source_files", "record_updated"}:
            continue
        if key not in merged or merged[key] in (None, "", [], {}):
            merged[key] = value

    return merged


def _merge_records(records: list[dict]) -> list[dict]:
    merged: list[dict] = []
    index_by_key: dict[str, int] = {}
    for idx, record in enumerate(records):
        key = _record_merge_key(record, idx)
        existing_index = index_by_key.get(key)
        if existing_index is None:
            index_by_key[key] = len(merged)
            merged.append(record)
            continue

        target = merged[existing_index]
        existing_name = (target.get("scientific_name") or "").strip()
        incoming_name = (record.get("scientific_name") or "").strip()
        if len(incoming_name) > len(existing_name):
            target["scientific_name"] = incoming_name

        existing_images = target.setdefault("images", [])
        existing_captions = target.setdefault("image_captions", [])
        existing_captions_rich = target.setdefault("image_captions_rich", [])
        seen_images = set(existing_images)
        for i, image_path in enumerate(record.get("images") or []):
            if image_path in seen_images:
                continue
            existing_images.append(image_path)
            existing_captions.append((record.get("image_captions") or [""] * (i + 1))[i] if i < len(record.get("image_captions") or []) else "")
            existing_captions_rich.append((record.get("image_captions_rich") or [[]] * (i + 1))[i] if i < len(record.get("image_captions_rich") or []) else [])
            seen_images.add(image_path)

        target_sections = target.setdefault("sections", {})
        for section_name, section_text in (record.get("sections") or {}).items():
            target_sections[section_name] = _merge_text(
                target_sections.get(section_name, ""), section_text
            )

        target_sections_rich = target.setdefault("sections_rich", {})
        for section_name, segments in (record.get("sections_rich") or {}).items():
            target_sections_rich[section_name] = _merge_rich_segments(
                target_sections_rich.get(section_name, []), segments
            )

        target["metadata"] = _merge_record_metadata(
            target.get("metadata") or {}, record.get("metadata") or {}
        )

    return merged


def _discover_inputs(raw_dir: Path, exclude_globs: list[str]) -> list[Path]:
    candidates = sorted(raw_dir.glob("*.docx"))
    if not exclude_globs:
        return candidates
    selected: list[Path] = []
    for candidate in candidates:
        lower_name = candidate.name.lower()
        blocked = any(fnmatch.fnmatch(lower_name, pattern.lower()) for pattern in exclude_globs)
        if not blocked:
            selected.append(candidate)
    return selected


def main():
    parser = argparse.ArgumentParser(
        description="Extract algae records from one or more DOCX files into structured JSON."
    )
    parser.add_argument(
        "--input",
        action="append",
        default=[],
        help="Path to source DOCX file. Repeat to include multiple files.",
    )
    parser.add_argument(
        "--raw-dir",
        default="data/raw",
        help="Directory scanned for default DOCX inputs when --input is not passed.",
    )
    parser.add_argument(
        "--exclude-glob",
        action="append",
        default=["*suppl*.docx", "*glossary*.docx", "*about*.docx"],
        help=(
            "Glob pattern (against filename) excluded from raw-dir auto-discovery. "
            "Supplements (*suppl*), the glossary (*glossary*), and About (*about*) "
            "have their own handling and are excluded by default. Repeat for multiple patterns."
        ),
    )
    parser.add_argument(
        "--output",
        default="data/processed/algae_records.json",
        help="Path to output JSON file.",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Optional JSON config path. Uses package default if omitted.",
    )
    parser.add_argument(
        "--images-dir",
        default="public/algae-images",
        help="Directory where extracted images are saved.",
    )
    parser.add_argument(
        "--images-public-prefix",
        default="/algae-images",
        help="Public URL prefix used by the web app for extracted images.",
    )
    parser.add_argument(
        "--use-word-renderer",
        action="store_true",
        help="Use Microsoft Word COM rendering for chart objects (Windows only).",
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if args.input:
        inputs = [Path(p) for p in args.input]
    else:
        inputs = _discover_inputs(Path(args.raw_dir), args.exclude_glob)
    if not inputs:
        raise SystemExit(
            "No input DOCX files found. Pass --input or add files under "
            f"{args.raw_dir} that do not match exclude globs."
        )

    data: list[dict] = []
    for docx_path in inputs:
        records = extract_records(
            docx_path=docx_path,
            config_path=args.config,
            images_output_dir=args.images_dir,
            images_public_prefix=args.images_public_prefix,
            use_word_renderer=args.use_word_renderer,
        )
        data.extend(record.to_dict() for record in records)

    data = _merge_records(data)

    config = load_config(args.config)
    protected_slugs = {
        str(entry.get("slug") or "").strip()
        for entry in (config.get("supplements") or [])
        if isinstance(entry, dict) and entry.get("slug")
    }

    images_dir = Path(args.images_dir)
    if images_dir.is_dir():
        files_removed, dirs_removed = prune_catalog_images(
            data, images_dir, protected_slugs=protected_slugs
        )
        if files_removed or dirs_removed:
            print(
                f"Pruned {files_removed} stale image file(s) and "
                f"{dirs_removed} obsolete species image folder(s)."
            )

    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)

    print(f"Wrote {len(data)} merged records from {len(inputs)} file(s) to {output_path}")


if __name__ == "__main__":
    main()
