import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from glossary_extractor.parse import parse_glossary_text


class TestGlossaryParse(unittest.TestCase):
    def test_splits_term_and_definition(self) -> None:
        data = parse_glossary_text(
            "Glossary: terms used in species descriptions\n"
            "Acicular – needle-shaped\n"
            "Apical axis – in diatoms: axis linking poles\n"
        )
        self.assertEqual(len(data["entries"]), 2)
        self.assertEqual(data["entries"][0]["term"], "Acicular")
        self.assertEqual(data["entries"][0]["slug"], "acicular")
        self.assertEqual(data["entries"][0]["match_phrases"], ["Acicular"])

    def test_plural_parenthetical_yields_two_phrases(self) -> None:
        data = parse_glossary_text(
            "Apex (plural: apices) – tip of a cell\n"
        )
        entry = data["entries"][0]
        self.assertEqual(entry["slug"], "apex")
        self.assertEqual(entry["match_phrases"], ["Apex", "apices"])


if __name__ == "__main__":
    unittest.main()
