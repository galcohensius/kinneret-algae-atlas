"""Unit tests for image caption detection in the DOCX extractor."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.pipeline import _looks_like_image_caption


class TestImageCaptionDetection(unittest.TestCase):
    def test_plate_caption(self) -> None:
        self.assertTrue(_looks_like_image_caption("Plate 1. Ceratium hirundinella ..."))

    def test_figure_caption(self) -> None:
        self.assertTrue(_looks_like_image_caption("Figure 2. Diplopsalis ..."))

    def test_fig_caption(self) -> None:
        self.assertTrue(_looks_like_image_caption("Fig. 1. Time series ..."))

    def test_not_a_caption_inline(self) -> None:
        # Caption regex expects the paragraph to start with Plate/Figure/Fig.
        self.assertFalse(_looks_like_image_caption("Text mentioning Plate 1. somewhere later."))


if __name__ == "__main__":
    unittest.main()

