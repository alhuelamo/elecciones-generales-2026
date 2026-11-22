import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from elecciones_pipeline.candidacies import (
    BoeXmlSource,
    ParsedCandidacy,
    ParsedCandidate,
    SourceDocument,
    parse_candidacies,
)
from elecciones_pipeline.constituencies import (
    Constituency,
    ConstituencyRegistry,
    UnmappedIslandMunicipality,
    load_constituencies,
)
from elecciones_pipeline.contract import CHAMBERS, validate_data_dir
from elecciones_pipeline.corrections import (
    apply_corrections,
    candidacy_constituency_id,
    load_corrections,
)
from elecciones_pipeline.errors import BuildError
from elecciones_pipeline.labels import LABELS_FILE, MunicipalityLabels, read_labels
from elecciones_pipeline.municipalities import (
    IneMunicipality,
    localized_names,
    needs_label_fallback,
    read_ine_municipalities,
    search_aliases,
)
from elecciones_pipeline.normalize import slugify
from elecciones_pipeline.parties import PartyCatalog, load_logos, load_party_catalog
from elecciones_pipeline.party_colors import load_party_colors
from elecciones_pipeline.results_2023 import (
    CongresoXlsxSource,
    Results2023,
    SenadoXlsxSource,
    load_lineage,
    summarize,
)
from elecciones_pipeline.results_2023.constituency_json import (
    constituency_results_json,
)

BOE_ID = "BOE-A-2026-23103"
INE_FILE = "26codmun.xlsx"
DATASET = "boe-2026"
CORRECTIONS_FILE = "corrections.yaml"
LINEAGE_FILE = "lineage_2023.yaml"
RESULTS_2023_DIR = "results_2023"
CONGRESO_RESULTS_FILE = "PROV_02_202307_1.xlsx"
SENADO_RESULTS_FILE = "PROV_03_202307_1.xlsx"
CONGRESO = "congreso"
SENADO = "senado"


@dataclass(frozen=True)
class BuildPaths:
    data_dir: Path
    raw_dir: Path
    output_dir: Path


@dataclass(frozen=True)
class BuildReport:
    warnings: tuple[str, ...]
    ballot_count: int
    municipality_count: int


@dataclass(frozen=True)
class _Inputs:
    registry: ConstituencyRegistry
    municipalities: list[IneMunicipality]
    labels: dict[str, MunicipalityLabels]
    document: SourceDocument
    candidacies: list[ParsedCandidacy]
    catalog: PartyCatalog
    logos: dict
    lineage: dict[str, list[str]]
    results_2023: Results2023
    party_colors: dict[str, str]


def build_dataset(paths: BuildPaths, generated_at: datetime) -> BuildReport:
    inputs = _load_inputs(paths)
    grouped = _group_candidacies(inputs)
    municipality_entries = _municipality_entries(inputs)
    _validate_coverage(municipality_entries, grouped)
    ballots = _assemble_ballots(inputs, grouped)
    index = _assemble_index(inputs, municipality_entries, grouped, generated_at)
    _write_dataset(paths.output_dir, index, ballots, inputs)
    _validate_output(paths.output_dir)
    return BuildReport(
        warnings=tuple(
            _count_warnings(inputs, grouped)
            + _label_warnings(inputs, municipality_entries)
        ),
        ballot_count=len(ballots),
        municipality_count=len(municipality_entries),
    )


def assign_slugs(acronyms: list[str]) -> list[str]:
    occurrences: dict[str, int] = {}
    slugs: list[str] = []
    for acronym in acronyms:
        base = slugify(acronym)
        occurrences[base] = occurrences.get(base, 0) + 1
        count = occurrences[base]
        slugs.append(base if count == 1 else f"{base}-{count}")
    return slugs


def _load_inputs(paths: BuildPaths) -> _Inputs:
    document = BoeXmlSource(paths.raw_dir / f"{BOE_ID}.xml", BOE_ID).load()
    registry = load_constituencies(paths.data_dir)
    return _Inputs(
        registry=registry,
        municipalities=read_ine_municipalities(paths.raw_dir / INE_FILE),
        labels=read_labels(paths.data_dir / "vendor" / LABELS_FILE),
        document=document,
        candidacies=_corrected_candidacies(paths, registry, document),
        catalog=load_party_catalog(paths.data_dir / "parties.yaml"),
        logos=load_logos(paths.data_dir / "logos.yaml"),
        lineage=_load_lineage(paths.data_dir),
        results_2023=_load_results_2023(paths.raw_dir / RESULTS_2023_DIR, registry),
        party_colors=load_party_colors(paths.data_dir / "party_colors.yaml"),
    )


