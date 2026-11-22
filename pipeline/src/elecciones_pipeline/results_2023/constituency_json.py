from elecciones_pipeline.results_2023.source import (
    ConstituencyResult2023,
    PartyResult2023,
)

CONGRESO = "congreso"


def constituency_results_json(
    result: ConstituencyResult2023 | None, colors: dict[str, str]
) -> dict | None:
    if result is None:
        return None
    has_votes = result.chamber == CONGRESO
    return {
        "electorate": result.electorate,
        "totalVotes": result.total_votes,
        "turnoutPercentage": _percentage(result.total_votes, result.electorate),
        "validVotes": result.valid_votes,
        "blankVotes": result.blank_votes,
        "blankPercentage": (
            _percentage(result.blank_votes, result.valid_votes) if has_votes else None
        ),
        "combinedDistrictName": result.combined_district_name,
        "parties": [
            _party_json(party, result.valid_votes, colors) for party in result.parties
        ],
    }


def _party_json(
    party: PartyResult2023, valid_votes: int, colors: dict[str, str]
) -> dict:
    has_votes = party.votes is not None
    return {
        "acronym": party.acronym,
        "name": party.name,
        "votes": party.votes,
        "percentage": _percentage(party.votes, valid_votes) if has_votes else None,
        "seats": party.seats,
        "color": colors.get(party.acronym),
    }


def _percentage(part: int, whole: int) -> float:
    return round(part / whole * 100, 2)
