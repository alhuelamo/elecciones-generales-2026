from pathlib import Path

import httpx
import pytest
import yaml

from elecciones_pipeline.fetch import USER_AGENT, fetch_sources

COMMITTED_SOURCES = Path(__file__).parents[1] / "data" / "sources.yaml"

SOURCES = [
    {
        "id": "boe-candidacies",
        "url": "https://example.test/boe.xml",
        "file": "BOE-A-2026-23103.xml",
        "license": "test",
        "manual": False,
    },
    {
        "id": "ine-municipalities",
        "url": "https://example.test/26codmun.xlsx",
        "file": "26codmun.xlsx",
        "license": "test",
        "manual": False,
    },
    {
        "id": "results-2023",
        "url": "https://example.test/results",
        "file": "results_2023/",
        "license": "test",
        "manual": True,
    },
]


def write_sources(tmp_path: Path) -> Path:
    path = tmp_path / "sources.yaml"
    path.write_text(yaml.safe_dump(SOURCES), encoding="utf-8")
    return path


def recording_client(seen: list[httpx.Request], status: int = 200) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(status, content=f"body of {request.url.path}".encode())

    return httpx.Client(
        transport=httpx.MockTransport(handler), headers={"User-Agent": USER_AGENT}
    )


def test_downloads_each_automatic_source(tmp_path):
    raw_dir = tmp_path / "raw"
    paths = fetch_sources(write_sources(tmp_path), raw_dir, recording_client([]))
    assert paths == [raw_dir / "BOE-A-2026-23103.xml", raw_dir / "26codmun.xlsx"]
    assert (raw_dir / "BOE-A-2026-23103.xml").read_bytes() == b"body of /boe.xml"
    assert (raw_dir / "26codmun.xlsx").read_bytes() == b"body of /26codmun.xlsx"


def test_skips_manual_sources(tmp_path):
    seen: list[httpx.Request] = []
    fetch_sources(write_sources(tmp_path), tmp_path / "raw", recording_client(seen))
    assert [str(request.url) for request in seen] == [
        "https://example.test/boe.xml",
        "https://example.test/26codmun.xlsx",
    ]


def test_raises_on_http_error(tmp_path):
    client = recording_client([], status=404)
    with pytest.raises(httpx.HTTPStatusError):
        fetch_sources(write_sources(tmp_path), tmp_path / "raw", client)


def test_sends_pipeline_user_agent(tmp_path):
    seen: list[httpx.Request] = []
    fetch_sources(write_sources(tmp_path), tmp_path / "raw", recording_client(seen))
    assert USER_AGENT == "elecciones-generales-2026-pipeline"
    assert all(request.headers["User-Agent"] == USER_AGENT for request in seen)


def test_committed_sources_list_the_known_datasets():
    entries = {
        entry["id"]: entry
        for entry in yaml.safe_load(COMMITTED_SOURCES.read_text(encoding="utf-8"))
    }
    assert entries["boe-candidacies"]["url"] == (
        "https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-23103"
    )
    assert entries["boe-candidacies"]["file"] == "BOE-A-2026-23103.xml"
    assert entries["ine-municipalities"]["url"] == (
        "https://www.ine.es/daco/daco42/codmun/26codmun.xlsx"
    )
    assert entries["ine-municipalities"]["file"] == "26codmun.xlsx"
    assert entries["results-2023"]["url"] == "https://infoelectoral.interior.gob.es/"
    assert entries["results-2023"]["file"] == "results_2023/"
    assert {entry_id for entry_id, entry in entries.items() if not entry["manual"]} == {
        "boe-candidacies",
        "ine-municipalities",
    }
