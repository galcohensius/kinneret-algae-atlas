"""Tests for multi-doc algae extraction merge helpers."""

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from extract_algae import _discover_inputs, _merge_records, _record_merge_key


class TestDiscoverInputs(unittest.TestCase):
    def test_excludes_supplement_docx_by_glob(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp)
            (raw / "1 Dinoflagellates.docx").write_bytes(b"x")
            (raw / "Cryptophytes.docx").write_bytes(b"x")
            (raw / "9-Suppl1 something.docx").write_bytes(b"x")

            selected = _discover_inputs(raw, ["*suppl*.docx"])
            self.assertEqual([p.name for p in selected], [
                "1 Dinoflagellates.docx",
                "Cryptophytes.docx",
            ])


class TestMergeRecords(unittest.TestCase):
    def test_merge_duplicates_by_taxon_key(self) -> None:
        records = [
            {
                "scientific_name": "Glochidinium penardiforme",
                "images": ["/algae-images/glochidinium-penardiforme/plate-1.png"],
                "image_captions": ["Plate 1."],
                "image_captions_rich": [[]],
                "sections": {"ecology": "First source ecology."},
                "sections_rich": {},
                "metadata": {"source_file": "Dinoflagellates.docx", "record_updated": "2026-05-05"},
            },
            {
                "scientific_name": "Glochidinium penardiforme Lemmermann 1899",
                "images": ["/algae-images/glochidinium-penardiforme/figure-1.png"],
                "image_captions": ["Figure 1."],
                "image_captions_rich": [[]],
                "sections": {"ecology": "Second source ecology."},
                "sections_rich": {},
                "metadata": {"source_file": "Cryptophytes.docx", "record_updated": "2026-05-06"},
            },
        ]

        merged = _merge_records(records)
        self.assertEqual(len(merged), 1)
        one = merged[0]
        self.assertEqual(one["scientific_name"], "Glochidinium penardiforme Lemmermann 1899")
        self.assertEqual(
            one["images"],
            [
                "/algae-images/glochidinium-penardiforme/plate-1.png",
                "/algae-images/glochidinium-penardiforme/figure-1.png",
            ],
        )
        self.assertEqual(one["metadata"]["record_updated"], "2026-05-06")
        self.assertEqual(
            one["metadata"]["source_files"],
            ["Dinoflagellates.docx", "Cryptophytes.docx"],
        )

    def test_key_uses_binomial_prefix(self) -> None:
        key = _record_merge_key(
            {"scientific_name": "Parvodinium elpatiewskyi Ostenfeld 1912"}, 0
        )
        self.assertEqual(key, "parvodinium-elpatiewskyi")


if __name__ == "__main__":
    unittest.main()