def _load_lineage(data_dir: Path) -> dict[str, list[str]]:
    path = data_dir / LINEAGE_FILE
    return load_lineage(path) if path.exists() else {}


def _load_results_2023(directory: Path, registry: ConstituencyRegistry) -> Results2023:
    candidacies: tuple = ()
    valid_votes: dict = {}
    constituencies: dict = {}
    sources = []
    if (directory / CONGRESO_RESULTS_FILE).exists():
        sources.append(CongresoXlsxSource(directory / CONGRESO_RESULTS_FILE))
    if (directory / SENADO_RESULTS_FILE).exists():
        seats = {item.id: item.seats for item in registry.senado}
        sources.append(SenadoXlsxSource(directory / SENADO_RESULTS_FILE, seats))
    for source in sources:
        loaded = source.load()
        candidacies += loaded.candidacies
        valid_votes.update(loaded.valid_votes)
        constituencies.update(loaded.constituencies)
    return Results2023(candidacies, valid_votes, constituencies)


def _corrected_candidacies(
    paths: BuildPaths, registry: ConstituencyRegistry, document: SourceDocument
) -> list[ParsedCandidacy]:
    corrections = load_corrections(paths.data_dir / CORRECTIONS_FILE)
    return apply_corrections(parse_candidacies(document), corrections, registry)


def _group_candidacies(inputs: _Inputs) -> dict[tuple[str, str], list]:
    grouped: dict[tuple[str, str], list[ParsedCandidacy]] = {}
    for candidacy in inputs.candidacies:
        key = (candidacy.chamber, candidacy_constituency_id(inputs.registry, candidacy))
        members = grouped.setdefault(key, [])
        if candidacy not in members:
            members.append(candidacy)
    return {
        key: sorted(members, key=lambda member: member.header.boe_order)
        for key, members in sorted(grouped.items())
    }


def _municipality_entries(inputs: _Inputs) -> list[dict]:
    try:
        return [
            _municipality_entry(municipality, inputs)
            for municipality in inputs.municipalities
        ]
    except UnmappedIslandMunicipality as error:
        raise BuildError(f"island municipality without island: {error}") from error


def _municipality_entry(municipality: IneMunicipality, inputs: _Inputs) -> dict:
    registry = inputs.registry
    labels = inputs.labels.get(municipality.code)
    names = localized_names(municipality.official_name, labels)
    return {
        "code": municipality.code,
        "name": names,
        "aliases": search_aliases(municipality.official_name, names, labels),
        CONGRESO: registry.congreso_id_for(municipality.code),
        SENADO: registry.senado_id_for(municipality.code),
    }


def _validate_coverage(entries: list[dict], grouped: dict) -> None:
    for entry in entries:
        for chamber in CHAMBERS:
            if (chamber, entry[chamber]) not in grouped:
                raise BuildError(
                    f"constituency {chamber}/{entry[chamber]} referenced by "
                    f"municipality {entry['code']} has no candidacies"
                )


def _assemble_index(
    inputs: _Inputs, entries: list[dict], grouped: dict, generated_at: datetime
) -> dict:
    return {
        "dataset": DATASET,
        "generatedAt": _format_timestamp(generated_at),
        "constituencies": {
            chamber: [
                _constituency_summary(inputs.registry.get(*key))
                for key in grouped
                if key[0] == chamber
            ]
            for chamber in CHAMBERS
        },
        "municipalities": entries,
    }


def _format_timestamp(moment: datetime) -> str:
    if moment.tzinfo is not None:
        moment = moment.astimezone(timezone.utc)
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def _constituency_summary(constituency: Constituency) -> dict:
    return {
        "id": constituency.id,
        "name": constituency.names,
        "seats": constituency.seats,
        "maxMarks": constituency.max_marks,
    }


def _assemble_ballots(inputs: _Inputs, grouped: dict) -> dict[tuple[str, str], dict]:
    return {
        key: _ballot(inputs, inputs.registry.get(*key), members)
        for key, members in grouped.items()
    }


