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

from algae_extractor.reader import iter_docx_content_blocks, paragraph_clean_text


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


if __name__ == "__main__":
    unittest.main()
