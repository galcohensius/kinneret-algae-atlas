def build_section_alias_lookup(section_aliases: dict[str, list[str]]) -> dict[str, str]:
    alias_lookup: dict[str, str] = {}
    for canonical_name, aliases in section_aliases.items():
        for alias in aliases:
            alias_lookup[alias.strip().lower().rstrip(":")] = canonical_name
        alias_lookup[canonical_name.strip().lower()] = canonical_name
    return alias_lookup


def detect_section_heading(text: str, alias_lookup: dict[str, str]) -> str | None:
    normalized = text.strip().lower().rstrip(":")
    return alias_lookup.get(normalized)
