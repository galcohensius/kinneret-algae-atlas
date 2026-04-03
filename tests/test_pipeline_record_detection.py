"""Tests for record-start blocking, fake-name rejection, and name inference."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.pipeline import (
    _infer_scientific_name_fallback,
    _should_reject_fake_record_name,
    _strip_leading_list_markers,
)


class TestListMarkerStrip(unittest.TestCase):
    def test_strips_numbered_prefix(self) -> None:
        self.assertEqual(
            _strip_leading_list_markers("1. Previous names"),
            "Previous names",
        )
        self.assertEqual(
            _strip_leading_list_markers("2) Previously used"),
            "Previously used",
        )


class TestRejectFakeRecordName(unittest.TestCase):
    def test_rejects_section_headings(self) -> None:
        blocked = ["previous names", "previously used"]
        self.assertTrue(_should_reject_fake_record_name("Previous names", blocked))
        self.assertTrue(_should_reject_fake_record_name("Previously used", blocked))
        self.assertFalse(_should_reject_fake_record_name("Gymnodinium sp.", blocked))


class TestInferScientificNameFallback(unittest.TestCase):
    def test_from_plate_caption_genus_sp(self) -> None:
        rec = {
            "image_captions": [
                "",
                "Plate 1: Gymnodinium sp., showing shapes.",
            ],
            "sections_buffer": {},
        }
        self.assertEqual(_infer_scientific_name_fallback(rec), "Gymnodinium sp.")


if __name__ == "__main__":
    unittest.main()
