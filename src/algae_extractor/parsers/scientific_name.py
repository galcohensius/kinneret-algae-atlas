import re


def compile_scientific_name_patterns(patterns: list[str]) -> list[re.Pattern[str]]:
    return [re.compile(pattern) for pattern in patterns]


def detect_scientific_name(text: str, compiled_patterns: list[re.Pattern[str]]) -> str | None:
    for pattern in compiled_patterns:
        match = pattern.search(text)
        if match:
            if match.lastindex:
                return match.group(1).strip()
            return match.group(0).strip()
    return None


def detect_record_start(
    text: str, compiled_patterns: list[re.Pattern[str]]
) -> tuple[str, str] | None:
    for pattern in compiled_patterns:
        match = pattern.match(text)
        if not match:
            continue
        if match.lastindex:
            detected_name = match.group(1).strip()
            remainder = text[match.end(1) :].strip(" -:\t")
            return detected_name, remainder
        detected_name = match.group(0).strip()
        return detected_name, ""
    return None
