"""Extract About page content from Word into data/processed/about.json."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from docx import Document

from algae_extractor.config import load_config
from algae_extractor.reader import paragraph_clean_text, source_modified_date
from algae_extractor.rich_text import paragraph_rich_segments
from algae_extractor.supplement_pipeline import (
    SUPPLEMENT_FILES_PUBLIC_PREFIX,
    supplement_file_name,
)

SECTION_HEADINGS = {
    "our vision": "our_vision",
    "vision": "our_vision",
    "study area": "study_area",
    "references cited": "references",
    "information presented in this atlas": "information",
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


def _is_all_bold(para) -> bool:
    runs = [run for run in para.runs if run.text.strip()]
    return bool(runs) and all(run.bold for run in runs)


def _link_citations(segments: list[dict], links: dict[str, str]) -> list[dict]:
    """Split segments around each cited text (e.g. "Berman et al. 2014") and link it."""
    for cited, href in links.items():
        linked: list[dict] = []
        for seg in segments:
            if "href" in seg or cited not in seg["text"]:
                linked.append(seg)
                continue
            before, *rest = seg["text"].split(cited)
            if before:
                linked.append({**seg, "text": before})
            for after in rest:
                linked.append({**seg, "text": cited, "href": href})
                if after:
                    linked.append({**seg, "text": after})
        segments = linked
    return segments


def parse_about_docx(docx_path: Path, citation_links: dict[str, str]) -> dict:
    """citation_links maps a citation as written in the text to the URL it links to."""
    doc = Document(str(docx_path))
    title = "About"
    # Body paragraphs are rich segments so Word sub/superscripts and italics survive.
    sections: dict[str, list] = {
        "study_area": [],
        "our_vision": [],
        "information": [],
        "references": [],
    }
    people: list[dict] = []
    current_section: str | None = None
    current_person: dict | None = None

    for para in doc.paragraphs:
        text = paragraph_clean_text(para).strip()
        if not text:
            continue

        lower = text.lower()
        if lower == "about":
            title = text
            continue

        # The site builds the "Cite this website as" line itself.
        if lower.startswith("cite this website as"):
            current_person = None
            continue

        section_key = SECTION_HEADINGS.get(lower.rstrip(":"))
        if section_key:
            current_section = section_key
            current_person = None
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
            current_person["paragraphs"].append(paragraph_rich_segments(para))
            continue

        if current_section == "information" and _is_all_bold(para):
            sections["information"].append({"heading": text})
        elif current_section == "references":
            sections["references"].append(text)
        elif current_section in sections:
            sections[current_section].append(
                _link_citations(paragraph_rich_segments(para), citation_links)
            )

    return {
        "title": title,
        "record_updated": source_modified_date(docx_path),
        "sections": sections,
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
        "--raw-dir",
        default="data/raw",
        help="Directory scanned for the About DOCX when --input is omitted.",
    )
    parser.add_argument(
        "--output",
        default="data/processed/about.json",
        help="Output JSON path.",
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Config JSON path (default: src/algae_extractor/default_config.json).",
    )
    args = parser.parse_args()

    if args.input:
        input_path = Path(args.input)
    else:
        discovered = _discover_about_input(Path(args.raw_dir))
        if discovered is None:
            raise SystemExit(
                f"No .docx About file found in {args.raw_dir} (looked for *about*.docx)."
            )
        input_path = discovered

    # Citations of supplements shipped as files link to the copy extract_supplements.py publishes.
    citation_links = {
        entry["cited_as"]: f"{SUPPLEMENT_FILES_PUBLIC_PREFIX}/{supplement_file_name(entry)}"
        for entry in load_config(args.config).get("supplement_files") or []
    }
    data = parse_about_docx(input_path, citation_links)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote About page ({len(data['collaborators'])} collaborators) to {output_path}")


if __name__ == "__main__":
    main()
