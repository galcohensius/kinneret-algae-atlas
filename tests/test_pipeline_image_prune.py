"""Stale image cleanup after Word re-extraction."""

import shutil
import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SRC = ROOT / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from PIL import Image

from algae_extractor.pipeline import _save_image, prune_catalog_images


class TestPruneCatalogImages(unittest.TestCase):
    def test_removes_unreferenced_files_and_orphan_species_dirs(self) -> None:
        tmp = Path(tempfile.mkdtemp())
        try:
            species = tmp / "durinskia-oculata"
            species.mkdir()
            (species / "plate-1.png").write_bytes(b"new")
            (species / "plate-2.png").write_bytes(b"stale")
            (species / "old-figure.jpg").write_bytes(b"stale")
            orphan = tmp / "removed-species"
            orphan.mkdir()
            (orphan / "plate-1.png").write_bytes(b"orphan")

            records = [
                {
                    "scientific_name": "Durinskia oculata (Stein) Gert Hansen et Flaim 2007",
                    "images": ["/algae-images/durinskia-oculata/plate-1.png"],
                }
            ]
            files_removed, dirs_removed = prune_catalog_images(records, tmp)
            self.assertEqual(files_removed, 2)
            self.assertEqual(dirs_removed, 1)
            self.assertTrue((species / "plate-1.png").is_file())
            self.assertFalse((species / "plate-2.png").exists())
            self.assertFalse(orphan.exists())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_protects_supplement_image_dirs(self) -> None:
        tmp = Path(tempfile.mkdtemp())
        try:
            species = tmp / "durinskia-oculata"
            species.mkdir()
            (species / "plate-1.png").write_bytes(b"keep")
            supplement = tmp / "cunningtonii-vs-elpatiewskyi"
            supplement.mkdir()
            (supplement / "figure-1.png").write_bytes(b"supplement")

            records = [
                {
                    "scientific_name": "Durinskia oculata (Stein) Gert Hansen et Flaim 2007",
                    "images": ["/algae-images/durinskia-oculata/plate-1.png"],
                }
            ]
            files_removed, dirs_removed = prune_catalog_images(
                records,
                tmp,
                protected_slugs={"cunningtonii-vs-elpatiewskyi"},
            )
            self.assertEqual(files_removed, 0)
            self.assertEqual(dirs_removed, 0)
            self.assertTrue((supplement / "figure-1.png").is_file())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_save_image_replaces_other_extensions_for_same_stem(self) -> None:
        tmp = Path(tempfile.mkdtemp())
        try:
            (tmp / "bangia-atropurpurea").mkdir()
            jpg = tmp / "bangia-atropurpurea" / "thumbnail-1.jpg"
            jpg.write_bytes(b"old")

            buf = BytesIO()
            Image.new("RGB", (2, 2), color=(1, 2, 3)).save(buf, format="PNG")
            _save_image(
                buf.getvalue(),
                ".png",
                "thumbnail-1",
                "Bangia atropurpurea",
                tmp,
                "/algae-images",
            )
            self.assertFalse(jpg.exists())
            self.assertTrue((tmp / "bangia-atropurpurea" / "thumbnail-1.png").is_file())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
