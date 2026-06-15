"""
Supplement document extractor.

Reads a single supplement .docx and produces one SupplementRecord dict
(JSON-serialisable, matching the SupplementRecord TypeScript type).

Section splitting heuristic:
  - Word heading styles  (Heading 1 / 2 / 3 / Title / Subtitle) start a new section.
  - A short paragraph where every non-space character is bold is treated as a heading
    when no Word heading style is present.
  - Everything else accumulates as rich-text lines under the current section.
"""

from datetime import date
from io import BytesIO
from pathlib import Path
from typing import Any
import re

from PIL import Image

from .reader import iter_docx_content_blocks, unmap_script_glyphs


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _char_styles_to_rich(text: str, char_styles: list[int]) -> list[dict[str, Any]]:
    """Convert a parallel char_styles array into a list of rich segments."""
    if not text:
        return []
    if not char_styles or len(char_styles) != len(text):
        return [{"text": text, "italic": False, "bold": False}]

    segments: list[dict[str, Any]] = []
    i = 0
    while i < len(text):
        style = char_styles[i]
        j = i + 1
        while j < len(text) and char_styles[j] == style:
            j += 1
        chunk = text[i:j]
        superscript = bool(style & 4)
        subscript = bool(style & 8)
        # Super/subscript runs are stored as ASCII plus a flag so the frontend can
        # render <sup>/<sub>; the baked display glyphs are undone here.
        if superscript or subscript:
            chunk = unmap_script_glyphs(chunk)
        segment: dict[str, Any] = {
            "text": chunk,
            "italic": bool(style & 1),
            "bold": bool(style & 2),
        }
        if superscript:
            segment["superscript"] = True
        if subscript:
            segment["subscript"] = True
        segments.append(segment)
        i = j
    return segments


def _is_heading_style(style_name: str) -> bool:
    name = (style_name or "").strip().lower()
    return name.startswith("heading") or name in {"title", "subtitle"}


def _is_implicit_heading(text: str, char_styles: list[int]) -> bool:
    """Short paragraph where every non-whitespace character is bold."""
    if not text or len(text) > 120:
        return False
    if not char_styles or len(char_styles) != len(text):
        return False
    non_space = [(ch, char_styles[i]) for i, ch in enumerate(text) if not ch.isspace()]
    if not non_space:
        return False
    return all((s & 2) for _, s in non_space)


def _section_key(heading: str) -> str:
    """Snake_case key from a heading string."""
    key = re.sub(r"\W+", "_", heading.strip().lower()).strip("_")
    return key or "content"


def _save_image(
    blob: bytes,
    extension: str,
    images_output_dir: Path,
    slug: str,
    stem: str,
    images_public_prefix: str,
) -> str:
    img_dir = images_output_dir / slug
    img_dir.mkdir(parents=True, exist_ok=True)

    if extension.lower() in (".tif", ".tiff"):
        out_path = img_dir / f"{stem}.png"
        img = Image.open(BytesIO(blob))
        img.save(out_path, format="PNG")
        return f"{images_public_prefix}/{slug}/{stem}.png"

    out_path = img_dir / f"{stem}{extension}"
    out_path.write_bytes(blob)
    return f"{images_public_prefix}/{slug}/{stem}{extension}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_supplement(
    docx_path: str | Path,
    supplement_meta: dict[str, Any],
    *,
    images_output_dir: Path | None = None,
    images_public_prefix: str = "/algae-images",
) -> dict[str, Any]:
    """
    Extract one supplement document into a dict matching the SupplementRecord schema.

    supplement_meta must contain: id, slug, title.
    Optional key: linked_taxa (list of species slugs that reference this supplement).
    """
    docx_path = Path(docx_path)
    sup_id: str = supplement_meta["id"]
    slug: str = supplement_meta["slug"]
    title: str = supplement_meta["title"]
    linked_taxa: list[str] = list(supplement_meta.get("linked_taxa") or [])

    # sections_buffer: section_key -> list of {text, char_styles}
    sections_buffer: dict[str, list[dict[str, Any]]] = {}
    current_section = "content"

    images: list[str] = []
    image_captions: list[str] = []
    image_captions_rich: list[list[dict[str, Any]]] = []
    image_counter = 1
    # A pending image blob path waits to be paired with a caption paragraph.
    pending_image: str | None = None

    def append_line(section: str, text: str, char_styles: list[int]) -> None:
        sections_buffer.setdefault(section, []).append(
            {"text": text, "char_styles": char_styles}
        )

    for block in iter_docx_content_blocks(docx_path):
        btype: str = block.get("type", "")

        if btype == "page_break":
            continue

        if btype == "image":
            # Save image and hold it until we know if next paragraph is a caption.
            if images_output_dir is not None:
                stem = f"figure-{image_counter}"
                path = _save_image(
                    blob=block["blob"],
                    extension=block["extension"],
                    images_output_dir=images_output_dir,
                    slug=slug,
                    stem=stem,
                    images_public_prefix=images_public_prefix,
                )
                if pending_image is not None:
                    # Previous image had no caption — flush it now.
                    images.append(pending_image)
                    image_captions.append("")
                    image_captions_rich.append([])
                pending_image = path
                image_counter += 1
            continue

        if btype == "table":
            # Flush any pending image without a caption.
            if pending_image is not None:
                images.append(pending_image)
                image_captions.append("")
                image_captions_rich.append([])
                pending_image = None

            rows: list[list[str]] = block.get("rows", [])
            for row in rows:
                line = " | ".join(c for c in row if c.strip())
                if line:
                    append_line(current_section, line, [0] * len(line))
            continue

        if btype == "paragraph":
            text: str = block.get("text", "")
            char_styles: list[int] = block.get("char_styles", [])
            style_name: str = block.get("style", "")

            # Try to pair with a pending image as a caption.
            if pending_image is not None:
                lower = text.lower()
                if any(lower.startswith(p) for p in ("figure", "fig.", "plate", "photo")):
                    images.append(pending_image)
                    image_captions.append(text)
                    image_captions_rich.append(_char_styles_to_rich(text, char_styles))
                    pending_image = None
                    continue
                else:
                    # Not a caption — flush image captionless before processing text.
                    images.append(pending_image)
                    image_captions.append("")
                    image_captions_rich.append([])
                    pending_image = None

            # Detect section headings.
            if _is_heading_style(style_name) or _is_implicit_heading(text, char_styles):
                current_section = _section_key(text)
                continue

            append_line(current_section, text, char_styles)

    # Flush last pending image.
    if pending_image is not None:
        images.append(pending_image)
        image_captions.append("")
        image_captions_rich.append([])

    # Build sections and sections_rich from buffer.
    sections: dict[str, str] = {}
    sections_rich: dict[str, list[dict[str, Any]]] = {}

    for section_key, lines in sections_buffer.items():
        non_empty = [l for l in lines if l["text"]]
        if not non_empty:
            continue

        sections[section_key] = "\n".join(l["text"] for l in non_empty)

        rich: list[dict[str, Any]] = []
        for i, line in enumerate(non_empty):
            rich.extend(_char_styles_to_rich(line["text"], line["char_styles"]))
            if i + 1 < len(non_empty):
                rich.append({"text": "\n", "italic": False, "bold": False})
        sections_rich[section_key] = rich

    return {
        "id": sup_id,
        "slug": slug,
        "title": title,
        "linked_taxa": linked_taxa,
        "sections": sections,
        "sections_rich": sections_rich,
        "images": images,
        "image_captions": image_captions,
        "image_captions_rich": image_captions_rich,
        "metadata": {
            "source_file": docx_path.name,
            "record_updated": date.today().isoformat(),
        },
    }
