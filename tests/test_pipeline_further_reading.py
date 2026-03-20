"""Unit tests for ecology → further_reading split in the DOCX extractor."""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from algae_extractor.pipeline import (
    move_inline_further_reading_from_ecology,
    normalize_further_reading_citation_boundaries,
)


class TestMoveInlineFurtherReadingFromEcology(unittest.TestCase):
    def test_moves_last_further_reading_block(self) -> None:
        eco_main = "Alpha beta. Fig. 3. Gamma ends here."
        citations = "Pollingher U, Hickel B (1991) Arch. 120:267-285. Hansen G (2007) Limnology 1:1-2."
        fields = {
            "ecology": f"{eco_main} Further reading: {citations}",
            "further_reading": "",
        }
        move_inline_further_reading_from_ecology(fields)
        self.assertEqual(fields["ecology"], eco_main)
        self.assertEqual(fields["further_reading"], citations)

    def test_appends_to_existing_further_reading(self) -> None:
        fields = {
            "ecology": "Eco text. Further reading: Second ref.",
            "further_reading": "First ref.",
        }
        move_inline_further_reading_from_ecology(fields)
        self.assertEqual(fields["ecology"], "Eco text.")
        self.assertIn("First ref.", fields["further_reading"])
        self.assertIn("Second ref.", fields["further_reading"])

    def test_no_marker_leaves_ecology(self) -> None:
        fields = {"ecology": "No further reading marker.", "further_reading": ""}
        move_inline_further_reading_from_ecology(fields)
        self.assertEqual(fields["ecology"], "No further reading marker.")

    def test_case_insensitive_marker(self) -> None:
        fields = {"ecology": "End. FURTHER READING: Smith (2020) Journal.", "further_reading": ""}
        move_inline_further_reading_from_ecology(fields)
        self.assertEqual(fields["ecology"], "End.")
        self.assertEqual(fields["further_reading"], "Smith (2020) Journal.")

    def test_uses_last_marker_when_multiple(self) -> None:
        fields = {
            "ecology": "Say further reading: is rare. End. Further reading: Real refs here.",
            "further_reading": "",
        }
        move_inline_further_reading_from_ecology(fields)
        self.assertIn("Say further reading:", fields["ecology"])
        self.assertEqual(fields["further_reading"], "Real refs here.")


class TestNormalizeFurtherReadingCitationBoundaries(unittest.TestCase):
    def test_inserts_period_before_next_author_after_pages(self) -> None:
        raw = (
            "Pollingher U, Hickel B (1991) … Arch Hydrobiol 120:267-285 Hansen G, Flaim G. 2007. …"
        )
        out = normalize_further_reading_citation_boundaries(raw)
        self.assertIn("120:267-285. Hansen G", out)
        self.assertNotIn("267-285 Hansen G", out)

    def test_idempotent_when_period_present(self) -> None:
        raw = "Arch Hydrobiol 120:267-285. Hansen G, Flaim G. 2007."
        self.assertEqual(normalize_further_reading_citation_boundaries(raw), raw)


if __name__ == "__main__":
    unittest.main()
