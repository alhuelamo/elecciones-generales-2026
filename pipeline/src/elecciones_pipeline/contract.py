import json
from collections import Counter
from pathlib import Path

from jsonschema import Draft202012Validator

SCHEMAS_DIR = Path(__file__).parents[3] / "schemas"
CHAMBERS = ("congreso", "senado")


def validate_data_dir(data_dir: Path) -> list[str]:
    errors = _validate_schemas(data_dir)
    if errors:
        return errors
    return _validate_references(data_dir)


def _validate_schemas(data_dir: Path) -> list[str]:
    errors = _validate_file(data_dir, "municipalities.json", "municipalities")
    errors += _validate_file(data_dir, "parties.json", "parties")
    for chamber in CHAMBERS:
        for path in sorted((data_dir / chamber).glob("*.json")):
            errors += _validate_file(data_dir, f"{chamber}/{path.name}", "ballot")
    return errors


def _validate_file(data_dir: Path, relative_path: str, schema_name: str) -> list[str]:
    path = data_dir / relative_path
    if not path.exists():
        return [f"missing file {relative_path}"]
    validator = Draft202012Validator(_load_schema(schema_name))
    document = json.loads(path.read_text())
    return [
        f"{relative_path}: {_location(error)}: {error.message}"
        for error in sorted(validator.iter_errors(document), key=_location)
    ]


def _location(error) -> str:
    return "/".join(str(part) for part in error.absolute_path) or "$"


def _load_schema(schema_name: str) -> dict:
    return json.loads((SCHEMAS_DIR / f"{schema_name}.schema.json").read_text())


def _validate_references(data_dir: Path) -> list[str]:
    index = json.loads((data_dir / "municipalities.json").read_text())
    summaries = {
        chamber: {item["id"]: item for item in index["constituencies"][chamber]}
        for chamber in CHAMBERS
    }
    errors = _validate_municipality_references(index, summaries)
    for chamber in CHAMBERS:
        for constituency_id, summary in summaries[chamber].items():
            errors += _validate_ballot(data_dir, chamber, summary)
    return errors


def _validate_municipality_references(index: dict, summaries: dict) -> list[str]:
    errors = []
    for municipality in index["municipalities"]:
        for chamber in CHAMBERS:
            constituency_id = municipality[chamber]
            if constituency_id not in summaries[chamber]:
                errors.append(
                    f"municipality {municipality['code']} references unknown "
                    f"{chamber} constituency {constituency_id}"
                )
    return errors


def _validate_ballot(data_dir: Path, chamber: str, summary: dict) -> list[str]:
    relative_path = f"{chamber}/{summary['id']}.json"
    path = data_dir / relative_path
    if not path.exists():
        return [f"missing ballot {relative_path}"]
    ballot = json.loads(path.read_text())
    return _ballot_mismatches(relative_path, ballot, summary) + _duplicate_slugs(
        relative_path, ballot
    )


def _ballot_mismatches(relative_path: str, ballot: dict, summary: dict) -> list[str]:
    return [
        f"{relative_path}: {field} {ballot[field]!r} differs from summary "
        f"{summary[field]!r}"
        for field in ("seats", "maxMarks")
        if ballot[field] != summary[field]
    ]


def _duplicate_slugs(relative_path: str, ballot: dict) -> list[str]:
    counts = Counter(candidacy["slug"] for candidacy in ballot["candidacies"])
    return [
        f"{relative_path}: duplicate slug {slug}"
        for slug, count in counts.items()
        if count > 1
    ]
