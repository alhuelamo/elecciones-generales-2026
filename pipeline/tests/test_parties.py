import json
from pathlib import Path

import pytest
from jsonschema import ValidationError, validate

from elecciones_pipeline.parties import (
    DuplicateAlias,
    load_logos,
    load_party_catalog,
)

PIPELINE_DIR = Path(__file__).parent.parent
FIXTURES = Path(__file__).parent / "fixtures"
SCHEMA = json.loads(
    (PIPELINE_DIR.parent / "schemas" / "parties.schema.json").read_text()
)


@pytest.fixture
def catalog():
    return load_party_catalog(FIXTURES / "parties.yaml")


@pytest.fixture
def logos():
    return load_logos(FIXTURES / "logos.yaml")


def test_match_by_slugified_alias(catalog):
    assert catalog.match("PSC-PSOE") == "psoe"
    assert catalog.match("psc psoe") == "psoe"


def test_unknown_acronym_returns_none(catalog):
    assert catalog.match("NOPE") is None


def test_match_candidacy_uses_acronym_when_present(catalog):
    assert catalog.match_candidacy("PSC-PSOE", "ANYTHING") == "psoe"


def test_match_candidacy_falls_back_to_denomination_when_acronym_empty(catalog):
    assert catalog.match_candidacy("", "PSOE") == "psoe"


def test_match_candidacy_falls_back_to_denomination_when_acronym_unmatched(catalog):
    assert catalog.match_candidacy("NOPE", "Psoe") == "psoe"


def test_match_candidacy_unknown_returns_none(catalog):
    assert catalog.match_candidacy("", "NOPE") is None


def test_duplicate_alias_across_parties_raises(tmp_path):
    path = tmp_path / "parties.yaml"
    path.write_text("a: {name: A, aliases: [X-Y]}\nb: {name: B, aliases: [x y]}\n")
    with pytest.raises(DuplicateAlias):
        load_party_catalog(path)


def test_to_json_validates_against_schema(catalog, logos):
    document = catalog.to_json(logos)
    validate(document, SCHEMA)
    assert document["parties"]["psoe"]["seats2023"] == {"congreso": 121, "senado": 82}
    assert document["parties"]["pp"]["seats2023"] is None
    assert document["parties"]["pp"]["wikipedia"] == {
        "es": None,
        "ca": None,
        "eu": None,
        "gl": None,
    }
    assert document["parties"]["psoe"]["wikipedia"]["eu"] == (
        "https://eu.wikipedia.org/wiki/Espainiako_Alderdi_Sozialista_Langilea"
    )
    assert document["parties"]["psoe"]["wikipedia"]["gl"] is None


def test_schema_rejects_wikipedia_without_eu(catalog, logos):
    document = catalog.to_json(logos)
    del document["parties"]["psoe"]["wikipedia"]["eu"]
    with pytest.raises(ValidationError):
        validate(document, SCHEMA)


def test_logo_path_and_missing_logo_is_null(catalog, logos):
    parties = catalog.to_json(logos)["parties"]
    assert parties["psoe"]["logo"] == {
        "path": "logos/psoe.svg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:PSOE_logo.svg",
        "license": "Public domain",
        "author": "PSOE",
    }
    assert parties["pp"]["logo"] is None


def test_empty_yaml_gives_empty_catalog(tmp_path):
    path = tmp_path / "parties.yaml"
    path.write_text("{}", encoding="utf-8")
    assert load_party_catalog(path).to_json({}) == {"parties": {}}


def test_psc_is_its_own_party_with_logo():
    data_dir = PIPELINE_DIR / "data"
    real_catalog = load_party_catalog(data_dir / "parties.yaml")
    assert real_catalog.match("PSC") == "psc"
    assert real_catalog.match("PSC-PSOE") == "psc"
    assert real_catalog.match("PSOE") == "psoe"
    assert "psc" in load_logos(data_dir / "logos.yaml")
