from dataclasses import dataclass, replace
from pathlib import Path

import yaml

from elecciones_pipeline.candidacies import ParsedCandidacy, ParsedCandidate
from elecciones_pipeline.constituencies import (
    ConstituencyRegistry,
    UnknownIslandHeading,
    UnknownProvinceName,
)
from elecciones_pipeline.errors import BuildError

SENADO = "senado"
CANDIDATE_LISTS = ("candidates", "substitutes")


@dataclass(frozen=True)
class Correction:
    chamber: str
    constituency: str
    boe_order: int
    op: str
    source: str
    params: dict


def load_corrections(path: Path) -> list[Correction]:
    entries = yaml.safe_load(path.read_text(encoding="utf-8")) or []
    return [_parse_correction(entry) for entry in entries]


def candidacy_constituency_id(
    registry: ConstituencyRegistry, candidacy: ParsedCandidacy
) -> str:
    try:
        province_code = registry.province_code_for_name(candidacy.province_heading)
        if candidacy.chamber == SENADO and candidacy.island_heading:
            return registry.senado_id_for_island_heading(
                province_code, candidacy.island_heading
            )
    except (UnknownProvinceName, UnknownIslandHeading) as error:
        raise BuildError(f"unknown heading: {error}") from error
    return province_code


def apply_corrections(
    candidacies: list[ParsedCandidacy],
    corrections: list[Correction],
    registry: ConstituencyRegistry,
) -> list[ParsedCandidacy]:
    result = list(candidacies)
    targets = [
        (_find_target(candidacies, correction, registry), correction)
        for correction in corrections
    ]
    for target, correction in targets:
        current = result[target]
        result[target] = (
            None if correction.op == "remove_candidacy" else _apply(correction, current)
        )
    return [candidacy for candidacy in result if candidacy is not None]


def _parse_correction(entry: dict) -> Correction:
    reserved = {"chamber", "constituency", "boeOrder", "op", "source"}
    try:
        return Correction(
            chamber=entry["chamber"],
            constituency=str(entry["constituency"]),
            boe_order=entry["boeOrder"],
            op=entry["op"],
            source=entry["source"],
            params={key: value for key, value in entry.items() if key not in reserved},
        )
    except KeyError as error:
        raise BuildError(f"correction missing field {error}: {entry}") from error


def _find_target(
    candidacies: list[ParsedCandidacy],
    correction: Correction,
    registry: ConstituencyRegistry,
) -> int:
    for index, candidacy in enumerate(candidacies):
        if (
            candidacy.chamber == correction.chamber
            and candidacy.header.boe_order == correction.boe_order
            and candidacy_constituency_id(registry, candidacy)
            == correction.constituency
        ):
            return index
    raise BuildError(
        f"correction {correction.source} targets missing candidacy "
        f"{correction.chamber}/{correction.constituency}#{correction.boe_order}"
    )


def _apply(correction: Correction, candidacy: ParsedCandidacy) -> ParsedCandidacy:
    handlers = {
        "rename_candidate": _rename_candidate,
        "set_candidates": _set_candidates,
        "set_acronym": _set_acronym,
        "set_boe_order": _set_boe_order,
    }
    if correction.op not in handlers:
        raise BuildError(f"unknown correction op {correction.op!r}")
    return handlers[correction.op](candidacy, correction.params)


def _rename_candidate(candidacy: ParsedCandidacy, params: dict) -> ParsedCandidacy:
    list_name = _list_name(params)
    renamed = tuple(
        (
            _renamed(candidate, params)
            if candidate.position == params["position"]
            else candidate
        )
        for candidate in getattr(candidacy, list_name)
    )
    if renamed == getattr(candidacy, list_name):
        raise BuildError(f"no {list_name} at position {params['position']}")
    return replace(candidacy, **{list_name: renamed})


def _renamed(candidate: ParsedCandidate, params: dict) -> ParsedCandidate:
    substitute = params.get("substitute")
    if substitute is None:
        return replace(candidate, name=params["name"])
    names = list(candidate.substitute_names)
    if not 1 <= substitute <= len(names):
        raise BuildError(
            f"no substitute {substitute} for position {candidate.position}"
        )
    names[substitute - 1] = params["name"]
    return replace(candidate, substitute_names=tuple(names))


def _set_candidates(candidacy: ParsedCandidacy, params: dict) -> ParsedCandidacy:
    candidates = tuple(
        ParsedCandidate(
            position=position,
            name=entry["name"],
            substitute_names=tuple(entry.get("substituteNames", ())),
        )
        for position, entry in enumerate(params["candidates"], start=1)
    )
    return replace(candidacy, **{_list_name(params): candidates})


def _set_acronym(candidacy: ParsedCandidacy, params: dict) -> ParsedCandidacy:
    header = replace(
        candidacy.header,
        acronym=params["acronym"],
        denomination=params.get("denomination", candidacy.header.denomination),
    )
    return replace(candidacy, header=header)


def _set_boe_order(candidacy: ParsedCandidacy, params: dict) -> ParsedCandidacy:
    return replace(
        candidacy, header=replace(candidacy.header, boe_order=params["newBoeOrder"])
    )


def _list_name(params: dict) -> str:
    list_name = params["list"]
    if list_name not in CANDIDATE_LISTS:
        raise BuildError(f"unknown candidate list {list_name!r}")
    return list_name
