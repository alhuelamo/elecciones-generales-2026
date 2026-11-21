import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

import pytest
import yaml
from conftest import FIXTURES, INE_ROWS, write_ine_workbook

from elecciones_pipeline.build import (
    BOE_ID,
    INE_FILE,
    BuildError,
    assign_slugs,
    build_dataset,
)
from elecciones_pipeline.contract import validate_data_dir

GENERATED_AT = datetime(2026, 11, 23, 10, 0, tzinfo=timezone.utc)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def municipality(paths, code: str) -> dict:
    index = read_json(paths.output_dir / "municipalities.json")
    return next(item for item in index["municipalities"] if item["code"] == code)


def test_build_writes_contract_valid_dataset(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    assert validate_data_dir(build_inputs.output_dir) == []


def test_palma_points_to_mallorca_ballot(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    assert municipality(build_inputs, "07040")["senado"] == "07-mallorca"
    ballot = read_json(build_inputs.output_dir / "senado" / "07-mallorca.json")
    assert ballot["maxMarks"] == 2


def test_formentera_has_its_own_senado_ballot(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    assert municipality(build_inputs, "07024")["senado"] == "07-formentera"
    ballot = read_json(build_inputs.output_dir / "senado" / "07-formentera.json")
    assert (ballot["seats"], ballot["maxMarks"]) == (1, 1)


def test_hospitalet_display_name_and_alias(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    entry = municipality(build_inputs, "08101")
    assert entry["name"] == "L'Hospitalet de Llobregat"
    assert entry["aliases"] == ["Hospitalet de Llobregat, L'"]


def test_assign_slugs_disambiguates():
    assert assign_slugs(["PP", "P.P.", "PSOE"]) == ["pp", "pp-2", "psoe"]


def test_party_key_matched_from_catalog(build_inputs):
    shutil.copy(FIXTURES / "parties.yaml", build_inputs.data_dir / "parties.yaml")
    add_alias(build_inputs.data_dir / "parties.yaml", "psoe", "PSC")

    build_dataset(build_inputs, GENERATED_AT)

    ballot = read_json(build_inputs.output_dir / "congreso" / "08.json")
    keys = {item["acronym"]: item["partyKey"] for item in ballot["candidacies"]}
    assert keys["PSC"] == "psoe"


def test_referenced_constituency_without_candidacies_raises(build_inputs):
    rows = {**INE_ROWS, "28": [("28", "079", "Madrid")]}
    write_ine_workbook(build_inputs.raw_dir / INE_FILE, rows)

    with pytest.raises(BuildError, match="congreso/28"):
        build_dataset(build_inputs, GENERATED_AT)


def test_congreso_candidate_count_mismatch_warns(build_inputs):
    baseline = build_dataset(build_inputs, GENERATED_AT)
    assert not any("congreso/08" in warning for warning in baseline.warnings)
    drop_first_barcelona_titular(build_inputs.raw_dir / f"{BOE_ID}.xml")

    report = build_dataset(build_inputs, GENERATED_AT)

    assert any("congreso/08" in warning for warning in report.warnings)


def test_stale_ballot_files_removed(build_inputs):
    stale = build_inputs.output_dir / "senado" / "99.json"
    stale.parent.mkdir(parents=True)
    stale.write_text("{}")

    build_dataset(build_inputs, GENERATED_AT)

    assert not stale.exists()


def test_records_dataset_and_generated_at(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    index = read_json(build_inputs.output_dir / "municipalities.json")
    assert index["dataset"] == "boe-2026"
    assert index["generatedAt"] == "2026-11-23T10:00:00Z"


def test_ballot_sources_link_boe(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    ballot = read_json(build_inputs.output_dir / "congreso" / "08.json")
    assert ballot["sources"] == [
        {
            "label": "BOE-A-2026-23103",
            "url": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103",
        }
    ]


def test_candidacy_slugs_are_unique_per_ballot(build_inputs):
    build_dataset(build_inputs, GENERATED_AT)

    for path in build_inputs.output_dir.glob("*/*.json"):
        slugs = [item["slug"] for item in read_json(path)["candidacies"]]
        assert len(slugs) == len(set(slugs)), path


def drop_first_barcelona_titular(xml_path: Path) -> None:
    lines = xml_path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = next(
        i for i, line in enumerate(lines) if "JUNTA ELECTORAL DE BARCELONA" in line
    )
    pattern = re.compile(r'<p class="parrafo(_2)?">1\.\s')
    target = next(i for i in range(start, len(lines)) if pattern.search(lines[i]))
    del lines[target]
    xml_path.write_text("".join(lines), encoding="utf-8")


def add_alias(parties_yaml: Path, party_key: str, alias: str) -> None:
    parties = yaml.safe_load(parties_yaml.read_text(encoding="utf-8"))
    parties[party_key]["aliases"].append(alias)
    parties_yaml.write_text(yaml.safe_dump(parties, allow_unicode=True))
