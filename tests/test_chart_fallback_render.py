"""Tests for OOXML chart → PNG fallback rendering."""

from __future__ import annotations

import io
import unittest
from pathlib import Path
from zipfile import ZipFile

from PIL import Image

from algae_extractor.reader import (
    _excel_serial_to_year,
    _looks_like_excel_serial_dates,
    _render_chart_to_png,
)

ROOT = Path(__file__).resolve().parents[1]


def _last_chart_part(raw_dir: Path) -> bytes | None:
    """Return chart1.xml from the last source document, by filename, that embeds a chart.

    The charted species has moved between documents, so discover the part instead of
    pinning one file name.
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
        blob = _last_chart_part(ROOT / "data/raw")
        self.assertIsNotNone(blob, "no data/raw/*.docx carries a word/charts/chart1.xml part")
        assert blob is not None
        png = _render_chart_to_png(blob)
        self.assertIsNotNone(png)
        assert png is not None
        image = Image.open(io.BytesIO(png)).convert("L")
        width, height = image.size
        # Tick labels sit outside the plot area: left of the y axis and below the x axis.
        for name, box in {
            "y-axis labels": (0, 0, int(width * 0.08), height),
            "x-axis labels": (0, int(height * 0.9), width, height),
        }.items():
            dark_pixels = sum(image.crop(box).histogram()[:128])
            self.assertGreater(dark_pixels, 100, f"no {name} drawn")


if __name__ == "__main__":
    unittest.main()
