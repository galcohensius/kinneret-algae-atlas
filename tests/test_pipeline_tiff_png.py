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


class TestTiffToWebSave(unittest.TestCase):
    def _tiff_blob(self) -> bytes:
        buf = BytesIO()
        Image.new("RGB", (2, 2), color=(200, 10, 30)).save(buf, format="TIFF")
        return buf.getvalue()

    def test_save_image_writes_png_for_tiff_figure(self) -> None:
        """Charts stay lossless PNG so axis text/lines remain crisp."""
        tmp = Path(tempfile.mkdtemp())
        try:
            public_path = _save_image(
                self._tiff_blob(),
                ".tif",
                "figure-1",
                "Durinskia oculata",
                tmp,
                "/algae-images",
            )
            self.assertTrue(public_path.endswith("/durinskia-oculata/figure-1.png"))
            out = tmp / "durinskia-oculata" / "figure-1.png"
            self.assertTrue(out.is_file())
            self.assertGreater(out.stat().st_size, 0)
            with Image.open(out) as saved:
                self.assertEqual(saved.format, "PNG")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_save_image_writes_jpeg_for_tiff_photo(self) -> None:
        """Photos/thumbnails are re-encoded as JPEG for a smaller web payload."""
        tmp = Path(tempfile.mkdtemp())
        try:
            public_path = _save_image(
                self._tiff_blob(),
                ".tif",
                "thumbnail-1",
                "Durinskia oculata",
                tmp,
                "/algae-images",
            )
            self.assertTrue(public_path.endswith("/durinskia-oculata/thumbnail-1.jpg"))
            out = tmp / "durinskia-oculata" / "thumbnail-1.jpg"
            self.assertTrue(out.is_file())
            self.assertGreater(out.stat().st_size, 0)
            with Image.open(out) as saved:
                self.assertEqual(saved.format, "JPEG")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
