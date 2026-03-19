import re
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph


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


def _iter_document_blocks(document: Document):
    body = document.element.body
    for child in body.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, document)
        elif isinstance(child, CT_Tbl):
            yield Table(child, document)


def iter_docx_content_blocks(docx_path: str | Path):
    document = Document(str(docx_path))

    for block in _iter_document_blocks(document):
        if isinstance(block, Table):
            continue

        text = normalize_whitespace(block.text)
        if text:
            yield {
                "type": "paragraph",
                "text": text,
                "style": getattr(block.style, "name", "") if block.style else "",
            }

        for run in block.runs:
            blips = run._element.xpath(".//a:blip")
            for blip in blips:
                relation_id = blip.get(qn("r:embed"))
                if not relation_id:
                    continue
                image_part = document.part.related_parts.get(relation_id)
                if not image_part:
                    continue
                extension = Path(getattr(image_part, "filename", "")).suffix.lower() or ".png"
                yield {
                    "type": "image",
                    "blob": image_part.blob,
                    "extension": extension,
                }
