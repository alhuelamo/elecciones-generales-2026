from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class CandidacyResult2023:
    chamber: str
    constituency_id: str
    acronym: str
    votes: int
    seats: int


@dataclass(frozen=True)
class Results2023:
    candidacies: tuple[CandidacyResult2023, ...]
    valid_votes: dict[tuple[str, str], int]


class Results2023Source(Protocol):
    def load(self) -> Results2023: ...
