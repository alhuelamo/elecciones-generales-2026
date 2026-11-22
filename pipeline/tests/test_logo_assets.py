import re
from pathlib import Path

import pytest
import yaml

DATA_DIR = Path(__file__).parent.parent / "data"
LOGOS_DIR = Path(__file__).parent.parent.parent / "web" / "public" / "logos"
MAX_LOGO_BYTES = 200 * 1024
FORBIDDEN_SVG_PATTERNS = {
    "script": re.compile(r"<\s*script", re.IGNORECASE),
    "event handler": re.compile(r"\son[a-z]+\s*=", re.IGNORECASE),
    "foreignObject": re.compile(r"<\s*foreignObject", re.IGNORECASE),
    "remote href": re.compile(
        r"""(?:xlink:)?href\s*=\s*["']\s*(?:https?:)?//""", re.IGNORECASE
    ),
    "javascript url": re.compile(r"javascript:", re.IGNORECASE),
}
LOGOS = yaml.safe_load((DATA_DIR / "logos.yaml").read_text())
SVG_ENTRIES = {
    key: entry for key, entry in LOGOS.items() if entry["file"].endswith(".svg")
}


@pytest.mark.parametrize("key", sorted(LOGOS))
def test_logo_file_exists_and_is_small(key):
    logo_file = LOGOS_DIR / LOGOS[key]["file"]
    assert logo_file.is_file()
    assert logo_file.stat().st_size <= MAX_LOGO_BYTES


@pytest.mark.parametrize("key", sorted(LOGOS))
def test_logo_entry_records_provenance(key):
    entry = LOGOS[key]
    assert entry["sourceUrl"].startswith("https://")
    assert entry["license"]
    assert entry["author"]


@pytest.mark.parametrize("key", sorted(SVG_ENTRIES))
def test_svg_logo_is_sanitized(key):
    content = (LOGOS_DIR / SVG_ENTRIES[key]["file"]).read_text(encoding="utf-8")
    found = [
        name
        for name, pattern in FORBIDDEN_SVG_PATTERNS.items()
        if pattern.search(content)
    ]
    assert found == []
