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
        default="data/raw/Examples to Gal.docx",
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
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    records = extract_records(docx_path=args.input, config_path=args.config)
    data = [record.to_dict() for record in records]

    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)

    print(f"Wrote {len(data)} records to {output_path}")


if __name__ == "__main__":
    main()
