import csv
import io
import re
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "elecciones-generales-2026-pipeline"
LABELS_FILE = "wikidata_municipality_labels.csv"
HEADER = ["code", "es", "ca", "eu", "gl"]
CODE_PATTERN = re.compile(r"^\d{5}$")
SPARQL_QUERY = """SELECT ?code ?es ?ca ?eu ?gl WHERE {
  ?municipality wdt:P31/wdt:P279* wd:Q2074737 ;
                wdt:P772 ?code .
  OPTIONAL { ?municipality rdfs:label ?es . FILTER(LANG(?es) = "es") }
  OPTIONAL { ?municipality rdfs:label ?ca . FILTER(LANG(?ca) = "ca") }
  OPTIONAL { ?municipality rdfs:label ?eu . FILTER(LANG(?eu) = "eu") }
  OPTIONAL { ?municipality rdfs:label ?gl . FILTER(LANG(?gl) = "gl") }
}"""


@dataclass(frozen=True)
class MunicipalityLabels:
    es: str
    ca: str
    eu: str = ""
    gl: str = ""


def build_request() -> urllib.request.Request:
    query = urllib.parse.quote(SPARQL_QUERY)
    return urllib.request.Request(
        f"{SPARQL_ENDPOINT}?query={query}",
        headers={"Accept": "text/csv", "User-Agent": USER_AGENT},
    )


def fetch_labels_csv() -> str:
    with urllib.request.urlopen(build_request(), timeout=120) as response:
        return response.read().decode("utf-8")


def normalize_labels_csv(raw_csv: str) -> str:
    labels = _parse_rows(raw_csv)
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(HEADER)
    for code in sorted(labels):
        writer.writerow([code, *(getattr(labels[code], key) for key in HEADER[1:])])
    return output.getvalue()


def refresh_labels(fetch_csv: Callable[[], str], path: Path) -> int:
    normalized = normalize_labels_csv(fetch_csv())
    path.write_text(normalized, encoding="utf-8")
    return len(normalized.splitlines()) - 1


def read_labels(path: Path) -> dict[str, MunicipalityLabels]:
    return _parse_rows(path.read_text(encoding="utf-8"))


def _parse_rows(raw_csv: str) -> dict[str, MunicipalityLabels]:
    labels: dict[str, MunicipalityLabels] = {}
    for row in csv.DictReader(io.StringIO(raw_csv)):
        code = row["code"].strip()
        if CODE_PATTERN.match(code) and code not in labels:
            labels[code] = MunicipalityLabels(
                es=_capitalize(row["es"]),
                ca=_capitalize(row["ca"]),
                eu=_capitalize(row.get("eu") or ""),
                gl=_capitalize(row.get("gl") or ""),
            )
    return labels


def _capitalize(label: str) -> str:
    stripped = label.strip()
    return stripped[:1].upper() + stripped[1:]
