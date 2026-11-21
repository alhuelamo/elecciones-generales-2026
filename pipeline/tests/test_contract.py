import json
import shutil
from pathlib import Path

from elecciones_pipeline.contract import validate_data_dir

WEB_DATA = Path(__file__).parents[2] / "web" / "public" / "data"


def copy_tree(source: Path, destination: Path) -> None:
    shutil.copytree(source, destination, dirs_exist_ok=True)


def read_json(path: Path):
    return json.loads(path.read_text())


def write_json(path: Path, content) -> None:
    path.write_text(json.dumps(content))


def test_committed_web_data_is_valid():
    assert validate_data_dir(WEB_DATA) == []


def test_schema_violation_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    index = read_json(tmp_path / "municipalities.json")
    del index["municipalities"][0]["senado"]
    write_json(tmp_path / "municipalities.json", index)

    assert any("senado" in error for error in validate_data_dir(tmp_path))


def test_missing_ballot_file_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    (tmp_path / "senado" / "07-mallorca.json").unlink()

    assert validate_data_dir(tmp_path) == ["missing ballot senado/07-mallorca.json"]


def test_duplicate_slug_in_ballot_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    ballot_path = tmp_path / "congreso" / "08.json"
    ballot = read_json(ballot_path)
    ballot["candidacies"][1]["slug"] = ballot["candidacies"][0]["slug"]
    write_json(ballot_path, ballot)

    assert any("duplicate slug" in error for error in validate_data_dir(tmp_path))


def test_seats_mismatch_with_summary_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    ballot_path = tmp_path / "senado" / "07-mallorca.json"
    ballot = read_json(ballot_path)
    ballot["seats"] = 4
    write_json(ballot_path, ballot)

    assert any("seats" in error for error in validate_data_dir(tmp_path))


def test_unknown_constituency_reference_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    index = read_json(tmp_path / "municipalities.json")
    index["municipalities"][0]["congreso"] = "99"
    write_json(tmp_path / "municipalities.json", index)

    assert any("99" in error for error in validate_data_dir(tmp_path))
