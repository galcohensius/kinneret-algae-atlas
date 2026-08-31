"""Generate LLM discovery files from processed atlas data."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path
from typing import Any

ATLAS_URL = "https://kinneret-algae-atlas.org"
ATLAS_CITE_URL = f"{ATLAS_URL}/"
CANONICAL_AUTHORS = "Dr. Tamar Zohary, Dr. Alla Alster"
CANONICAL_AFFILIATION = (
    "Kinneret Limnological Institute, Israel Oceanographic and Limnological Research"
)
CANONICAL_PUBLISHER = "Israel Oceanographic & Limnological Research"

_BINOMIAL_RE = re.compile(
    r"^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+\s+[a-z][a-zA-Z-]+(?:\s+(?:subsp\.|var\.|f\.)\s+[a-z][a-zA-Z-]+)?)"
)
_GENUS_RE = re.compile(r"^(?:\d+\.?\s*)?([A-Z][a-zA-Z-]+)\b")

_KEY_SIZE_FIELDS: list[tuple[str, str]] = [
    ("organization", "Organization"),
    ("cell_shape", "Cell shape"),
    ("colony_shape", "Colony shape"),
    ("cell_diameter_d", "Cell diameter (D)"),
    ("cell_length_l", "Cell length (L)"),
    ("biovolume_per_cell", "Cell biovolume"),
    ("biovolume_equation", "Biovolume equation"),
    ("filament_length", "Filament length"),
    ("cells_per_filament", "Cells per filament"),
    ("colony_diameter", "Colony diameter"),
    ("cells_per_colony", "Cells per colony"),
]


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.strip().lower()
    normalized = re.sub(r"[^a-z0-9\s-]", "", normalized)
    normalized = re.sub(r"\s+", "-", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "unnamed"


def _record_slug(scientific_name: str, index: int) -> str:
    text = (scientific_name or "").strip()
    if not text:
        return f"unnamed-{index + 1}"
    binomial = _BINOMIAL_RE.match(text)
    if binomial:
        return _slugify(binomial.group(1))
    genus = _GENUS_RE.match(text)
    if genus:
        return _slugify(genus.group(1))
    return _slugify(text)


def _records_with_unique_slugs(records: list[dict[str, Any]]) -> list[tuple[dict[str, Any], str]]:
    seen: dict[str, int] = {}
    out: list[tuple[dict[str, Any], str]] = []
    for idx, record in enumerate(records):
        base = _record_slug((record.get("scientific_name") or "").strip(), idx)
        count = seen.get(base, 0)
        seen[base] = count + 1
        slug = base if count == 0 else f"{base}-{count + 1}"
        out.append((record, slug))
    return out


def _format_long_date(iso_date: str | None) -> str:
    if not iso_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", iso_date):
        return "Unknown update date"
    y, m, d = iso_date.split("-")
    months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return f"{int(d)} {months[int(m) - 1]} {y}"


def _record_citation(record_updated: str | None) -> str:
    long_date = _format_long_date(record_updated)
    return (
        f"{CANONICAL_AUTHORS}. {long_date}. Electronic publication. "
        f"{CANONICAL_PUBLISHER}. {ATLAS_CITE_URL}"
    )


def _atlas_attribution() -> str:
    return f"{CANONICAL_AUTHORS}. {CANONICAL_AFFILIATION}."


def _compact_text(text: str, max_len: int = 220) -> str:
    compact = re.sub(r"\s+", " ", (text or "").strip())
    if len(compact) <= max_len:
        return compact
    return compact[: max_len - 1].rstrip() + "…"


def _load_study_area() -> dict[str, Any]:
    path = Path("data/study-area.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _format_study_area_decimal(study_area: dict[str, Any]) -> str:
    lat = float(study_area["latitude"])
    lon = float(study_area["longitude"])
    lat_suffix = "N" if lat >= 0 else "S"
    lon_suffix = "E" if lon >= 0 else "W"
    return f"{abs(lat):.3f}° {lat_suffix}, {abs(lon):.3f}° {lon_suffix}"


def _study_area_block(study_area: dict[str, Any]) -> list[str]:
    lake = study_area["lake_name"]
    alt = study_area["alternate_name"]
    coords = _format_study_area_decimal(study_area)
    datum = study_area["geodetic_datum"]
    return [
        "## Study area",
        f"- Lake: {lake} ({alt})",
        f"- Country: {study_area['country']} ({study_area['country_code']})",
        f"- Administrative area: {study_area['state_province']}",
        f"- Region: {study_area['region']}",
        f"- Coordinates (lake center): {coords} ({datum})",
        f"- Elevation (approx.): {study_area['elevation_m']} m",
        f"- OpenStreetMap: https://www.openstreetmap.org/?mlat={study_area['latitude']}&mlon={study_area['longitude']}#map={study_area.get('map_zoom', 10)}/{study_area['latitude']}/{study_area['longitude']}",
        f"- Google Maps: https://www.google.com/maps/search/Lake+Kinneret+(Sea+of+Galilee)/@{study_area['latitude']},{study_area['longitude']},{study_area.get('map_zoom', 10)}z",
        "",
    ]


def _build_atlas_api(study_area: dict[str, Any]) -> dict[str, Any]:
    lake = study_area["lake_name"]
    alt = study_area["alternate_name"]
    coords = _format_study_area_decimal(study_area)
    datum = study_area["geodetic_datum"]
    return {
        "name": "Kinneret Algae Atlas",
        "canonical_url": ATLAS_CITE_URL,
        "study_area": {
            "lake_name": lake,
            "alternate_name": alt,
            "country": study_area["country"],
            "country_code": study_area["country_code"],
            "state_province": study_area["state_province"],
            "region": study_area["region"],
            "coordinates": {
                "decimal_degrees": coords,
                "latitude": study_area["latitude"],
                "longitude": study_area["longitude"],
                "geodetic_datum": datum,
            },
            "elevation_m": study_area["elevation_m"],
            "citation_line": (
                f"{lake} ({alt}), {study_area['state_province']}, {study_area['country']} "
                f"({coords}, {datum})"
            ),
            "map_image": study_area["map_image"],
        },
        "citation": {
            "atlas_attribution": _atlas_attribution(),
        },
    }


def _build_llms_txt(study_area: dict[str, Any]) -> str:
    lines = [
        "# Kinneret Algae Atlas — LLM Discovery",
        "",
        "Canonical URL: https://kinneret-algae-atlas.org/",
        "Atlas attribution: Dr. Tamar Zohary, Dr. Alla Alster. Kinneret Limnological Institute, Israel Oceanographic and Limnological Research.",
        "",
        *_study_area_block(study_area),
        "Primary resources:",
        "- Site index: https://kinneret-algae-atlas.org/#algae-index",
        "- About: https://kinneret-algae-atlas.org/about/",
        "- Species pages: https://kinneret-algae-atlas.org/algae/{slug}/",
        "- Glossary: https://kinneret-algae-atlas.org/glossary/",
        "- Supplementary material: https://kinneret-algae-atlas.org/supplements/",
        "- Sitemap: https://kinneret-algae-atlas.org/sitemap.xml",
        "",
        "Machine-readable endpoints:",
        "- https://kinneret-algae-atlas.org/api/species.json",
        "- https://kinneret-algae-atlas.org/api/species/{slug}.json",
        "- https://kinneret-algae-atlas.org/api/glossary.json",
        "- https://kinneret-algae-atlas.org/api/atlas.json",
        "",
        "Compact corpus:",
        "- https://kinneret-algae-atlas.org/llms-full.txt",
        "",
        "Citation policy for downstream LLM use:",
        "- Include BOTH per-record citation and atlas-level attribution when answering species questions.",
        "- Prefer scientific names and stable species slugs for disambiguation.",
    ]
    return "\n".join(lines) + "\n"


def _species_block(record: dict[str, Any], slug: str) -> str:
    sections = record.get("sections") or {}
    metadata = record.get("metadata") or {}
    scientific_name = (record.get("scientific_name") or "").strip()
    canonical_url = f"{ATLAS_URL}/algae/{slug}/"
    updated = metadata.get("record_updated") if isinstance(metadata.get("record_updated"), str) else None

    lines: list[str] = [
        f"## Species: {scientific_name or 'Unnamed taxon'}",
        f"- Slug: {slug}",
        f"- Canonical URL: {canonical_url}",
        f"- Taxonomy: phylum={sections.get('phylum', '').strip() or '-'}; class={sections.get('class', '').strip() or '-'}; order={sections.get('order', '').strip() or '-'}",
    ]

    habitat = sections.get("habitat", "").strip()
    if habitat:
        lines.append(f"- Habitat: {_compact_text(habitat, 180)}")

    for key, label in _KEY_SIZE_FIELDS:
        value = (sections.get(key) or "").strip()
        if value:
            lines.append(f"- {label}: {_compact_text(value, 220)}")

    ecology = (sections.get("ecology") or "").strip()
    if ecology:
        lines.append(f"- Ecology (compact): {_compact_text(ecology, 240)}")

    lines.append(f"- Per-record citation: {_record_citation(updated)}")
    lines.append(f"- Atlas attribution: {_atlas_attribution()}")
    lines.append(f"- Record updated (source extraction): {updated or 'Unknown'}")
    source_file = metadata.get("source_file")
    if isinstance(source_file, str) and source_file.strip():
        lines.append(f"- Source file: {source_file.strip()}")

    return "\n".join(lines)


def _glossary_block(glossary: dict[str, Any]) -> str:
    entries = glossary.get("entries") or []
    plates = glossary.get("plates") or []
    lines = [
        "## Glossary",
        f"- Canonical URL: {ATLAS_URL}/glossary/",
        f"- Terms count: {len(entries)}",
    ]
    if isinstance(glossary.get("record_updated"), str):
        lines.append(f"- Record updated: {glossary['record_updated']}")
    if isinstance(glossary.get("source_file"), str):
        lines.append(f"- Source file: {glossary['source_file']}")
    lines.append("- Atlas attribution: " + _atlas_attribution())
    lines.append("")
    lines.append("### Glossary terms (compact)")
    for entry in entries:
        term = (entry.get("term") or "").strip()
        slug = (entry.get("slug") or "").strip()
        definition = _compact_text((entry.get("definition") or "").strip(), 180)
        if term and slug and definition:
            lines.append(f"- {term} [{slug}]: {definition}")
    if plates:
        lines.append("")
        lines.append("### Glossary plates")
        for plate in plates:
            pid = (plate.get("id") or "").strip()
            label = (plate.get("label") or "").strip()
            src = (plate.get("src") or "").strip()
            if pid and label and src:
                lines.append(f"- {label} [{pid}]: {ATLAS_URL}{src}")
    return "\n".join(lines)


def _build_species_index_item(record: dict[str, Any], slug: str) -> dict[str, Any]:
    sections = record.get("sections") or {}
    metadata = record.get("metadata") or {}
    updated = metadata.get("record_updated") if isinstance(metadata.get("record_updated"), str) else None
    return {
        "slug": slug,
        "scientific_name": (record.get("scientific_name") or "").strip(),
        "canonical_url": f"{ATLAS_URL}/algae/{slug}/",
        "taxonomy": {
            "phylum": (sections.get("phylum") or "").strip(),
            "class": (sections.get("class") or "").strip(),
            "order": (sections.get("order") or "").strip(),
        },
        "record_updated": updated,
        "citation": {
            "per_record": _record_citation(updated),
            "atlas_attribution": _atlas_attribution(),
        },
    }


def _build_species_detail(record: dict[str, Any], slug: str) -> dict[str, Any]:
    sections = record.get("sections") or {}
    key_fields = {
        key: (sections.get(key) or "").strip()
        for key, _label in _KEY_SIZE_FIELDS
        if (sections.get(key) or "").strip()
    }
    base = _build_species_index_item(record, slug)
    return {
        **base,
        "key_fields": key_fields,
        "narrative": {
            "morphology": (sections.get("morphological_features") or "").strip(),
            "ecology": (sections.get("ecology") or "").strip(),
            "environmental_conditions": (sections.get("environmental_conditions") or "").strip(),
            "further_reading": (sections.get("further_reading") or "").strip(),
        },
    }


def _build_glossary_api(glossary: dict[str, Any]) -> dict[str, Any]:
    updated = glossary.get("record_updated") if isinstance(glossary.get("record_updated"), str) else None
    entries = glossary.get("entries") or []
    plates = glossary.get("plates") or []
    return {
        "title": glossary.get("title") or "Glossary",
        "canonical_url": f"{ATLAS_URL}/glossary/",
        "record_updated": updated,
        "source_file": glossary.get("source_file"),
        "citation": {
            "per_record": _record_citation(updated),
            "atlas_attribution": _atlas_attribution(),
        },
        "plates": [
            {
                "id": plate.get("id"),
                "label": plate.get("label"),
                "src": f"{ATLAS_URL}{plate.get('src')}",
            }
            for plate in plates
            if isinstance(plate, dict)
        ],
        "entries": [
            {
                "term": entry.get("term"),
                "slug": entry.get("slug"),
                "definition": entry.get("definition"),
                "letter": entry.get("letter"),
            }
            for entry in entries
            if isinstance(entry, dict)
        ],
    }


def _build_llms_full(
    records_with_slugs: list[tuple[dict[str, Any], str]],
    glossary: dict[str, Any],
    study_area: dict[str, Any],
) -> str:
    lines = [
        "# Kinneret Algae Atlas — Compact LLM Corpus",
        "",
        "Scope: compact machine-readable digest of species and glossary data.",
        f"Atlas URL: {ATLAS_CITE_URL}",
        f"Atlas attribution: {_atlas_attribution()}",
        "",
        *_study_area_block(study_area),
        "Citation requirement: include BOTH per-record citation and atlas-level attribution in answers.",
        "",
        f"Species count: {len(records_with_slugs)}",
        "",
    ]
    for record, slug in records_with_slugs:
        lines.append(_species_block(record, slug))
        lines.append("")

    lines.append(_glossary_block(glossary))
    lines.append("")
    return "\n".join(lines)


def _write_static_api_files(
    records_with_slugs: list[tuple[dict[str, Any], str]],
    glossary: dict[str, Any],
    study_area: dict[str, Any],
    out_dir: Path,
) -> None:
    api_dir = out_dir / "api"
    species_dir = api_dir / "species"
    species_dir.mkdir(parents=True, exist_ok=True)

    species_index = [_build_species_index_item(record, slug) for record, slug in records_with_slugs]
    expected_species_files = {f"{slug}.json" for _record, slug in records_with_slugs}
    for stale_file in species_dir.glob("*.json"):
        if stale_file.name not in expected_species_files:
            stale_file.unlink()

    (api_dir / "species.json").write_text(
        json.dumps({"count": len(species_index), "species": species_index}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    for record, slug in records_with_slugs:
        (species_dir / f"{slug}.json").write_text(
            json.dumps(_build_species_detail(record, slug), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    (api_dir / "glossary.json").write_text(
        json.dumps(_build_glossary_api(glossary), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (api_dir / "atlas.json").write_text(
        json.dumps(_build_atlas_api(study_area), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {(api_dir / 'species.json')}")
    print(f"Wrote {(api_dir / 'glossary.json')}")
    print(f"Wrote {(api_dir / 'atlas.json')}")
    print(f"Wrote {len(records_with_slugs)} files under {species_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate llms.txt and llms-full.txt from processed data.")
    parser.add_argument(
        "--algae-input",
        default="data/processed/algae_records.json",
        help="Path to processed algae records JSON.",
    )
    parser.add_argument(
        "--glossary-input",
        default="data/processed/glossary.json",
        help="Path to processed glossary JSON.",
    )
    parser.add_argument(
        "--output-dir",
        default="public",
        help="Directory where llms.txt and llms-full.txt are written.",
    )
    args = parser.parse_args()

    algae_path = Path(args.algae_input)
    glossary_path = Path(args.glossary_input)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    records = json.loads(algae_path.read_text(encoding="utf-8"))
    glossary = json.loads(glossary_path.read_text(encoding="utf-8"))
    study_area = _load_study_area()
    records_with_slugs = _records_with_unique_slugs(records)

    llms_txt = _build_llms_txt(study_area)
    llms_full = _build_llms_full(records_with_slugs, glossary, study_area)

    (out_dir / "llms.txt").write_text(llms_txt, encoding="utf-8")
    (out_dir / "llms-full.txt").write_text(llms_full, encoding="utf-8")
    _write_static_api_files(records_with_slugs, glossary, study_area, out_dir)
    print(f"Wrote {(out_dir / 'llms.txt')}")
    print(f"Wrote {(out_dir / 'llms-full.txt')}")


if __name__ == "__main__":
    main()
