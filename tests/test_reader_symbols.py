"""Tests for Symbol-font and super/subscript normalization in the docx reader.

Word stores micron/Greek glyphs as Adobe "Symbol" font runs (the byte for "m"
renders as micro µ, "p" renders as π) or in the F0xx Private Use Area, and stores
units like m^-2 / NO_3 as superscript/subscript runs. These must be recovered as
real Unicode during extraction.
"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.reader import (
    _apply_script_map,
    _remap_symbol_text,
    _SUBSCRIPT_MAP,
    _SUPERSCRIPT_MAP,
)


class TestSymbolFontRemap(unittest.TestCase):
    def test_symbol_font_letters_map_to_greek(self) -> None:
        # In Symbol font the Latin "m"/"p" render as micron µ / π.
        self.assertEqual(_remap_symbol_text("m", is_symbol_font=True), "μ")
        self.assertEqual(_remap_symbol_text("p", is_symbol_font=True), "π")

    def test_private_use_area_maps_regardless_of_font_flag(self) -> None:
        # Some Word builds store the Symbol glyph at 0xF000 + code (e.g. F06D = "m").
        self.assertEqual(_remap_symbol_text("", is_symbol_font=False), "μ")
        self.assertEqual(_remap_symbol_text("", is_symbol_font=False), "π")

    def test_pua_space_and_digits_fall_back_to_ascii(self) -> None:
        # F020 is a Symbol-font space; F033 is "3". Neither is in the Greek table,
        # so they must resolve to plain ASCII, not leak the invisible PUA char.
        self.assertEqual(_remap_symbol_text("", is_symbol_font=False), " ")
        self.assertEqual(_remap_symbol_text("", is_symbol_font=False), "3")

    def test_non_symbol_text_unchanged(self) -> None:
        # Plain "m"/"p" outside Symbol font must stay Latin (e.g. the "m" in "µm").
        self.assertEqual(_remap_symbol_text("mp", is_symbol_font=False), "mp")

    def test_digits_and_space_in_symbol_font_unchanged(self) -> None:
        self.assertEqual(_remap_symbol_text("3 ", is_symbol_font=True), "3 ")


class TestScriptMaps(unittest.TestCase):
    def test_superscript_units(self) -> None:
        self.assertEqual(_apply_script_map("3", _SUPERSCRIPT_MAP), "³")
        self.assertEqual(_apply_script_map("-2", _SUPERSCRIPT_MAP), "⁻²")
        self.assertEqual(_apply_script_map("-1", _SUPERSCRIPT_MAP), "⁻¹")

    def test_subscript_units(self) -> None:
        self.assertEqual(_apply_script_map("3", _SUBSCRIPT_MAP), "₃")  # NO_3
        self.assertEqual(_apply_script_map("4", _SUBSCRIPT_MAP), "₄")  # NH_4
        self.assertEqual(_apply_script_map("eu", _SUBSCRIPT_MAP), "ₑᵤ")  # Z_eu


if __name__ == "__main__":
    unittest.main()
