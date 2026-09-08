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


def _newest_chart_part(raw_dir: Path) -> bytes | None:
    """Return chart1.xml from the newest source document that embeds a chart.

    Source filenames are date-stamped and the charted species has moved between
    documents, so discover the part instead of pinning one file name.
    """
    for docx in sorted(raw_dir.glob("*.docx"), reverse=True):
        with ZipFile(docx) as zf:
            if "word/charts/chart1.xml" in zf.namelist():
                return zf.read("word/charts/chart1.xml")
    return None


class TestChartFallbackRender(unittest.TestCase):
    def test_excel_serial_years(self) -> None:
        self.assertTrue(_looks_like_excel_serial_dates([25572.0, 30000.0, 44196.0]))
        self.assertFalse(_looks_like_excel_serial_dates([1990.0, 2000.0, 2010.0]))
        self.assertEqual(_excel_serial_to_year(25572), 1970)

    def test_renders_source_chart_with_axis_ink(self) -> None:
        blob = _newest_chart_part(ROOT / "data/raw")
        self.assertIsNotNone(blob, "no data/raw/*.docx carries a word/charts/chart1.xml part")
        assert blob is not None
        png = _render_chart_to_png(blob)
        self.assertIsNotNone(png)
        assert png is not None
        # Non-trivial PNG with enough ink that axis labels were drawn.
        self.assertGreater(len(png), 10_000)


if __name__ == "__main__":
    unittest.main()
