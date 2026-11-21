import json
from pathlib import Path

import pytest
import yaml
from conftest import PIPELINE_DIR
from test_build import GENERATED_AT, read_json

from elecciones_pipeline.build import BuildError, build_dataset
from elecciones_pipeline.candidacies import (
    CandidacyHeader,
    ParsedCandidacy,
    ParsedCandidate,
)
from elecciones_pipeline.constituencies import load_constituencies
from elecciones_pipeline.corrections import (
    Correction,
    apply_corrections,
    load_corrections,
)

SOURCE = "BOE-A-2026-99999"


@pytest.fixture(scope="module")
def registry():
    return load_constituencies(PIPELINE_DIR / "data")


def candidate(position, name, substitute_names=()):
    return ParsedCandidate(position, name, tuple(substitute_names))


def candidacy(boe_order, acronym, chamber="congreso", candidates=None):
    return ParsedCandidacy(
        province_heading="Barcelona",
        chamber=chamber,
        island_heading=None,
        header=CandidacyHeader(boe_order, acronym.upper(), acronym, False),
        candidates=tuple(
            candidates or [candidate(1, "Ana Gil"), candidate(2, "Bea Roca")]
        ),
        substitutes=(candidate(1, "Cris Sol"),),
    )


def correction(op, boe_order=1, chamber="congreso", **params):
    return Correction(chamber, "08", boe_order, op, SOURCE, params)


@pytest.fixture
def candidacies():
    return [
        candidacy(1, "AAA"),
        candidacy(2, "BBB"),
        candidacy(
            3,
            "CCC",
            chamber="senado",
            candidates=[candidate(1, "Eva Mur", ["Uno", "Dos"])],
        ),
    ]


def test_empty_corrections_are_a_no_op(candidacies, registry):
    assert apply_corrections(candidacies, [], registry) == candidacies


def test_rename_candidate(candidacies, registry):
    fix = correction(
        "rename_candidate", list="candidates", position=2, name="Bea Roca Sanz"
    )

    result = apply_corrections(candidacies, [fix], registry)

    assert [item.name for item in result[0].candidates] == ["Ana Gil", "Bea Roca Sanz"]
    assert result[1:] == candidacies[1:]


def test_rename_substitute(candidacies, registry):
    fix = correction(
        "rename_candidate", list="substitutes", position=1, name="Cris Sola"
    )

    result = apply_corrections(candidacies, [fix], registry)

    assert result[0].substitutes[0].name == "Cris Sola"


def test_rename_senado_substitute_of_candidate(candidacies, registry):
    fix = correction(
        "rename_candidate",
        boe_order=3,
        chamber="senado",
        list="candidates",
        position=1,
        substitute=2,
        name="Tres",
    )

    result = apply_corrections(candidacies, [fix], registry)

    assert result[2].candidates[0].substitute_names == ("Uno", "Tres")


def test_set_candidates_replaces_whole_list(candidacies, registry):
    fix = correction(
        "set_candidates",
        list="candidates",
        candidates=[{"name": "Zoe", "substituteNames": ["Y"]}, {"name": "Ivo"}],
    )

    result = apply_corrections(candidacies, [fix], registry)

    assert result[0].candidates == (candidate(1, "Zoe", ["Y"]), candidate(2, "Ivo"))


def test_set_acronym_and_denomination(candidacies, registry):
    fix = correction("set_acronym", acronym="XX", denomination="EQUIS")

    result = apply_corrections(candidacies, [fix], registry)

    assert (result[0].header.acronym, result[0].header.denomination) == ("XX", "EQUIS")


def test_set_acronym_keeps_denomination_when_omitted(candidacies, registry):
    result = apply_corrections(
        candidacies, [correction("set_acronym", acronym="XX")], registry
    )

    assert result[0].header.denomination == "AAA"


def test_set_boe_order_swaps_resolve_against_original_orders(candidacies, registry):
    fixes = [
        correction("set_boe_order", boe_order=1, newBoeOrder=2),
        correction("set_boe_order", boe_order=2, newBoeOrder=1),
    ]

    result = apply_corrections(candidacies, fixes, registry)

    assert [(item.header.acronym, item.header.boe_order) for item in result[:2]] == [
        ("AAA", 2),
        ("BBB", 1),
    ]


def test_remove_candidacy(candidacies, registry):
    result = apply_corrections(
        candidacies, [correction("remove_candidacy", boe_order=2)], registry
    )

    assert [item.header.acronym for item in result] == ["AAA", "CCC"]


@pytest.mark.parametrize(
    "fix",
    [
        correction("remove_candidacy", boe_order=9),
        correction("remove_candidacy", chamber="senado"),
        Correction("congreso", "28", 1, "remove_candidacy", SOURCE, {}),
        correction("rename_candidate", list="candidates", position=9, name="X"),
        correction(
            "rename_candidate", list="candidates", position=1, substitute=5, name="X"
        ),
        correction("unknown_op"),
    ],
)
def test_invalid_correction_raises(fix, candidacies, registry):
    with pytest.raises(BuildError):
        apply_corrections(candidacies, [fix], registry)


def test_load_empty_file(tmp_path):
    path = tmp_path / "corrections.yaml"
    path.write_text("[]\n", encoding="utf-8")

    assert load_corrections(path) == []


def test_load_reads_fields(tmp_path):
    path = tmp_path / "corrections.yaml"
    path.write_text(
        yaml.safe_dump(
            [
                {
                    "chamber": "congreso",
                    "constituency": "08",
                    "boeOrder": 1,
                    "op": "set_acronym",
                    "source": SOURCE,
                    "acronym": "XX",
                }
            ]
        ),
        encoding="utf-8",
    )

    assert load_corrections(path) == [
        Correction("congreso", "08", 1, "set_acronym", SOURCE, {"acronym": "XX"})
    ]


def test_load_missing_field_raises(tmp_path):
    path = tmp_path / "corrections.yaml"
    path.write_text("- {chamber: congreso}\n", encoding="utf-8")

    with pytest.raises(BuildError):
        load_corrections(path)


def test_build_applies_correction_to_exported_name(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)
    ballot_path = build_inputs.output_dir / "congreso" / "08.json"
    first = read_json(ballot_path)["candidacies"][0]
    fix = {
        "chamber": "congreso",
        "constituency": "08",
        "boeOrder": first["boeOrder"],
        "op": "rename_candidate",
        "source": SOURCE,
        "list": "candidates",
        "position": 1,
        "name": "Nombre Corregido",
    }
    (build_inputs.data_dir / "corrections.yaml").write_text(
        yaml.safe_dump([fix]), encoding="utf-8"
    )

    build_dataset(build_inputs, GENERATED_AT)

    renamed = read_json(ballot_path)["candidacies"][0]["candidates"][0]["name"]
    assert renamed == "Nombre Corregido"


def test_build_fails_on_unknown_correction_target(build_inputs):
    fix = {
        "chamber": "congreso",
        "constituency": "08",
        "boeOrder": 999,
        "op": "remove_candidacy",
        "source": SOURCE,
    }
    (build_inputs.data_dir / "corrections.yaml").write_text(
        yaml.safe_dump([fix]), encoding="utf-8"
    )

    with pytest.raises(BuildError):
        build_dataset(build_inputs, GENERATED_AT)
