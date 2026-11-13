"""Text inside a Word hyperlink must survive extraction.

Word nests a hyperlink's runs in <w:hyperlink>, which `paragraph.runs` skips. A
"Phylum: <linked name>" line then lost its value, and linked words and DOIs
vanished from prose and references.
"""

import tempfile
import unittest
from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from algae_extractor.pipeline import _apply_word_hyperlink
from algae_extractor.reader import (
    iter_docx_content_blocks,
    paragraph_clean_text,
    paragraph_hyperlinks,
)


def _add_hyperlink(paragraph, text: str) -> None:
    link = OxmlElement("w:hyperlink")
    link.set(qn("w:anchor"), "target")
    run = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.text = text
    run.append(t)
    link.append(run)
    paragraph._p.append(link)


class TestHyperlinkText(unittest.TestCase):
    def setUp(self) -> None:
        self.document = Document()
        self.paragraph = self.document.add_paragraph()
        self.paragraph.add_run("Phylum: ")
        _add_hyperlink(self.paragraph, "Cyanobacteriophyta")
        self.paragraph.add_run(" (linked)")

    def test_paragraph_clean_text_keeps_hyperlink_text_in_order(self) -> None:
        self.assertEqual(
            paragraph_clean_text(self.paragraph), "Phylum: Cyanobacteriophyta (linked)"
        )

    def test_content_blocks_keep_hyperlink_text(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "linked.docx"
            self.document.save(path)
            texts = [
                b["text"] for b in iter_docx_content_blocks(path) if b.get("type") == "paragraph"
            ]
        self.assertIn("Phylum: Cyanobacteriophyta (linked)", texts)


def _add_field_hyperlink(paragraph, text: str, url: str) -> None:
    def field_char(kind: str) -> None:
        char = OxmlElement("w:fldChar")
        char.set(qn("w:fldCharType"), kind)
        paragraph.add_run()._r.append(char)

    field_char("begin")
    instr = OxmlElement("w:instrText")
    instr.text = f'HYPERLINK "{url}"'
    paragraph.add_run()._r.append(instr)
    field_char("separate")
    paragraph.add_run(text)
    field_char("end")


class TestHyperlinkTargets(unittest.TestCase):
    URL = "https://example.org/strain?id=1&cat=2"

    def setUp(self) -> None:
        self.paragraph = Document().add_paragraph()
        self.paragraph.add_run("Strains are kept at ACME (see ")
        _add_field_hyperlink(self.paragraph, "ACME", self.URL)
        self.paragraph.add_run(" - the collection).")

    def test_field_code_link_is_reported_with_preceding_text(self) -> None:
        self.assertEqual(
            paragraph_hyperlinks(self.paragraph),
            [{"text": "ACME", "url": self.URL, "before": "Strains are kept at ACME (see"}],
        )

    def test_internal_anchor_link_is_not_reported(self) -> None:
        paragraph = Document().add_paragraph()
        _add_hyperlink(paragraph, "Cyanobacteriophyta")
        self.assertEqual(paragraph_hyperlinks(paragraph), [])

    def test_repeated_link_text_is_placed_by_preceding_text(self) -> None:
        text = paragraph_clean_text(self.paragraph)
        sections_rich = {
            "ecology": [{"text": text, "italic": False, "bold": False}],
            "further_reading": [{"text": "ACME", "italic": False, "bold": False}],
        }
        for link in paragraph_hyperlinks(self.paragraph):
            _apply_word_hyperlink(sections_rich, ["ecology"], link)
        self.assertEqual(
            sections_rich["ecology"],
            [
                {"text": "Strains are kept at ACME (see ", "italic": False, "bold": False},
                {"text": "ACME", "italic": False, "bold": False, "href": self.URL},
                {"text": " - the collection).", "italic": False, "bold": False},
            ],
        )
        self.assertNotIn("href", sections_rich["further_reading"][0])

    def test_link_from_another_paragraph_does_not_land_on_matching_prose(self) -> None:
        prose = [{"text": "typical of the order Oscillatoriales.", "italic": False, "bold": False}]
        sections_rich = {"ecology": list(prose)}
        link = {"text": "Oscillatoriales", "url": self.URL, "before": "Order:"}
        _apply_word_hyperlink(sections_rich, ["ecology"], link)
        self.assertEqual(sections_rich["ecology"], prose)


if __name__ == "__main__":
    unittest.main()
