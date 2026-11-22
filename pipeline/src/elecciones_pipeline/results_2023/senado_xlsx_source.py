from dataclasses import dataclass
from pathlib import Path

from openpyxl import load_workbook

from elecciones_pipeline.errors import BuildError
from elecciones_pipeline.normalize import slugify
from elecciones_pipeline.results_2023.source import (
    CandidacyResult2023,
    ConstituencyResult2023,
    PartyResult2023,
    Results2023,
)

SENADO = "senado"
HEADER_FIRST_CELL = "Nombre de Comunidad"
PROVINCE_CODE_COLUMN = 1
ISLAND_DISTRICT_COLUMN = 3
CONSTITUENCY_NAME_COLUMN = 4
ELECTORATE_COLUMN = 9
TOTAL_VOTES_COLUMN = 12
VALID_VOTES_COLUMN = 13
BLANK_VOTES_COLUMN = 15
FIRST_CANDIDATE_COLUMN = 17
PROVINCE_DISTRICT = 9


@dataclass(frozen=True)
class CombinedIslandDistrict:
    constituency_ids: tuple[str, ...]
    seats: int


COMBINED_ISLAND_DISTRICTS = {
    "eivissa-formentera": CombinedIslandDistrict(
        constituency_ids=("07-eivissa", "07-formentera"), seats=1
    )
}


class SenadoXlsxSource:
    def __init__(self, path: Path, seats_by_constituency: dict[str, int]):
        self._path = path
        self._seats = seats_by_constituency

    def load(self) -> Results2023:
        sheet = load_workbook(self._path, read_only=True).active
        rows = list(sheet.iter_rows(values_only=True))
        header_index = _header_index(rows)
        acronyms = rows[header_index]
        party_names = rows[header_index - 1]
        candidacies: list[CandidacyResult2023] = []
        valid_votes: dict[tuple[str, str], int] = {}
        constituencies: dict[tuple[str, str], ConstituencyResult2023] = {}
        for row in rows[header_index + 1 :]:
            if not isinstance(row[PROVINCE_CODE_COLUMN], int):
                continue
            for constituency_id, seats in self._block_districts(row):
                constituencies[(SENADO, constituency_id)] = _constituency_result(
                    row, acronyms, party_names, constituency_id, seats
                )
            for constituency_id in _constituency_ids(row):
                valid_votes[(SENADO, constituency_id)] = row[VALID_VOTES_COLUMN]
                candidacies.extend(
                    _constituency_results(
                        row, acronyms, constituency_id, self._seats[constituency_id]
                    )
                )
        return Results2023(tuple(candidacies), valid_votes, constituencies)

    def _block_districts(self, row: tuple) -> list[tuple[str, int]]:
        combined = _combined_district(row)
        if combined:
            return [(id_, combined.seats) for id_ in combined.constituency_ids]
        return [(id_, self._seats[id_]) for id_ in _constituency_ids(row)]


def _header_index(rows: list[tuple]) -> int:
    for index, row in enumerate(rows):
        if row and row[0] == HEADER_FIRST_CELL:
            return index
    raise BuildError("2023 Senado results: header row not found")


def _constituency_ids(row: tuple) -> tuple[str, ...]:
    province_code = f"{row[PROVINCE_CODE_COLUMN]:02d}"
    if row[ISLAND_DISTRICT_COLUMN] == PROVINCE_DISTRICT:
        return (province_code,)
    slug = slugify(row[CONSTITUENCY_NAME_COLUMN])
    if slug in COMBINED_ISLAND_DISTRICTS:
        return ()
    return (f"{province_code}-{slug}",)


def _combined_district(row: tuple) -> CombinedIslandDistrict | None:
    if row[ISLAND_DISTRICT_COLUMN] == PROVINCE_DISTRICT:
        return None
    return COMBINED_ISLAND_DISTRICTS.get(slugify(row[CONSTITUENCY_NAME_COLUMN]))


def _constituency_result(row, acronyms, party_names, constituency_id, seats):
    combined = _combined_district(row)
    return ConstituencyResult2023(
        chamber=SENADO,
        constituency_id=constituency_id,
        electorate=row[ELECTORATE_COLUMN],
        total_votes=row[TOTAL_VOTES_COLUMN],
        valid_votes=row[VALID_VOTES_COLUMN],
        blank_votes=row[BLANK_VOTES_COLUMN],
        combined_district_name=(
            str(row[CONSTITUENCY_NAME_COLUMN]).strip() if combined else None
        ),
        parties=_party_results(row, acronyms, party_names, seats),
    )


def _party_results(row, acronyms, party_names, seats):
    ranked = sorted(
        (
            (
                row[column],
                str(acronyms[column]).strip(),
                str(party_names[column]).strip(),
            )
            for column in range(FIRST_CANDIDATE_COLUMN, len(row))
            if row[column]
        ),
        reverse=True,
    )
    winners = ranked[:seats]
    seats_by_party: dict[str, PartyResult2023] = {}
    for _, acronym, name in winners:
        previous = seats_by_party.get(acronym)
        seat_count = previous.seats + 1 if previous else 1
        seats_by_party[acronym] = PartyResult2023(acronym, name, None, seat_count)
    best_votes = {}
    for votes, acronym, _ in winners:
        best_votes.setdefault(acronym, votes)
    return tuple(
        sorted(
            seats_by_party.values(),
            key=lambda party: (-party.seats, -best_votes[party.acronym]),
        )
    )


def _constituency_results(row, acronyms, constituency_id, seats):
    ranked = sorted(
        (
            (row[column], str(acronyms[column]).strip())
            for column in range(FIRST_CANDIDATE_COLUMN, len(row))
            if row[column]
        ),
        reverse=True,
    )
    elected = [acronym for _, acronym in ranked[:seats]]
    best_votes: dict[str, int] = {}
    for votes, acronym in ranked:
        best_votes.setdefault(acronym, votes)
    return [
        CandidacyResult2023(
            SENADO, constituency_id, acronym, votes, elected.count(acronym)
        )
        for acronym, votes in best_votes.items()
    ]
