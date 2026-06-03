"""Extract glossary terms from Word into data/processed/glossary.json."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from glossary_extractor.parse import parse_glossary_text


def _read_docx_paragraphs(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs)


def _read_doc_via_word_com(path: Path) -> str:
    import win32com.client  # type: ignore[import-untyped]

    app = win32com.client.DispatchEx("Word.Application")
    app.Visible = False
    try:
        doc = app.Documents.Open(str(path.resolve()), ReadOnly=True)
        try:
            return doc.Content.Text
        finally:
            doc.Close(False)
    finally:
        app.Quit()


def read_glossary_source(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return _read_docx_paragraphs(path)
    if suffix == ".doc":
        if sys.platform != "win32":
            raise SystemExit(
                f"Cannot read legacy .doc on {sys.platform}. "
                "Run extraction on Windows or save the glossary as .docx."
            )
        return _read_doc_via_word_com(path)
    raise SystemExit(f"Unsupported glossary format: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract glossary JSON from Word.")
    parser.add_argument(
        "--input",
        default="data/raw/1-Glossary.doc",
        help="Path to glossary Word file (.doc or .docx).",
    )
    parser.add_argument(
        "--output",
        default="data/processed/glossary.json",
        help="Path to output JSON file.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    if not input_path.is_file():
        raise SystemExit(f"Glossary input not found: {input_path}")

    text = read_glossary_source(input_path)
    data = parse_glossary_text(text)
    data["source_file"] = input_path.name

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)

    print(f"Wrote {len(data['entries'])} glossary entries to {output_path}")


if __name__ == "__main__":
    main()
