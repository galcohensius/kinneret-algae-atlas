"""Tests for super/subscript rich segments.

Word super/subscript runs are baked to Unicode glyphs in plain text (so the
glossary, which has no rich rendering, still displays them), but rich segments
store the original ASCII plus a `superscript`/`subscript` flag so the frontend
can wrap them in <sup>/<sub>. This also recovers the decimal point in exponents
like D2.5264, which has no superscript glyph and otherwise lands on the baseline.
"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.reader import unmap_script_glyphs
from algae_extractor.pipeline import _char_styles_to_rich_segments


class TestUnmapScriptGlyphs(unittest.TestCase):
    def test_decimal_exponent_recovers_baseline_dot(self) -> None:
        # The baked plain form strands the decimal point on the baseline.
        self.assertEqual(unmap_script_glyphs("².⁵²⁶⁴"), "2.5264")

    def test_subscript_digits(self) -> None:
        self.assertEqual(unmap_script_glyphs("₃"), "3")  # NO_3
        self.assertEqual(unmap_script_glyphs("⁻¹"), "-1")  # mL^-1

    def test_non_script_text_unchanged(self) -> None:
        self.assertEqual(unmap_script_glyphs("D=4.5"), "D=4.5")


class TestRichSuperscriptSegments(unittest.TestCase):
    def test_superscript_run_becomes_ascii_segment_with_flag(self) -> None:
        # "D" neutral (0), exponent run "2.5264" superscript (bit 4); the baked
        # decimal point keeps the superscript style bit even though it has no glyph.
        text = "D².⁵²⁶⁴"
        char_styles = [0] + [4] * (len(text) - 1)
        segments = _char_styles_to_rich_segments(text, char_styles)
        self.assertEqual(
            segments,
            [
                {"text": "D", "italic": False, "bold": False},
                {"text": "2.5264", "italic": False, "bold": False, "superscript": True},
            ],
        )

    def test_subscript_run_sets_flag(self) -> None:
        text = "NH₄"  # "NH" neutral, "₄" subscript
        char_styles = [0, 0, 8]
        segments = _char_styles_to_rich_segments(text, char_styles)
        self.assertEqual(
            segments,
            [
                {"text": "NH", "italic": False, "bold": False},
                {"text": "4", "italic": False, "bold": False, "subscript": True},
            ],
        )


if __name__ == "__main__":
    unittest.main()
