"""Extract glossary terms from Word into data/processed/glossary.json."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from zipfile import ZipFile

from glossary_extractor.parse import parse_glossary_text


def _read_docx_paragraphs(path: Path) -> str:
    from docx import Document

    from algae_extractor.reader import paragraph_clean_text

    doc = Document(str(path))
    return "\n".join(paragraph_clean_text(p) for p in doc.paragraphs)


def read_glossary_source(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return _read_docx_paragraphs(path)
    raise SystemExit(f"Unsupported glossary format: {path}. Save glossary sources as .docx.")


def _extract_glossary_plates(
    *,
    source_path: Path,
    output_dir: Path,
    public_prefix: str,
) -> list[dict[str, str]]:
    """
    Extract the final two glossary images as Cox plates and return metadata for rendering.
    The updated glossary source places these two figures at the end of the document.
    """
    if source_path.suffix.lower() == ".docx":
        working_docx = source_path
    else:
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    media_items: list[tuple[str, bytes]] = []
    with ZipFile(str(working_docx)) as zf:
        for name in sorted(zf.namelist()):
            lower = name.lower()
            if not lower.startswith("word/media/"):
                continue
            ext = Path(lower).suffix
            if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
                continue
            media_items.append((name, zf.read(name)))

    if len(media_items) < 2:
        return []

    selected = media_items[-2:]
    public_base = public_prefix.rstrip("/")
    if not public_base.startswith("/"):
        public_base = f"/{public_base}"

    plates: list[dict[str, str]] = []
    for index, (name, blob) in enumerate(selected, start=1):
        extension = Path(name).suffix.lower()
        if extension not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
            extension = ".png"
        filename = f"cox-1996-plate-{index}{extension}"
        target = output_dir / filename
        target.write_bytes(blob)
        plates.append(
            {
                "id": f"cox-1996-plate-{index}",
                "label": f"Plate {index}",
                "src": f"{public_base}/{filename}",
            }
        )

    return plates


def _normalize_cox_figure_references(data: dict) -> None:
    """Normalize glossary references from Cox Fig. 5/6 to Cox Plate 1/2."""
    entries = data.get("entries")
    if not isinstance(entries, list):
        return
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        definition = entry.get("definition")
        if not isinstance(definition, str):
            continue
        definition = re.sub(
            r"(?i)see\s+Cox\s*\(1996\)\s*Fig\.\s*5\b",
            "see Cox (1996) Plate 1",
            definition,
        )
        definition = re.sub(
            r"(?i)see\s+Cox\s*\(1996\)\s*Fig\.\s*6\b",
            "see Cox (1996) Plate 2",
            definition,
        )
        entry["definition"] = definition


def _discover_glossary_input(raw_dir: Path) -> Path | None:
    """Find the glossary source in raw_dir, preferring .docx and the newest name.

    Source filenames are date-stamped (e.g. "1-Glossary 2026-06-11.docx"), so the
    fixed default cannot be relied on. Sort last = most recent date for these names.
    """
    candidates = sorted(
        p for p in raw_dir.glob("*.docx") if "glossary" in p.name.lower()
    )
    if not candidates:
        return None
    return candidates[-1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract glossary JSON from Word.")
    parser.add_argument(
        "--input",
        default=None,
        help=(
            "Path to glossary Word file (.docx). "
            "If omitted, the newest data/raw/*glossary*.docx is auto-discovered."
        ),
    )
    parser.add_argument(
        "--output",
        default="data/processed/glossary.json",
        help="Path to output JSON file.",
    )
    parser.add_argument(
        "--images-dir",
        default="public/glossary-images",
        help="Directory where extracted glossary plate images are saved.",
    )
    parser.add_argument(
        "--images-public-prefix",
        default="/glossary-images",
        help="Public URL prefix used by the web app for glossary plate images.",
    )
    args = parser.parse_args()

    if args.input:
        input_path = Path(args.input)
    else:
        discovered = _discover_glossary_input(Path("data/raw"))
        if discovered is None:
            raise SystemExit("No .docx glossary file found in data/raw (looked for *glossary*.docx).")
        input_path = discovered

    output_path = Path(args.output)
    images_dir = Path(args.images_dir)
    if not input_path.is_file():
        raise SystemExit(f"Glossary input not found: {input_path}")

    text = read_glossary_source(input_path)
    data = parse_glossary_text(text)
    _normalize_cox_figure_references(data)
    data["plates"] = _extract_glossary_plates(
        source_path=input_path,
        output_dir=images_dir,
        public_prefix=args.images_public_prefix,
    )
    data["source_file"] = input_path.name

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)

    print(f"Wrote {len(data['entries'])} glossary entries to {output_path}")


if __name__ == "__main__":
    main()
