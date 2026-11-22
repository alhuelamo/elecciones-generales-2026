import re
from pathlib import Path

import pytest
import yaml

from elecciones_pipeline.party_colors import load_party_colors

PARTY_COLORS_PATH = Path(__file__).parent.parent / "data" / "party_colors.yaml"
HEX_PATTERN = re.compile(r"^#[0-9a-f]{6}$")
ALLOWED_FIELDS = {"color", "sourceUrl", "inheritedFrom"}
WIKIPEDIA_PREFIX = "https://es.wikipedia.org/wiki/"


@pytest.fixture(scope="module")
def entries():
    return yaml.safe_load(PARTY_COLORS_PATH.read_text(encoding="utf-8"))


def test_every_key_is_a_non_empty_string(entries):
    assert all(isinstance(key, str) and key.strip() for key in entries)


def test_every_color_is_lowercase_hex(entries):
    for key, entry in entries.items():
        assert HEX_PATTERN.match(entry["color"]), key


def test_every_source_url_is_spanish_wikipedia(entries):
    for key, entry in entries.items():
        assert entry["sourceUrl"].startswith(WIKIPEDIA_PREFIX), key


def test_entries_have_no_extra_keys(entries):
    for key, entry in entries.items():
        assert set(entry) <= ALLOWED_FIELDS, key


def test_inherited_from_names_an_entry_that_owns_its_colour(entries):
    for key, entry in entries.items():
        parent_key = entry.get("inheritedFrom")
        if parent_key is None:
            continue
        parent = entries[parent_key]
        assert "inheritedFrom" not in parent, key
        assert parent["color"] == entry["color"], key
        assert parent["sourceUrl"] == entry["sourceUrl"], key


def test_loader_accepts_the_committed_file():
    assert load_party_colors(PARTY_COLORS_PATH)
