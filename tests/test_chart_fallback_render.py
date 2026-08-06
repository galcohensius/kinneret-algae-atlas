"""Tests for OOXML chart → PNG fallback rendering."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.reader import (  # noqa: E402
    _excel_serial_to_year,
    _looks_like_excel_serial_dates,
    _render_chart_to_png,
)


class TestChartFallbackRender(unittest.TestCase):
    def test_excel_serial_years(self) -> None:
        self.assertTrue(_looks_like_excel_serial_dates([25572.0, 30000.0, 44196.0]))
        self.assertFalse(_looks_like_excel_serial_dates([1990.0, 2000.0, 2010.0]))
        self.assertEqual(_excel_serial_to_year(25572), 1970)

    def test_renders_glochidinium_chart_with_axis_ink(self) -> None:
        docx = ROOT / "data/raw/1 Dinoflagellates 2026-06-10.docx"
        if not docx.is_file():
            self.skipTest("Dinoflagellates source missing")
        with ZipFile(docx) as zf:
            blob = zf.read("word/charts/chart1.xml")
        png = _render_chart_to_png(blob)
        self.assertIsNotNone(png)
        assert png is not None
        # Non-trivial PNG with enough ink that axis labels were drawn.
        self.assertGreater(len(png), 10_000)


if __name__ == "__main__":
    unittest.main()
