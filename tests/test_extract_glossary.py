import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from extract_glossary import _normalize_cox_figure_references


class TestNormalizeCoxFigureReferences(unittest.TestCase):
    def test_maps_fig_5_and_fig_6_to_plate_links(self) -> None:
        data = {
            "entries": [
                {"definition": "see Cox (1996) Fig. 5"},
                {"definition": "shape ... see Cox (1996) Fig. 6"},
            ]
        }
        _normalize_cox_figure_references(data)
        self.assertEqual(data["entries"][0]["definition"], "see Cox (1996) Plate 1")
        self.assertEqual(data["entries"][1]["definition"], "shape ... see Cox (1996) Plate 2")

    def test_is_case_insensitive_and_keeps_unrelated_text(self) -> None:
        data = {
            "entries": [
                {"definition": "SEE Cox (1996) fig. 5 and other text."},
                {"definition": "No Cox reference here."},
            ]
        }
        _normalize_cox_figure_references(data)
        self.assertEqual(data["entries"][0]["definition"], "see Cox (1996) Plate 1 and other text.")
        self.assertEqual(data["entries"][1]["definition"], "No Cox reference here.")


if __name__ == "__main__":
    unittest.main()
