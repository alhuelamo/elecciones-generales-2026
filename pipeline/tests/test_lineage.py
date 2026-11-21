import pytest

from elecciones_pipeline.results_2023 import (
    CandidacyResult2023,
    Results2023,
    load_lineage,
    predecessor_acronyms,
    summarize,
)


def result(acronym, votes, seats, chamber="congreso", constituency_id="08"):
    return CandidacyResult2023(chamber, constituency_id, acronym, votes, seats)


@pytest.fixture
def results():
    return Results2023(
        candidacies=(
            result("PP", 300, 2),
            result("SUMAR", 100, 1),
            result("PSC", 33, 0),
            result("UPN", 50, 1, constituency_id="31"),
            result("PP", 20, 0, chamber="senado", constituency_id="31"),
            result("PP", 90, 1, chamber="senado", constituency_id="31"),
        ),
        valid_votes={("congreso", "08"): 1000},
    )


def test_missing_entry_uses_same_acronym(results):
    assert predecessor_acronyms("P.P.", {}) is None
    assert summarize("congreso", "08", "P.P.", {}, results)["asAcronyms"] == ["PP"]


def test_explicit_list_sums_predecessors(results):
    lineage = {"frente-amplio": ["SUMAR", "PSC"]}

    summary = summarize("congreso", "08", "Frente Amplio", lineage, results)

    assert summary == {
        "votes": 133,
        "percentage": 13.3,
        "seats": 1,
        "asAcronyms": ["SUMAR", "PSC"],
    }


def test_explicit_empty_list_means_no_predecessor(results):
    assert summarize("congreso", "08", "PP", {"pp": []}, results) is None


def test_no_matching_predecessor_is_none(results):
    assert summarize("congreso", "08", "XYZ", {}, results) is None


def test_percentage_rounds_to_two_decimals():
    results = Results2023((result("PP", 1, 0),), {("congreso", "08"): 3})

    assert summarize("congreso", "08", "PP", {}, results)["percentage"] == 33.33


def test_senado_uses_max_votes_and_null_percentage(results):
    summary = summarize("senado", "31", "PP", {}, results)

    assert summary == {
        "votes": 90,
        "percentage": None,
        "seats": 1,
        "asAcronyms": ["PP", "PP"],
    }


def test_load_lineage_normalizes_keys(tmp_path):
    path = tmp_path / "lineage.yaml"
    path.write_text("Frente Amplio: [SUMAR]\nPodemos: []\n", encoding="utf-8")

    assert load_lineage(path) == {"frente-amplio": ["SUMAR"], "podemos": []}
