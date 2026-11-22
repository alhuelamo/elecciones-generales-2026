from pathlib import Path

from openpyxl import load_workbook

from elecciones_pipeline.errors import BuildError
from elecciones_pipeline.results_2023.source import (
    CandidacyResult2023,
    ConstituencyResult2023,
    PartyResult2023,
    Results2023,
)

CONGRESO = "congreso"
HEADER_FIRST_CELL = "Nombre de Comunidad"
PROVINCE_CODE_COLUMN = 1
ELECTORATE_COLUMN = 7
TOTAL_VOTES_COLUMN = 10
VALID_VOTES_COLUMN = 11
BLANK_VOTES_COLUMN = 13
FIRST_PARTY_COLUMN = 15


class CongresoXlsxSource:
    def __init__(self, path: Path):
        self._path = path

    def load(self) -> Results2023:
        rows = list(
            load_workbook(self._path, read_only=True).active.iter_rows(values_only=True)
        )
        header_index = _header_index(rows)
        party_columns = _party_columns(rows[header_index - 1], rows[header_index - 2])
        candidacies: list[CandidacyResult2023] = []
        valid_votes: dict[tuple[str, str], int] = {}
        constituencies: dict[tuple[str, str], ConstituencyResult2023] = {}
        for row in rows[header_index + 1 :]:
            if not isinstance(row[PROVINCE_CODE_COLUMN], int):
                continue
            constituency_id = f"{row[PROVINCE_CODE_COLUMN]:02d}"
            valid_votes[(CONGRESO, constituency_id)] = row[VALID_VOTES_COLUMN]
            constituencies[(CONGRESO, constituency_id)] = _constituency_result(
                row, constituency_id, party_columns
            )
            candidacies.extend(_province_results(row, constituency_id, party_columns))
        return Results2023(tuple(candidacies), valid_votes, constituencies)


def _header_index(rows: list[tuple]) -> int:
    for index, row in enumerate(rows):
        if row and row[0] == HEADER_FIRST_CELL:
            return index
    raise BuildError("2023 Congreso results: header row not found")


def _party_columns(acronym_row: tuple, name_row: tuple) -> list[tuple[int, str, str]]:
    return [
        (column, str(value).strip(), str(name_row[column]).strip())
        for column, value in enumerate(acronym_row)
        if column >= FIRST_PARTY_COLUMN and value
    ]


def _province_results(row, constituency_id, party_columns):
    return [
        CandidacyResult2023(
            CONGRESO, constituency_id, acronym, row[column], row[column + 1]
        )
        for column, acronym, _ in party_columns
        if row[column]
    ]


def _constituency_result(row, constituency_id, party_columns):
    return ConstituencyResult2023(
        chamber=CONGRESO,
        constituency_id=constituency_id,
        electorate=row[ELECTORATE_COLUMN],
        total_votes=row[TOTAL_VOTES_COLUMN],
        valid_votes=row[VALID_VOTES_COLUMN],
        blank_votes=row[BLANK_VOTES_COLUMN],
        combined_district_name=None,
        parties=_party_results(row, party_columns),
    )


def _party_results(row, party_columns):
    parties = [
        PartyResult2023(acronym, name, row[column], row[column + 1])
        for column, acronym, name in party_columns
        if row[column]
    ]
    return tuple(sorted(parties, key=lambda party: party.votes, reverse=True))
