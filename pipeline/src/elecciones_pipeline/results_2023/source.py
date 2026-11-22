from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class CandidacyResult2023:
    chamber: str
    constituency_id: str
    acronym: str
    votes: int
    seats: int


@dataclass(frozen=True)
class PartyResult2023:
    acronym: str
    name: str
    votes: int | None
    seats: int


@dataclass(frozen=True)
class ConstituencyResult2023:
    chamber: str
    constituency_id: str
    electorate: int
    total_votes: int
    valid_votes: int
    blank_votes: int
    combined_district_name: str | None
    parties: tuple[PartyResult2023, ...]


@dataclass(frozen=True)
class Results2023:
    candidacies: tuple[CandidacyResult2023, ...]
    valid_votes: dict[tuple[str, str], int]
    constituencies: dict[tuple[str, str], ConstituencyResult2023] = field(
        default_factory=dict
    )


class Results2023Source(Protocol):
    def load(self) -> Results2023: ...
