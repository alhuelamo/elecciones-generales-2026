from pathlib import Path

import pytest

from elecciones_pipeline.build import _load_results_2023
from elecciones_pipeline.constituencies import load_constituencies
from elecciones_pipeline.normalize import slugify
from elecciones_pipeline.results_2023 import load_lineage

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_RESULTS_DIR = DATA_DIR / "raw" / "results_2023"


@pytest.fixture(scope="module")
def lineage():
    return load_lineage(DATA_DIR / "lineage_2023.yaml")


@pytest.fixture(scope="module")
def acronyms_2023():
    if not RAW_RESULTS_DIR.exists():
        pytest.skip("2023 raw results not downloaded")
    results = _load_results_2023(RAW_RESULTS_DIR, load_constituencies(DATA_DIR))
    return {slugify(item.acronym) for item in results.candidacies}


def test_explicit_lineage_references_existing_2023_acronyms(lineage, acronyms_2023):
    referenced = {slugify(name) for names in lineage.values() for name in names}
    assert referenced - acronyms_2023 == set()


@pytest.mark.parametrize(
    "acronym, expected",
    [
        ("FA", ["SUMAR"]),
        ("COMUNS-FRONT AMPLI", ["SUMAR"]),
        ("PODEMOS", []),
        ("SALF", []),
        ("D21", []),
        ("CCa-1.ºCAN", ["CCa"]),
        ("UPN-PP", ["U.P.N.", "PP"]),
        ("SDP (PSOE-IU-MS)", ["SUMAR"]),
        ("COMPROMIS-EUPV-PODEM-ERPV", ["SUMAR"]),
        ("ARAMÉS-EU-MS", ["SUMAR"]),
        ("NC-BC, PODEMOS, IU, SUMAR", ["SUMAR", "NC-bc"]),
        ("SDP (PSOE-COMPROMIS-EUPV)", ["SUMAR - COMPROMÍS"]),
        ("SDP (PSOE-CHA-IU-MS)", ["SUMAR", "SUMAR ARAGÓN"]),
        ("PSIB-PSOE-MÉS PER MALLORCA-SUMAR-EUIB", ["MÉS PER MALLORCA-SUMAR"]),
        ("MUNDO+JUSTO", ["PUM+J"]),
    ],
)
def test_known_realignments_have_entries(lineage, acronym, expected):
    assert lineage[slugify(acronym)] == expected
