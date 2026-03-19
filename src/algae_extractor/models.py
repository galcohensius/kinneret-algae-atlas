from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class AlgaeRecord:
    scientific_name: str | None
    images: list[str] = field(default_factory=list)
    sections: dict[str, str] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
