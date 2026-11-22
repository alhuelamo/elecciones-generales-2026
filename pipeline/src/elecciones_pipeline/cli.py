import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

from elecciones_pipeline.build import INE_FILE, BuildError, BuildPaths, build_dataset
from elecciones_pipeline.fetch import USER_AGENT, fetch_sources
from elecciones_pipeline.labels import LABELS_FILE, fetch_labels_csv, refresh_labels
from elecciones_pipeline.municipalities import display_name, read_ine_municipalities

PIPELINE_DIR = Path(__file__).parents[2]
DATA_DIR = PIPELINE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
VENDOR_DIR = DATA_DIR / "vendor"
DEFAULT_OUTPUT_DIR = PIPELINE_DIR.parent / "web" / "public" / "data"


def main(argv: list[str] | None = None) -> int:
    arguments = _build_parser().parse_args(argv)
    if arguments.command == "fetch":
        return _fetch()
    if arguments.command == "refresh-labels":
        return _refresh_labels()
    if arguments.command == "build":
        return _build(Path(arguments.output))
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="elecciones")
    commands = parser.add_subparsers(dest="command")
    commands.add_parser("fetch")
    commands.add_parser("refresh-labels")
    build = commands.add_parser("build")
    build.add_argument("--output", default=str(DEFAULT_OUTPUT_DIR))
    return parser


def _fetch() -> int:
    with httpx.Client(headers={"User-Agent": USER_AGENT}) as client:
        for path in fetch_sources(DATA_DIR / "sources.yaml", RAW_DIR, client):
            print(f"fetched {path}")
    return 0


def _refresh_labels() -> int:
    ine_names = {
        municipality.code: display_name(municipality.official_name)
        for municipality in read_ine_municipalities(RAW_DIR / INE_FILE)
    }
    try:
        count = refresh_labels(fetch_labels_csv, VENDOR_DIR / LABELS_FILE, ine_names)
    except BuildError as error:
        print(f"refresh-labels failed: {error}", file=sys.stderr)
        return 1
    print(f"{count} municipality labels -> {VENDOR_DIR / LABELS_FILE}")
    return 0


def _build(output_dir: Path) -> int:
    paths = BuildPaths(DATA_DIR, RAW_DIR, output_dir)
    try:
        report = build_dataset(paths, datetime.now(timezone.utc))
    except BuildError as error:
        print(f"build failed: {error}", file=sys.stderr)
        return 1
    for warning in report.warnings:
        print(f"warning: {warning}")
    print(
        f"{report.ballot_count} ballots, "
        f"{report.municipality_count} municipalities -> {output_dir}"
    )
    return 0
