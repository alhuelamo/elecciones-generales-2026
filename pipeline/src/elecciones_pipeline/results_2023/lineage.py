from pathlib import Path

import yaml

from elecciones_pipeline.normalize import slugify
from elecciones_pipeline.results_2023.source import Results2023

SENADO = "senado"


def load_lineage(path: Path) -> dict[str, list[str]]:
    entries = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return {slugify(key): list(value) for key, value in entries.items()}


def predecessor_acronyms(
    acronym_2026: str, lineage: dict[str, list[str]]
) -> list[str] | None:
    return lineage.get(slugify(acronym_2026))


def summarize(
    chamber: str,
    constituency_id: str,
    acronym_2026: str,
    lineage: dict[str, list[str]],
    results: Results2023,
) -> dict | None:
    predecessors = predecessor_acronyms(acronym_2026, lineage)
    names = [acronym_2026] if predecessors is None else predecessors
    wanted = {slugify(name) for name in names}
    matches = [
        item
        for item in results.candidacies
        if item.chamber == chamber
        and item.constituency_id == constituency_id
        and slugify(item.acronym) in wanted
    ]
    if not matches:
        return None
    return {
        "votes": _votes(chamber, matches),
        "percentage": _percentage(chamber, constituency_id, matches, results),
        "seats": sum(item.seats for item in matches),
        "asAcronyms": [item.acronym for item in matches],
    }


def _votes(chamber: str, matches: list) -> int:
    votes = [item.votes for item in matches]
    return max(votes) if chamber == SENADO else sum(votes)


def _percentage(chamber, constituency_id, matches, results) -> float | None:
    if chamber == SENADO:
        return None
    valid = results.valid_votes[(chamber, constituency_id)]
    return round(sum(item.votes for item in matches) / valid * 100, 2)