def _ballot(
    inputs: _Inputs, constituency: Constituency, members: list[ParsedCandidacy]
) -> dict:
    slugs = assign_slugs([_slug_source(member) for member in members])
    return {
        "chamber": constituency.chamber,
        "constituencyId": constituency.id,
        "seats": constituency.seats,
        "maxMarks": constituency.max_marks,
        "sources": [{"label": inputs.document.boe_id, "url": inputs.document.url}],
        "candidacies": [
            _candidacy_json(inputs, constituency, member, slug)
            for member, slug in zip(members, slugs)
        ],
        "constituencyResults2023": constituency_results_json(
            inputs.results_2023.constituencies.get(
                (constituency.chamber, constituency.id)
            ),
            inputs.party_colors,
        ),
    }


def _slug_source(candidacy: ParsedCandidacy) -> str:
    header = candidacy.header
    return header.acronym if slugify(header.acronym) else header.denomination


def _candidacy_json(
    inputs: _Inputs, constituency: Constituency, candidacy: ParsedCandidacy, slug: str
):
    header = candidacy.header
    catalog = inputs.catalog
    is_senado = candidacy.chamber == SENADO
    return {
        "slug": slug,
        "boeOrder": header.boe_order,
        "denomination": header.denomination,
        "acronym": header.acronym,
        "partyKey": catalog.match_candidacy(header.acronym, header.denomination),
        "isCoalition": header.is_coalition,
        "candidates": [_candidate_json(item) for item in candidacy.candidates],
        "substitutes": (
            [] if is_senado else [_candidate_json(i) for i in candidacy.substitutes]
        ),
        "results2023": summarize(
            constituency.chamber,
            constituency.id,
            header.acronym or header.denomination,
            inputs.lineage,
            inputs.results_2023,
        ),
    }


def _candidate_json(candidate: ParsedCandidate) -> dict:
    return {
        "position": candidate.position,
        "name": candidate.name,
        "substituteNames": list(candidate.substitute_names),
    }


def _label_warnings(inputs: _Inputs, entries: list[dict]) -> list[str]:
    bilingual = [
        municipality
        for municipality in inputs.municipalities
        if "/" in municipality.official_name
    ]
    fallbacks = [
        municipality.code
        for municipality in bilingual
        if needs_label_fallback(
            municipality.official_name, inputs.labels.get(municipality.code)
        )
    ]
    slashed = [
        entry["code"]
        for entry in entries
        if any("/" in name for name in entry["name"].values())
    ]
    return [
        f"{len(bilingual)} bilingual INE names: "
        f"{len(bilingual) - len(fallbacks)} resolved via Wikidata labels, "
        f"{len(fallbacks)} fell back to first part: {fallbacks}",
        f"{len(slashed)} municipality names still contain '/': {slashed}",
    ]


def _count_warnings(inputs: _Inputs, grouped: dict) -> list[str]:
    warnings = []
    for (chamber, constituency_id), members in grouped.items():
        seats = inputs.registry.get(chamber, constituency_id).seats
        for member in members:
            warning = _count_warning(chamber, constituency_id, seats, member)
            if warning:
                warnings.append(warning)
    return warnings


def _count_warning(chamber, constituency_id, seats, member) -> str | None:
    count = len(member.candidates)
    label = f"{chamber}/{constituency_id}: {member.header.acronym or member.header.denomination}"
    if chamber == CONGRESO and count != seats:
        return f"{label} has {count} candidates for {seats} seats"
    if chamber == SENADO and count > seats:
        return f"{label} has {count} candidates for {seats} seats"
    return None


def _write_dataset(output_dir: Path, index: dict, ballots: dict, inputs) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for chamber in CHAMBERS:
        shutil.rmtree(output_dir / chamber, ignore_errors=True)
        (output_dir / chamber).mkdir()
    _write_json(output_dir / "municipalities.json", index)
    _write_json(output_dir / "parties.json", inputs.catalog.to_json(inputs.logos))
    for (chamber, constituency_id), ballot in ballots.items():
        _write_json(output_dir / chamber / f"{constituency_id}.json", ballot)


def _write_json(path: Path, document: dict) -> None:
    path.write_text(
        json.dumps(document, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def _validate_output(output_dir: Path) -> None:
    errors = validate_data_dir(output_dir)
    if errors:
        raise BuildError("invalid dataset: " + "; ".join(errors))
