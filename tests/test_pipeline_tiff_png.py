"""TIFF → PNG conversion when saving extracted images."""

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

from algae_extractor.pipeline import _save_image


class TestTiffToPngSave(unittest.TestCase):
    def test_save_image_writes_png_for_tiff_input(self) -> None:
        buf = BytesIO()
        Image.new("RGB", (2, 2), color=(200, 10, 30)).save(buf, format="TIFF")
        blob = buf.getvalue()
        tmp = Path(tempfile.mkdtemp())
        try:
            public_path = _save_image(
                blob,
                ".tif",
                "thumbnail-1",
                "Durinskia oculata",
                tmp,
                "/algae-images",
            )
            self.assertTrue(public_path.endswith("/durinskia-oculata/thumbnail-1.png"))
            out = tmp / "durinskia-oculata" / "thumbnail-1.png"
            self.assertTrue(out.is_file())
            self.assertGreater(out.stat().st_size, 0)
            with Image.open(out) as saved:
                self.assertEqual(saved.format, "PNG")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
