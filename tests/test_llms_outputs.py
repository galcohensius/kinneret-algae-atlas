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
        self.assertIn("/api/species", llms_txt)
        self.assertIn("/api/species/{slug}", llms_txt)
        self.assertIn("/api/glossary", llms_txt)


if __name__ == "__main__":
    unittest.main()
