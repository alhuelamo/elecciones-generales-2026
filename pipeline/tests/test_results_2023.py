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


def test_congreso_constituency_result_has_totals():
    results = CongresoXlsxSource(EXCERPT).load()

    barcelona = results.constituencies[("congreso", "08")]
    assert barcelona.chamber == "congreso"
    assert barcelona.constituency_id == "08"
    assert barcelona.electorate == 4243500
    assert barcelona.total_votes == 2688720
    assert barcelona.valid_votes == 2667478
    assert barcelona.blank_votes == 21059
    assert barcelona.combined_district_name is None


def test_congreso_constituency_parties_have_ballot_name_votes_and_seats():
    results = CongresoXlsxSource(EXCERPT).load()

    parties = results.constituencies[("congreso", "08")].parties
    psoe = next(party for party in parties if party.votes == 952347)
    assert (psoe.acronym, psoe.name, psoe.seats) == (
        "PSOE",
        "PARTIDO SOCIALISTA OBRERO ESPAÑOL",
        13,
    )


def test_congreso_constituency_parties_are_sorted_by_votes_and_skip_zero_votes():
    results = CongresoXlsxSource(EXCERPT).load()

    for constituency in results.constituencies.values():
        votes = [party.votes for party in constituency.parties]
        assert votes == sorted(votes, reverse=True)
        assert all(vote > 0 for vote in votes)
    assert ("congreso", "52") not in results.constituencies


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


def test_senado_combined_eivissa_formentera_district_is_not_attributed_to_either_island():
    results = senado_results()

    assert not [
        item
        for item in results.candidacies
        if item.constituency_id in ("07-eivissa", "07-formentera")
    ]
    assert ("senado", "07-eivissa") not in results.valid_votes
    assert ("senado", "07-formentera") not in results.valid_votes
