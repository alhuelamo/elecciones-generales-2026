from elecciones_pipeline.results_2023 import ConstituencyResult2023, PartyResult2023
from elecciones_pipeline.results_2023.constituency_json import (
    constituency_results_json,
)

COLORS = {"PP": "#1e4b8f"}


def congreso_result() -> ConstituencyResult2023:
    return ConstituencyResult2023(
        chamber="congreso",
        constituency_id="08",
        electorate=1000,
        total_votes=700,
        valid_votes=600,
        blank_votes=6,
        combined_district_name=None,
        parties=(
            PartyResult2023("PP", "PARTIDO POPULAR", 300, 3),
            PartyResult2023("XYZ", "PARTIDO X", 294, 2),
        ),
    )


def senado_result() -> ConstituencyResult2023:
    return ConstituencyResult2023(
        chamber="senado",
        constituency_id="07-eivissa",
        electorate=1000,
        total_votes=500,
        valid_votes=480,
        blank_votes=20,
        combined_district_name="Eivissa-Formentera",
        parties=(PartyResult2023("PP", "PARTIDO POPULAR", None, 1),),
    )


def test_congreso_result_has_exact_shape():
    assert constituency_results_json(congreso_result(), COLORS) == {
        "electorate": 1000,
        "totalVotes": 700,
        "turnoutPercentage": 70.0,
        "validVotes": 600,
        "blankVotes": 6,
        "blankPercentage": 1.0,
        "combinedDistrictName": None,
        "parties": [
            {
                "acronym": "PP",
                "name": "PARTIDO POPULAR",
                "votes": 300,
                "percentage": 50.0,
                "seats": 3,
                "color": "#1e4b8f",
            },
            {
                "acronym": "XYZ",
                "name": "PARTIDO X",
                "votes": 294,
                "percentage": 49.0,
                "seats": 2,
                "color": None,
            },
        ],
    }


def test_senado_result_has_null_votes_and_percentages():
    result = constituency_results_json(senado_result(), COLORS)

    assert result["blankPercentage"] is None
    assert result["combinedDistrictName"] == "Eivissa-Formentera"
    assert result["parties"] == [
        {
            "acronym": "PP",
            "name": "PARTIDO POPULAR",
            "votes": None,
            "percentage": None,
            "seats": 1,
            "color": "#1e4b8f",
        }
    ]


def test_missing_result_gives_none():
    assert constituency_results_json(None, COLORS) is None
