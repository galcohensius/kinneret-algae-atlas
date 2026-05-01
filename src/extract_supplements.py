"""
Extract a supplement .docx into data/processed/supplements.json.

Usage:
    python src/extract_supplements.py \\
        --input "data/raw/9-Suppl1 cunningtoni vs elpatiewskyi.docx" \\
        --output data/processed/supplements.json \\
        --images-dir public/algae-images

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


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract a supplement DOCX into supplements.json."
    )
    parser.add_argument("--input", required=True, help="Path to the supplement .docx file.")
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

    docx_path = Path(args.input)
    if not docx_path.exists():
        sys.exit(f"Input file not found: {docx_path}")

    supplement_meta = _find_supplement_meta(supplements_config, docx_path)
    if supplement_meta is None:
        sys.exit(
            f"No matching entry in the 'supplements' config block for '{docx_path.name}'.\n"
            "Add an entry to src/algae_extractor/default_config.json."
        )

    images_output_dir = Path(args.images_dir) if args.images_dir else None

    record = extract_supplement(
        docx_path,
        supplement_meta,
        images_output_dir=images_output_dir,
        images_public_prefix=args.images_public_prefix,
    )

    # Upsert into existing output array.
    output_path = Path(args.output)
    existing: list[dict] = []
    if output_path.exists():
        try:
            raw = json.loads(output_path.read_text(encoding="utf-8"))
            existing = raw if isinstance(raw, list) else []
        except (json.JSONDecodeError, OSError):
            existing = []

    record_id = record["id"]
    replaced = False
    for i, item in enumerate(existing):
        if item.get("id") == record_id:
            existing[i] = record
            replaced = True
            break
    if not replaced:
        existing.append(record)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    action = "Updated" if replaced else "Added"
    print(f"{action} '{record_id}'. {len(existing)} supplement(s) in {output_path}.")


if __name__ == "__main__":
    main()
