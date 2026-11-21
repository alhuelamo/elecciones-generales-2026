import json
from pathlib import Path

import pytest
import yaml

from elecciones_pipeline.parties import load_party_catalog

DATA_DIR = Path(__file__).parent.parent / "data"
PUBLISHED_DATA_DIR = Path(__file__).parent.parent.parent / "web" / "public" / "data"


@pytest.fixture(scope="module")
def catalog():
    return load_party_catalog(DATA_DIR / "parties.yaml")


@pytest.fixture(scope="module")
def published_party_keys():
    ballot_paths = PUBLISHED_DATA_DIR.glob("*/*.json")
    ballots = [json.loads(path.read_text("utf-8")) for path in ballot_paths]
    return {
        candidacy["partyKey"]
        for ballot in ballots
        for candidacy in ballot["candidacies"]
    }


def test_catalog_loads_without_duplicate_aliases(catalog):
    assert catalog.to_json({})["parties"]


def test_every_full_tier_party_appears_in_published_ballots(published_party_keys):
    raw_parties = yaml.safe_load((DATA_DIR / "parties.yaml").read_text("utf-8"))
    full_keys = [key for key, party in raw_parties.items() if party["tier"] == "full"]
    assert [key for key in full_keys if key not in published_party_keys] == []
