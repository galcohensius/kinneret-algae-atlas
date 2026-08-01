"""Tests for preserving Word paragraph boundaries in narrative sections."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.pipeline import _append_section_line, _finalize_record, _new_record


class TestPreserveParagraphBoundaries(unittest.TestCase):
    def test_ecology_paragraphs_join_with_newlines(self) -> None:
        record = _new_record("Mougeotia Agardh 1824")
        _append_section_line(record, "ecology", "First ecology paragraph.")
        _append_section_line(record, "ecology", "Second ecology paragraph about size.")
        finalized = _finalize_record(record)
        assert finalized is not None
        eco = finalized.sections["ecology"]
        self.assertIn("\n", eco)
        self.assertEqual(
            eco,
            "First ecology paragraph.\nSecond ecology paragraph about size.",
        )

    def test_morphology_paragraphs_join_with_newlines(self) -> None:
        record = _new_record("Mougeotia Agardh 1824")
        _append_section_line(record, "morphology", "First morphology paragraph.")
        _append_section_line(record, "morphology", "Second morphology paragraph.")
        finalized = _finalize_record(record)
        assert finalized is not None
        morph = finalized.sections["morphological_features"]
        self.assertEqual(
            morph,
            "First morphology paragraph.\nSecond morphology paragraph.",
        )


if __name__ == "__main__":
    unittest.main()
