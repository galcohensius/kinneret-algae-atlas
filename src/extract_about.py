"""Extract About page content from Word into data/processed/about.json."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from docx import Document

from algae_extractor.reader import source_modified_date


SECTION_HEADINGS = {
    "our vision": "our_vision",
    "how to use this atlas": "how_to_use",
    "our collaborators": "collaborators",
}

PEOPLE_HEADINGS = {
    "tamar zohary": "tamar_zohary",
    "dr. tamar zohary": "tamar_zohary",
    "dr tamar zohary": "tamar_zohary",
    "alla alster": "alla_alster",
    "dr. alla alster": "alla_alster",
    "dr alla alster": "alla_alster",
    "gal cohensius": "gal_cohensius",
    "dr. gal cohensius": "gal_cohensius",
    "dr gal cohensius": "gal_cohensius",
}


def _discover_about_input(raw_dir: Path) -> Path | None:
    candidates = sorted(
        p for p in raw_dir.glob("*.docx") if "about" in p.name.lower()
    )
    return candidates[-1] if candidates else None


def parse_about_docx(docx_path: Path) -> dict:
    doc = Document(str(docx_path))
    title = "About"
    sections: dict[str, list[str]] = {
        "our_vision": [],
        "how_to_use": [],
        "collaborators_intro": [],
    }
    people: list[dict] = []
    current_section: str | None = None
    current_person: dict | None = None

    for para in doc.paragraphs:
        text = (para.text or "").strip()
        if not text:
            continue

        lower = text.lower()
        if lower == "about":
            title = text
            continue

        section_key = SECTION_HEADINGS.get(lower)
        if section_key:
            current_section = section_key
            current_person = None
            if section_key == "collaborators":
                current_section = "collaborators"
            continue

        # "How to use this atlas [to be written]." is a placeholder — skip until real copy exists.
        if lower.startswith("how to use this atlas"):
            current_section = "how_to_use"
            current_person = None
            if "[to be written]" in lower:
                continue
            remainder = text.split("]", 1)[-1].strip(" .") if "]" in text else ""
            if remainder:
                sections["how_to_use"].append(remainder)
            continue

        person_key = PEOPLE_HEADINGS.get(lower)
        if person_key and current_section in {"collaborators", None}:
            current_section = "collaborators"
            current_person = {
                "id": person_key,
                "name": text,
                "paragraphs": [],
                "links": [],
            }
            people.append(current_person)
            continue

        if text.startswith("http://") or text.startswith("https://"):
            if current_person is not None:
                current_person["links"].append(text)
            continue

        if current_person is not None:
            current_person["paragraphs"].append(text)
            continue

        if current_section == "our_vision":
            sections["our_vision"].append(text)
        elif current_section == "how_to_use":
            sections["how_to_use"].append(text)

    return {
        "title": title,
        "record_updated": source_modified_date(docx_path),
        "sections": {
            "our_vision": sections["our_vision"],
            "how_to_use": [
                p for p in sections["how_to_use"] if p != "[to be written]"
            ],
        },
        "collaborators": people,
        "metadata": {
            "source_file": docx_path.name,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract About JSON from Word.")
    parser.add_argument(
        "--input",
        default=None,
        help="Path to About .docx. If omitted, newest data/raw/*about*.docx is used.",
    )
    parser.add_argument(
        "--output",
        default="data/processed/about.json",
        help="Output JSON path.",
    )
    args = parser.parse_args()

    if args.input:
        input_path = Path(args.input)
    else:
        discovered = _discover_about_input(Path("data/raw"))
        if discovered is None:
            raise SystemExit("No .docx About file found in data/raw (looked for *about*.docx).")
        input_path = discovered

    data = parse_about_docx(input_path)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote About page ({len(data['collaborators'])} collaborators) to {output_path}")


if __name__ == "__main__":
    main()
