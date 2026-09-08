"""The shared species slug must reproduce every published slug and image directory."""

import json
import unittest
from pathlib import Path

from algae_extractor.slugs import slugify, taxon_name_for_slug, taxon_slug

ROOT = Path(__file__).resolve().parents[1]


class TestSlugify(unittest.TestCase):
    def test_folds_diacritics_and_collapses_separators(self) -> None:
        self.assertEqual(slugify("Nägeli  &  Kützing"), "nageli-kutzing")
        self.assertEqual(slugify("  Peridinium  gatunense "), "peridinium-gatunense")
        self.assertEqual(slugify("***"), "unnamed")

    def test_taxon_name_strips_list_number_and_authority(self) -> None:
        self.assertEqual(taxon_name_for_slug("1. Peridinium gatunense Nygaard 1925"), "Peridinium gatunense")
        self.assertEqual(taxon_name_for_slug("Microcystis Kützing ex Lemmermann 1907"), "Microcystis")
        self.assertEqual(
            taxon_name_for_slug("Peridiniopsis cunningtonii var. quinquecuspidata (Lemm.)"),
            "Peridiniopsis cunningtonii var. quinquecuspidata",
        )


class TestSlugsMatchPublishedData(unittest.TestCase):
    def setUp(self) -> None:
        path = ROOT / "data" / "processed" / "algae_records.json"
        self.records = json.loads(path.read_text(encoding="utf-8"))

    def test_every_record_image_directory_is_its_taxon_slug(self) -> None:
        for record in self.records:
            expected = taxon_slug(record["scientific_name"])
            for image in record.get("images") or []:
                # "/algae-images/<slug>/<file>"
                self.assertEqual(image.split("/")[2], expected, record["scientific_name"])

    def test_every_api_slug_is_its_taxon_slug(self) -> None:
        api = json.loads((ROOT / "public" / "api" / "species.json").read_text(encoding="utf-8"))
        by_name = {item["scientific_name"]: item["slug"] for item in api["species"]}
        self.assertEqual(len(by_name), len(self.records))
        for record in self.records:
            self.assertEqual(by_name[record["scientific_name"]], taxon_slug(record["scientific_name"]))


if __name__ == "__main__":
    unittest.main()
