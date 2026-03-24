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
    move_inline_further_reading_from_ecology_rich,
    move_orphan_prose_after_sample_size_from_measurement_fields_rich,
    normalize_further_reading_citation_boundaries,
    normalize_further_reading_citation_boundaries_rich,
    _normalize_structured_fields_rich,
)


class TestMoveOrphanProseAfterSampleSize(unittest.TestCase):
    def test_moves_lowercase_tail_after_n_into_ecology(self) -> None:
        dia = "29 – 40.5 µm, median: 34 µm (N=580) its cellular volume increases."
        eco = "Peridiniopsis borgei is common."
        fields_plain = {
            "cell_diameter_d": dia,
            "ecology": eco,
        }
        fields_styles = {
            "cell_diameter_d": [0] * len(dia),
            "ecology": [0] * len(eco),
        }
        move_orphan_prose_after_sample_size_from_measurement_fields_rich(
            fields_plain, fields_styles
        )
        self.assertEqual(
            fields_plain["cell_diameter_d"],
            "29 – 40.5 µm, median: 34 µm (N=580)",
        )
        self.assertEqual(
            fields_plain["ecology"],
            "its cellular volume increases. Peridiniopsis borgei is common.",
        )
        self.assertEqual(len(fields_styles["cell_diameter_d"]), len(fields_plain["cell_diameter_d"]))
        self.assertEqual(len(fields_styles["ecology"]), len(fields_plain["ecology"]))

    def test_normalize_notes_splits_borgei_style_blob(self) -> None:
        notes = (
            "Cell diameter (D): 29 – 40.5 µm, median: 34 µm (N=580) "
            "its tail before ecology label. "
            "Ecology: Main ecology starts here."
        )
        plain, _styles = _normalize_structured_fields_rich(
            {"notes": notes},
            {"notes": [0] * len(notes)},
        )
        self.assertEqual(
            plain["cell_diameter_d"],
            "29 – 40.5 µm, median: 34 µm (N=580)",
        )
        self.assertTrue(plain["ecology"].startswith("its tail before ecology label."))
        self.assertIn("Main ecology starts here.", plain["ecology"])


class TestDistinctiveFeaturesMarker(unittest.TestCase):
    def test_splits_inline_from_biovolume(self) -> None:
        notes = (
            "Biovolume/cell: 73,000 µm3 (literature value, we do not routinely measure this species) "
            "Distinctive features: Mixotroph. Too large to be grazed by zooplankton."
        )
        plain, _styles = _normalize_structured_fields_rich(
            {"notes": notes},
            {"notes": [0] * len(notes)},
        )
        self.assertEqual(
            plain["biovolume_per_cell"],
            "73,000 µm3 (literature value, we do not routinely measure this species)",
        )
        self.assertEqual(
            plain["distinctive_attributes"],
            "Mixotroph. Too large to be grazed by zooplankton.",
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


class TestMoveInlineFurtherReadingFromEcologyRich(unittest.TestCase):
    def test_moves_tail_and_merges_styles(self) -> None:
        eco = "Eco body. Further reading: Smith A, Jones B (2000) Journal 1:1-2."
        # Per-char styles: italic (1) on citation tail only for test
        styles = [0] * len(eco)
        tail_start = eco.index("Smith")
        for i in range(tail_start, len(eco)):
            styles[i] = 1
        fields_plain = {"ecology": eco, "further_reading": ""}
        fields_styles: dict[str, list[int]] = {"ecology": styles[:], "further_reading": []}
        move_inline_further_reading_from_ecology_rich(fields_plain, fields_styles)
        self.assertTrue(fields_plain["ecology"].endswith("Eco body."))
        fr = fields_plain["further_reading"]
        self.assertTrue(fr.startswith("Smith"))
        self.assertEqual(len(fields_styles["further_reading"]), len(fr))
        self.assertEqual(fields_styles["further_reading"][0], 1)


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


class TestNormalizeFurtherReadingCitationBoundariesRich(unittest.TestCase):
    def test_matches_plain_and_inserts_neutral_styles(self) -> None:
        raw = "Arch Hydrobiol 120:267-285 Hansen G"
        styles = [0] * len(raw)
        # Mark "Hansen G" as italic (bit 1)
        hi = raw.index("Hansen")
        for i in range(hi, len(raw)):
            styles[i] = 1
        out_plain, out_styles = normalize_further_reading_citation_boundaries_rich(raw, styles)
        self.assertEqual(out_plain, normalize_further_reading_citation_boundaries(raw))
        self.assertEqual(len(out_plain), len(out_styles))
        self.assertEqual(out_plain[out_plain.index(".") + 1], " ")  # ". " inserted
        # Period and space after pages are neutral
        dot = out_plain.index("285.") + 3  # position of '.'
        self.assertEqual(out_styles[dot], 0)
        self.assertEqual(out_styles[dot + 1], 0)
        # Hansen still italic after insertion
        h2 = out_plain.index("Hansen")
        self.assertEqual(out_styles[h2], 1)


if __name__ == "__main__":
    unittest.main()
