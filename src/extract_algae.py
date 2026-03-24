import argparse
import json
from pathlib import Path

from algae_extractor.pipeline import extract_records


def main():
    parser = argparse.ArgumentParser(
        description="Extract algae records from DOCX into structured JSON."
    )
    parser.add_argument(
        "--input",
        default="data/raw/Atlas-Examples to Gal V2.docx",
        help="Path to source DOCX file.",
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
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    records = extract_records(
        docx_path=args.input,
        config_path=args.config,
        images_output_dir=args.images_dir,
        images_public_prefix=args.images_public_prefix,
    )
    data = [record.to_dict() for record in records]

    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)

    print(f"Wrote {len(data)} records to {output_path}")


if __name__ == "__main__":
    main()
