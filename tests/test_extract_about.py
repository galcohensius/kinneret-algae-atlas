import unittest

from extract_about import _link_citations


class TestLinkCitations(unittest.TestCase):
    def test_links_every_occurrence_and_keeps_style(self) -> None:
        text = "see Sukenik et al. 2014; and Sukenik et al. 2014."
        segments = [{"text": text, "italic": True, "bold": False}]
        linked = _link_citations(segments, {"Sukenik et al. 2014": "/supplement-files/s.pdf"})
        self.assertEqual(
            [(s["text"], s.get("href")) for s in linked],
            [
                ("see ", None),
                ("Sukenik et al. 2014", "/supplement-files/s.pdf"),
                ("; and ", None),
                ("Sukenik et al. 2014", "/supplement-files/s.pdf"),
                (".", None),
            ],
        )
        self.assertTrue(all(s["italic"] for s in linked))

    def test_leaves_existing_links_and_other_text_alone(self) -> None:
        segments = [
            {"text": "Berman et al. 2014", "italic": False, "bold": False, "href": "https://x"},
            {"text": "No citation here.", "italic": False, "bold": False},
        ]
        self.assertEqual(_link_citations(segments, {"Berman et al. 2014": "/b.pdf"}), segments)


if __name__ == "__main__":
    unittest.main()
