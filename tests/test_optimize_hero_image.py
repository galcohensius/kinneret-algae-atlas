"""Tests for scripts/optimize-hero-image.py (aspect ratio, source untouched)."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
_SCRIPT = ROOT / "scripts" / "optimize-hero-image.py"


def _load_script():
    spec = importlib.util.spec_from_file_location("optimize_hero_image", _SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestOptimizeHeroImage(unittest.TestCase):
    def test_keeps_aspect_ratio_and_leaves_source_untouched(self) -> None:
        mod = _load_script()
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "hero.png"
            Image.new("RGB", (3000, 2000), (10, 120, 200)).save(src)
            before = src.read_bytes()

            webp_path, jpg_path = mod.optimize_hero_image(src, max_px=600)

            self.assertEqual(src.read_bytes(), before)
            self.assertEqual(webp_path, src.with_name("hero.optimized.webp"))
            self.assertEqual(jpg_path, src.with_name("hero.optimized.jpg"))
            for path in (webp_path, jpg_path):
                with Image.open(path) as out:
                    self.assertEqual(out.size, (600, 400))

    def test_refuses_to_overwrite_input(self) -> None:
        mod = _load_script()
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "hero.jpg"
            Image.new("RGB", (30, 20)).save(src)
            with self.assertRaises(ValueError):
                mod.optimize_hero_image(src, output_stem=src.with_suffix(""))


if __name__ == "__main__":
    unittest.main()
