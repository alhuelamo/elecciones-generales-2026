import re
from pathlib import Path

import yaml

from elecciones_pipeline.errors import BuildError

HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


def load_party_colors(path: Path) -> dict[str, str]:
    entries = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return {acronym: _parse_color(acronym, entry) for acronym, entry in entries.items()}


def _parse_color(acronym: str, entry: dict) -> str:
    color = (entry or {}).get("color")
    if not isinstance(color, str) or not HEX_COLOR_PATTERN.match(color):
        raise BuildError(f"party colour for {acronym!r} must be a #rrggbb hex")
    return color.lower()
