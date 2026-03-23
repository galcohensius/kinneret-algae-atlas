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


def _normalize_text_and_styles(chars: list[tuple[str, int]]) -> tuple[str, list[int]]:
    """
    Normalize whitespace like `normalize_whitespace`, but also return per-character
    style flags aligned to the normalized text.

    Style flags are bit-packed:
      - bit 1: italic
      - bit 2: bold
      - bit 0: neutral
    """
    out_chars: list[str] = []
    out_styles: list[int] = []
    prev_was_space = False

    for ch, style in chars:
        is_space = ch.isspace()
        if is_space:
            if not prev_was_space and out_chars:
                out_chars.append(" ")
                out_styles.append(0)  # neutral style for whitespace
            prev_was_space = True
            continue

        out_chars.append(ch)
        out_styles.append(style)
        prev_was_space = False

    # Trim trailing space to match `.strip()` semantics.
    if out_chars and out_chars[-1] == " ":
        out_chars.pop()
        out_styles.pop()

    return ("".join(out_chars), out_styles)


def _paragraph_to_plain_and_styles(paragraph: Paragraph) -> tuple[str, list[int]] | None:
    chars: list[tuple[str, int]] = []
    for run in paragraph.runs:
        bold = bool(getattr(run, "bold", False))
        italic = bool(getattr(run, "italic", False))
        style = (1 if italic else 0) | (2 if bold else 0)
        if not run.text:
            continue
        chars.extend([(c, style) for c in run.text])

    if not chars:
        return None

    plain, styles = _normalize_text_and_styles(chars)
    if not plain:
        return None
    return plain, styles


def iter_docx_paragraphs(docx_path: str | Path):
    document = Document(str(docx_path))
    for paragraph in document.paragraphs:
        converted = _paragraph_to_plain_and_styles(paragraph)
        if not converted:
            continue
        text, char_styles = converted
        yield {
            "text": text,
            "char_styles": char_styles,
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

        paragraph_styles = _paragraph_to_plain_and_styles(block) if hasattr(block, "runs") else None
        if paragraph_styles:
            text, char_styles = paragraph_styles
            yield {
                "type": "paragraph",
                "text": text,
                "char_styles": char_styles,
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
