"""Tests for record-start blocking, fake-name rejection, and name inference."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.pipeline import (
    _append_section_line,
    _finalize_record,
    _infer_scientific_name_fallback,
    _looks_like_prose_remainder,
    _new_record,
    _should_reject_fake_record_name,
    _strip_leading_list_markers,
)

CITATION_TEMPLATE = (
    "Tamar Zohary, Alla Alster. [Date when Item was last updated]. "
    "Electronic publication. Israel Oceanographic & Limnological Research. "
    "[Date when last accessed]"
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

    def test_rejects_citation_author_lines(self) -> None:
        blocked = ["tamar zohary"]
        self.assertTrue(
            _should_reject_fake_record_name("Tamar Zohary, Alla Alster", blocked)
        )


class TestRejectProseRecordRemainder(unittest.TestCase):
    def test_rejects_binomial_followed_by_prose_verb(self) -> None:
        self.assertTrue(
            _looks_like_prose_remainder(
                "was more abundant at warmer water temperatures, lower alkalinities, and higher pH."
            )
        )
        self.assertTrue(
            _looks_like_prose_remainder(
                "is more abundant at temperature > 22 C. It occurs at all chloride concentrations."
            )
        )

    def test_keeps_short_authority_tail(self) -> None:
        self.assertFalse(_looks_like_prose_remainder("Nägeli 1849"))


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


class TestFinalizeContentLessRecord(unittest.TestCase):
    def test_drops_named_record_with_no_sections_or_images(self) -> None:
        # A stray "Cite this record as:" citation mis-detected as a taxon header
        # yields a record with a name but no populated sections and no images.
        record = _new_record(source_file="Chroococcales.docx")
        record["scientific_name"] = CITATION_TEMPLATE
        self.assertIsNone(_finalize_record(record))

    def test_keeps_record_with_a_populated_section(self) -> None:
        record = _new_record(source_file="Chroococcales.docx")
        record["scientific_name"] = "Chroococcus turgidus (Kützing) Nägeli 1849"
        _append_section_line(record, "phylum", "Cyanobacteriophyta")
        finalized = _finalize_record(record)
        self.assertIsNotNone(finalized)
        self.assertEqual(
            finalized.scientific_name, "Chroococcus turgidus (Kützing) Nägeli 1849"
        )

    def test_keeps_record_with_only_an_image(self) -> None:
        record = _new_record(source_file="Chroococcales.docx")
        record["scientific_name"] = "Gloeocapsa sp. Kützing 1843"
        record["images"] = ["/algae-images/gloeocapsa-sp/thumbnail-1.png"]
        self.assertIsNotNone(_finalize_record(record))


if __name__ == "__main__":
    unittest.main()
