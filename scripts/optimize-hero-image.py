#!/usr/bin/env python3
"""Resize and compress the home hero photo for web delivery."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

DEFAULT_INPUT = Path("public/kinneret-lake.jpg")
DEFAULT_MAX_PX = 1920
DEFAULT_WEBP_QUALITY = 72
DEFAULT_JPEG_QUALITY = 78


def optimize_hero_image(
    input_path: Path,
    *,
    max_px: int = DEFAULT_MAX_PX,
    webp_quality: int = DEFAULT_WEBP_QUALITY,
    jpeg_quality: int = DEFAULT_JPEG_QUALITY,
) -> tuple[Path, Path]:
    img = Image.open(input_path).convert("RGB")
    if max(img.size) > max_px:
        img = img.resize((max_px, max_px), Image.Resampling.LANCZOS)

    webp_path = input_path.with_suffix(".webp")
    jpg_path = input_path.with_suffix(".jpg")
    tmp_jpg = input_path.with_name(f"{input_path.stem}.optimized.jpg")

    img.save(webp_path, "WEBP", quality=webp_quality, method=6)
    img.save(tmp_jpg, "JPEG", quality=jpeg_quality, optimize=True, progressive=True)
    tmp_jpg.replace(jpg_path)
    return webp_path, jpg_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--max-px", type=int, default=DEFAULT_MAX_PX)
    args = parser.parse_args()
    webp_path, jpg_path = optimize_hero_image(args.input, max_px=args.max_px)
    print(f"Wrote {webp_path} ({webp_path.stat().st_size // 1024} KB)")
    print(f"Wrote {jpg_path} ({jpg_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
