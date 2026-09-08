#!/usr/bin/env python3
"""Resize and compress the home hero photo for web delivery.

Manual tool: run it on a new hero photo, inspect the result, then move the
outputs over public/kinneret-lake.{webp,jpg} yourself. The source is never
modified.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

DEFAULT_INPUT = Path("public/kinneret-lake.jpg")
DEFAULT_MAX_PX = 1920
DEFAULT_WEBP_QUALITY = 72
DEFAULT_JPEG_QUALITY = 78
OUTPUT_SUFFIX = ".optimized"


def optimize_hero_image(
    input_path: Path,
    *,
    output_stem: Path | None = None,
    max_px: int = DEFAULT_MAX_PX,
    webp_quality: int = DEFAULT_WEBP_QUALITY,
    jpeg_quality: int = DEFAULT_JPEG_QUALITY,
) -> tuple[Path, Path]:
    """Write ``<output_stem>.webp`` and ``<output_stem>.jpg``, longest side <= max_px.

    ``output_stem`` defaults to ``<input dir>/<input stem>.optimized`` so the
    source file is left untouched.
    """
    if output_stem is None:
        output_stem = input_path.with_name(f"{input_path.stem}{OUTPUT_SUFFIX}")
    # with_name, not with_suffix: a stem like "hero.optimized" has a fake suffix.
    webp_path = output_stem.with_name(f"{output_stem.name}.webp")
    jpg_path = output_stem.with_name(f"{output_stem.name}.jpg")
    if input_path.resolve() in {webp_path.resolve(), jpg_path.resolve()}:
        raise ValueError(f"Output would overwrite the input: {input_path}")

    with Image.open(input_path) as src:
        img = src.convert("RGB")
    longest = max(img.size)
    if longest > max_px:
        scale = max_px / longest
        img = img.resize(
            (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
            Image.Resampling.LANCZOS,
        )

    output_stem.parent.mkdir(parents=True, exist_ok=True)
    img.save(webp_path, "WEBP", quality=webp_quality, method=6)
    img.save(jpg_path, "JPEG", quality=jpeg_quality, optimize=True, progressive=True)
    return webp_path, jpg_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=(
            "Output path stem; .webp and .jpg are written next to it "
            f"(default: <input>{OUTPUT_SUFFIX}.*)."
        ),
    )
    parser.add_argument("--max-px", type=int, default=DEFAULT_MAX_PX)
    args = parser.parse_args()
    webp_path, jpg_path = optimize_hero_image(
        args.input, output_stem=args.output, max_px=args.max_px
    )
    print(f"Wrote {webp_path} ({webp_path.stat().st_size // 1024} KB)")
    print(f"Wrote {jpg_path} ({jpg_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
