from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class AlgaeRecord:
    scientific_name: str | None
    images: list[str] = field(default_factory=list)
    # Captions from Word-style "Plate / Figure(s)" paragraphs right after an
    # image (used for naming files plate-*.png vs figure-*.png in the extractor).
    image_captions: list[str] = field(default_factory=list)
    sections: dict[str, str] = field(default_factory=dict)
    # Rich inline styling extracted from Word runs. Values are arrays of
    # segments {text, italic, bold}.
    sections_rich: dict[str, list[dict[str, Any]]] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
