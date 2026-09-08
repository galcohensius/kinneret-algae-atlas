"""Per-character style ints -> rich JSON segments, shared by the species and supplement pipelines.

A style int is a bit set: 1 italic, 2 bold, 4 superscript, 8 subscript.
"""

from __future__ import annotations

from typing import Any

from .reader import unmap_script_glyphs


def neutral_char_styles(text: str) -> list[int]:
    """Neutral style for every character when no run-level info is available."""
    return [0] * len(text)


def _make_rich_segment(chunk: str, style_int: int) -> dict[str, Any]:
    superscript = bool(style_int & 4)
    subscript = bool(style_int & 8)
    # Super/subscript runs are stored as ASCII plus a flag so the frontend can render
    # <sup>/<sub>; the baked display glyphs are undone here.
    if superscript or subscript:
        chunk = unmap_script_glyphs(chunk)
    segment: dict[str, Any] = {
        "text": chunk,
        "italic": bool(style_int & 1),
        "bold": bool(style_int & 2),
    }
    if superscript:
        segment["superscript"] = True
    if subscript:
        segment["subscript"] = True
    return segment


def char_styles_to_rich_segments(text: str, char_styles: list[int]) -> list[dict[str, Any]]:
    """Group consecutive equally styled characters into segments; mismatched styles are neutral."""
    if not text:
        return []
    styles = char_styles if len(char_styles) == len(text) else neutral_char_styles(text)

    segments: list[dict[str, Any]] = []
    cur_style = styles[0]
    start = 0
    for i in range(1, len(text)):
        if styles[i] != cur_style:
            segments.append(_make_rich_segment(text[start:i], cur_style))
            start = i
            cur_style = styles[i]
    segments.append(_make_rich_segment(text[start:], cur_style))
    return segments
