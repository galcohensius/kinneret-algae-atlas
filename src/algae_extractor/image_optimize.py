"""Downscale and re-encode extracted images for fast web delivery.

The static site ships images unoptimized (Next.js `output: export`), so the raw
Word assets — often multi-megabyte lossless PNG photos — are what mobile clients
download. This module caps dimensions and re-encodes:

* **figures** (charts): kept as PNG so axis text/lines stay crisp.
* **thumbnails** and **plates/photos**: flattened to RGB and saved as progressive
  JPEG, which is dramatically smaller for photographic content.

`optimize_image_blob` is intentionally defensive: on any decode/encode error it
returns the original bytes and extension unchanged.

`save_web_image` is the one write path shared by the species and supplement
pipelines: TIFF -> PNG, optimize, drop stale extension variants, return the URL.
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from PIL import Image

# Longest-side caps (px).
MAX_DIM_PHOTO = 1600
MAX_DIM_THUMBNAIL = 640
MAX_DIM_FIGURE = 1600

JPEG_QUALITY = 82
THUMBNAIL_JPEG_QUALITY = 80

TIFF_EXTENSIONS = frozenset({".tif", ".tiff"})
IMAGE_SAVE_EXTENSIONS = frozenset({".png", ".jpg", ".jpeg", ".gif", ".webp", ".tif", ".tiff"})


def _kind_from_stem(stem: str) -> str:
    s = stem.lower()
    if s.startswith("thumbnail"):
        return "thumbnail"
    if s.startswith("figure"):
        return "figure"
    if s.startswith("plate"):
        return "plate"
    return "other"


def _flatten_to_rgb(im: Image.Image) -> Image.Image:
    """Composite any transparency onto white and return an RGB image."""
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        rgba = im.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        return background
    if im.mode != "RGB":
        return im.convert("RGB")
    return im


def optimize_image_blob(blob: bytes, extension: str, stem: str) -> tuple[bytes, str]:
    """Return (optimized_bytes, extension) for a web-delivered image.

    Charts (``figure-*``) stay PNG; photographic assets become progressive JPEG.
    Falls back to the original bytes/extension if anything goes wrong.
    """
    ext = extension.lower()
    kind = _kind_from_stem(stem)
    try:
        with Image.open(BytesIO(blob)) as im:
            im.load()
            if getattr(im, "is_animated", False):
                return blob, ext

            if kind == "thumbnail":
                max_dim = MAX_DIM_THUMBNAIL
            elif kind == "figure":
                max_dim = MAX_DIM_FIGURE
            else:
                max_dim = MAX_DIM_PHOTO

            width, height = im.size
            longest = max(width, height)
            if longest > max_dim:
                scale = max_dim / longest
                im = im.resize(
                    (max(1, round(width * scale)), max(1, round(height * scale))),
                    Image.LANCZOS,
                )

            out = BytesIO()
            if kind == "figure":
                save_im = im.convert("RGBA") if im.mode == "P" else im
                save_im.save(out, format="PNG", optimize=True)
                new_ext = ".png"
            else:
                save_im = _flatten_to_rgb(im)
                quality = THUMBNAIL_JPEG_QUALITY if kind == "thumbnail" else JPEG_QUALITY
                save_im.save(
                    out,
                    format="JPEG",
                    quality=quality,
                    optimize=True,
                    progressive=True,
                )
                new_ext = ".jpg"

            optimized = out.getvalue()
            # If we neither changed format nor shrank the payload, keep the original.
            if new_ext == ext and len(optimized) >= len(blob):
                return blob, ext
            return optimized, new_ext
    except Exception:
        return blob, ext


def tiff_blob_to_png_bytes(blob: bytes) -> bytes:
    """Decode TIFF bytes and re-encode as PNG for web browsers."""
    with Image.open(BytesIO(blob)) as im:
        im.load()
        if im.mode == "CMYK":
            im = im.convert("RGB")
        elif im.mode in ("P", "LA"):
            im = im.convert("RGBA")
        elif im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        out = BytesIO()
        im.save(out, format="PNG", optimize=True)
        return out.getvalue()


def _unlink_stem_extension_variants(images_dir: Path, stem: str, keep_extension: str) -> None:
    """Remove other extensions for the same stem (e.g. old thumbnail-1.jpg)."""
    keep = keep_extension.lower()
    for ext in IMAGE_SAVE_EXTENSIONS:
        if ext == keep:
            continue
        path = images_dir / f"{stem}{ext}"
        if path.is_file():
            path.unlink()


def save_web_image(
    blob: bytes,
    extension: str,
    *,
    images_output_dir: Path,
    dir_slug: str,
    stem: str,
    images_public_prefix: str,
) -> str:
    """Write one extracted image under ``images_output_dir/dir_slug`` and return its URL.

    TIFF is re-encoded as PNG first (browsers cannot show TIFF), the result is
    optimized, and stale ``stem.<other ext>`` files from earlier runs are removed.
    """
    images_dir = images_output_dir / dir_slug
    images_dir.mkdir(parents=True, exist_ok=True)
    ext = extension.lower()
    if ext in TIFF_EXTENSIONS:
        blob = tiff_blob_to_png_bytes(blob)
        ext = ".png"
    blob, ext = optimize_image_blob(blob, ext, stem)
    _unlink_stem_extension_variants(images_dir, stem, ext)
    filename = f"{stem}{ext}"
    (images_dir / filename).write_bytes(blob)
    return f"{images_public_prefix.rstrip('/')}/{dir_slug}/{filename}"
