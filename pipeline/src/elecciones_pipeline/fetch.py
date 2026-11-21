from dataclasses import dataclass
from pathlib import Path

import httpx
import yaml

USER_AGENT = "elecciones-generales-2026-pipeline"


@dataclass(frozen=True)
class SourceEntry:
    id: str
    url: str
    file: str
    license: str
    manual: bool


def load_sources(sources_yaml: Path) -> list[SourceEntry]:
    entries = yaml.safe_load(sources_yaml.read_text(encoding="utf-8"))
    return [SourceEntry(**entry) for entry in entries]


def fetch_sources(
    sources_yaml: Path, raw_dir: Path, client: httpx.Client
) -> list[Path]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    return [
        _download(client, entry, raw_dir)
        for entry in load_sources(sources_yaml)
        if not entry.manual
    ]


def _download(client: httpx.Client, entry: SourceEntry, raw_dir: Path) -> Path:
    response = client.get(entry.url, follow_redirects=True)
    response.raise_for_status()
    path = raw_dir / entry.file
    path.write_bytes(response.content)
    return path
