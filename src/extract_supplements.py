"""
Extract a supplement .docx into data/processed/supplements.json.

Usage:
    python src/extract_supplements.py

    # Or force one/more source files:
    python src/extract_supplements.py \\
        --input "data/raw/9-Suppl1 cunningtoni vs elpatiewskyi.docx"

The output file is an array; running for multiple supplements upserts by id
so each run only replaces the entry matching the current document.
"""

import argparse
import json
import sys
from pathlib import Path


def _find_supplement_meta(
    supplements_config: list[dict],
    docx_path: Path,
) -> dict | None:
    """
    Match a supplement config entry to the given docx path.

    Matching order:
      1. Config entry id is a substring of the stem (case-insensitive), or vice-versa.
      2. Config entry slug is a substring of the stem.
      3. Fall back to the first config entry with a warning.
    """
    stem = docx_path.stem.lower().replace(" ", "-")

    for entry in supplements_config:
        entry_id = (entry.get("id") or "").lower()
        if entry_id and (entry_id in stem or stem in entry_id):
            return entry

    for entry in supplements_config:
        entry_slug = (entry.get("slug") or "").lower()
        if entry_slug and entry_slug in stem:
            return entry

    if supplements_config:
        chosen = supplements_config[0]
        print(
            f"Warning: no config entry matched '{docx_path.name}'; "
            f"using first entry '{chosen.get('id')}'.",
            file=sys.stderr,
        )
        return chosen

    return None


def _discover_supplement_inputs(raw_dir: Path) -> list[Path]:
    """Find supplement DOCX files in raw_dir."""
    return sorted(
        p
        for p in raw_dir.glob("*.docx")
        if "suppl" in p.name.lower() or "supplement" in p.name.lower()
    )


def _upsert_supplement(existing: list[dict], record: dict) -> bool:
    """Return True when an existing record was replaced."""
    record_id = record["id"]
    for i, item in enumerate(existing):
        if item.get("id") == record_id:
            existing[i] = record
            return True
    existing.append(record)
    return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract one or more supplement DOCX files into supplements.json."
    )
    parser.add_argument(
        "--input",
        action="append",
        default=[],
        help=(
            "Path to a supplement .docx file. Repeat for multiple files. "
            "If omitted, data/raw/*suppl*.docx and *supplement*.docx are auto-discovered."
        ),
    )
    parser.add_argument(
        "--raw-dir",
        default="data/raw",
        help="Directory scanned for supplement DOCX files when --input is omitted.",
    )
    parser.add_argument(
        "--output",
        default="data/processed/supplements.json",
        help="Output JSON path (default: data/processed/supplements.json).",
    )
    parser.add_argument(
        "--images-dir",
        default="public/algae-images",
        help="Directory where extracted images are saved.",
    )
    parser.add_argument(
        "--images-public-prefix",
        default="/algae-images",
        help="Public URL prefix for extracted images.",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Config JSON path (default: src/algae_extractor/default_config.json).",
    )
    args = parser.parse_args()

    # Ensure the algae_extractor package is importable when running from repo root.
    sys.path.insert(0, str(Path(__file__).parent))

    from algae_extractor.config import load_config
    from algae_extractor.supplement_pipeline import extract_supplement

    config = load_config(args.config)
    supplements_config: list[dict] = config.get("supplements") or []

    inputs = [Path(p) for p in args.input] if args.input else _discover_supplement_inputs(Path(args.raw_dir))
    if not inputs:
        sys.exit(
            "No supplement DOCX files found. Pass --input or add files under "
            f"{args.raw_dir} with 'suppl' or 'supplement' in the filename."
        )
    for docx_path in inputs:
        if not docx_path.exists():
            sys.exit(f"Input file not found: {docx_path}")

    images_output_dir = Path(args.images_dir) if args.images_dir else None

    output_path = Path(args.output)
    existing: list[dict] = []
    if output_path.exists():
        try:
            raw = json.loads(output_path.read_text(encoding="utf-8"))
            existing = raw if isinstance(raw, list) else []
        except (json.JSONDecodeError, OSError):
            existing = []

    for docx_path in inputs:
        supplement_meta = _find_supplement_meta(supplements_config, docx_path)
        if supplement_meta is None:
            sys.exit(
                f"No matching entry in the 'supplements' config block for '{docx_path.name}'.\n"
                "Add an entry to src/algae_extractor/default_config.json."
            )

        record = extract_supplement(
            docx_path,
            supplement_meta,
            images_output_dir=images_output_dir,
            images_public_prefix=args.images_public_prefix,
        )
        replaced = _upsert_supplement(existing, record)
        action = "Updated" if replaced else "Added"
        print(f"{action} '{record['id']}' from {docx_path.name}.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"{len(existing)} supplement(s) in {output_path}.")


if __name__ == "__main__":
    main()
