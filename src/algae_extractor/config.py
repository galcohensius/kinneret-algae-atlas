import json
from pathlib import Path
from typing import Any


def default_config_path() -> Path:
    return Path(__file__).with_name("default_config.json")


def load_config(config_path: str | Path | None) -> dict[str, Any]:
    path = Path(config_path) if config_path else default_config_path()
    with path.open("r", encoding="utf-8") as fp:
        config = json.load(fp)
    return config
