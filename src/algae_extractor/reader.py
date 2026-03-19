import re
from pathlib import Path

from docx import Document


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def iter_docx_paragraphs(docx_path: str | Path):
    document = Document(str(docx_path))
    for paragraph in document.paragraphs:
        text = normalize_whitespace(paragraph.text)
        if not text:
            continue
        yield {
            "text": text,
            "style": getattr(paragraph.style, "name", "") if paragraph.style else "",
        }
