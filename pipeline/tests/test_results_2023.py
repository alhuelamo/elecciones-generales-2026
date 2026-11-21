from conftest import FIXTURES

from elecciones_pipeline.results_2023 import CongresoXlsxSource, SenadoXlsxSource

EXCERPT = FIXTURES / "results_2023" / "congreso_excerpt.xlsx"


def votes_of(results, constituency_id, acronym):
    return next(
        item
        for item in results.candidacies
        if item.constituency_id == constituency_id and item.acronym == acronym
    )


def test_barcelona_votes_and_seats():
    results = CongresoXlsxSource(EXCERPT).load()

    psc = votes_of(results, "08", "PSOE")
    assert (psc.chamber, psc.votes, psc.seats) == ("congreso", 952347, 13)
    assert votes_of(results, "08", "PP").votes == 367519


def test_balears_province_code_is_zero_padded():
    results = CongresoXlsxSource(EXCERPT).load()

    assert votes_of(results, "07", "VOX").votes == 76547


def test_valid_votes_per_constituency():
    results = CongresoXlsxSource(EXCERPT).load()

    assert results.valid_votes[("congreso", "07")] == 503280
    assert results.valid_votes[("congreso", "08")] == 2667478


def test_parties_without_votes_are_skipped():
    results = CongresoXlsxSource(EXCERPT).load()

    assert all(item.votes > 0 for item in results.candidacies)
    assert not any(item.constituency_id in ("52", "99") for item in results.candidacies)


SENADO_EXCERPT = FIXTURES / "results_2023" / "senado_excerpt.xlsx"
SEATS = {"08": 4, "07-mallorca": 3, "07-eivissa": 1, "07-formentera": 1}


def senado_results():
    return SenadoXlsxSource(SENADO_EXCERPT, SEATS).load()


def test_senado_votes_are_most_voted_candidate_of_the_candidacy():
    results = senado_results()

    assert votes_of(results, "08", "PSC").votes == 858698
    assert votes_of(results, "08", "PSC").chamber == "senado"


def test_senado_seats_are_top_candidates_by_votes():
    results = senado_results()

    assert votes_of(results, "08", "PSC").seats == 3
    assert votes_of(results, "08", "ERC").seats == 1
    assert votes_of(results, "08", "PP").seats == 0


def test_senado_islands_use_spec_ids():
    results = senado_results()

    assert votes_of(results, "07-mallorca", "PP").votes == 143225
    assert votes_of(results, "07-mallorca", "PP").seats == 2


def test_senado_combined_eivissa_formentera_feeds_both_constituencies():
    results = senado_results()

    for constituency_id in ("07-eivissa", "07-formentera"):
        assert votes_of(results, constituency_id, "PP").votes == 23472
    assert results.valid_votes[("senado", "07-eivissa")] == 58115
