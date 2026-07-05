import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TestLlmsOutputs(unittest.TestCase):
    def test_llms_files_exist(self) -> None:
        self.assertTrue((ROOT / "public" / "llms.txt").is_file())
        self.assertTrue((ROOT / "public" / "llms-full.txt").is_file())

    def test_llms_full_has_species_count_and_dual_citation_layers(self) -> None:
        llms_full = (ROOT / "public" / "llms-full.txt").read_text(encoding="utf-8")
        records = json.loads((ROOT / "data" / "processed" / "algae_records.json").read_text(encoding="utf-8"))

        expected_species_count = len(records)
        self.assertIn(f"Species count: {expected_species_count}", llms_full)

        # Every species block must carry both citation layers.
        self.assertEqual(llms_full.count("## Species:"), expected_species_count)
        self.assertEqual(llms_full.count("- Per-record citation:"), expected_species_count)
        self.assertEqual(llms_full.count("- Atlas attribution:"), expected_species_count + 1)

    def test_llms_txt_lists_machine_readable_endpoints(self) -> None:
        llms_txt = (ROOT / "public" / "llms.txt").read_text(encoding="utf-8")
        self.assertIn("/api/species.json", llms_txt)
        self.assertIn("/api/species/{slug}.json", llms_txt)
        self.assertIn("/api/glossary.json", llms_txt)

    def test_generated_species_api_matches_processed_records(self) -> None:
        records = json.loads((ROOT / "data" / "processed" / "algae_records.json").read_text(encoding="utf-8"))
        species_api = json.loads((ROOT / "public" / "api" / "species.json").read_text(encoding="utf-8"))

        self.assertEqual(species_api["count"], len(records))
        self.assertEqual(len(species_api["species"]), len(records))

        first = species_api["species"][0]
        self.assertIn("slug", first)
        self.assertIn("scientific_name", first)
        self.assertIn("canonical_url", first)
        self.assertIn("taxonomy", first)
        self.assertIn("citation", first)
        self.assertIn("per_record", first["citation"])
        self.assertIn("atlas_attribution", first["citation"])

        for item in species_api["species"]:
            slug = item["slug"]
            detail_path = ROOT / "public" / "api" / "species" / f"{slug}.json"
            self.assertTrue(detail_path.is_file(), f"Missing detail JSON for {slug}")
            detail = json.loads(detail_path.read_text(encoding="utf-8"))
            self.assertEqual(detail["slug"], slug)
            self.assertEqual(detail["citation"]["atlas_attribution"], item["citation"]["atlas_attribution"])

        expected_detail_files = {f"{item['slug']}.json" for item in species_api["species"]}
        actual_detail_files = {
            path.name for path in (ROOT / "public" / "api" / "species").glob("*.json")
        }
        self.assertEqual(actual_detail_files, expected_detail_files)

    def test_generated_glossary_api_has_terms_and_citation(self) -> None:
        glossary = json.loads((ROOT / "data" / "processed" / "glossary.json").read_text(encoding="utf-8"))
        glossary_api = json.loads((ROOT / "public" / "api" / "glossary.json").read_text(encoding="utf-8"))

        self.assertEqual(len(glossary_api["entries"]), len(glossary["entries"]))
        self.assertIn("citation", glossary_api)
        self.assertIn("per_record", glossary_api["citation"])
        self.assertIn("atlas_attribution", glossary_api["citation"])
        self.assertGreater(len(glossary_api["entries"]), 0)


if __name__ == "__main__":
    unittest.main()
