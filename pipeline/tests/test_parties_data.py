from pathlib import Path

import pytest
import yaml

from elecciones_pipeline.build import BOE_ID
from elecciones_pipeline.candidacies import BoeXmlSource, parse_candidacies
from elecciones_pipeline.parties import load_party_catalog

DATA_DIR = Path(__file__).parent.parent / "data"
BOE_XML = DATA_DIR / "raw" / f"{BOE_ID}.xml"


@pytest.fixture(scope="module")
def catalog():
    return load_party_catalog(DATA_DIR / "parties.yaml")


@pytest.fixture(scope="module")
def acronyms():
    document = BoeXmlSource(BOE_XML, BOE_ID).load()
    return {candidacy.header.acronym for candidacy in parse_candidacies(document)}


def test_catalog_loads_without_duplicate_aliases(catalog):
    assert catalog.to_json({})["parties"]


def test_every_full_tier_party_resolves_to_a_boe_acronym(catalog, acronyms):
    raw_parties = yaml.safe_load((DATA_DIR / "parties.yaml").read_text("utf-8"))
    full_keys = [key for key, party in raw_parties.items() if party["tier"] == "full"]
    matched_keys = {catalog.match(acronym) for acronym in acronyms}
    assert [key for key in full_keys if key not in matched_keys] == []
