import csv
import io
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, replace
from pathlib import Path

from elecciones_pipeline.errors import BuildError

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = (
    "elecciones-2026-build/1.0 "
    "(+https://github.com/alhuelamo/elecciones-generales-2026)"
)
LABELS_FILE = "wikidata_municipality_labels.csv"
HEADER = ["code", "es", "ca", "eu", "gl"]
CODE_PATTERN = re.compile(r"^\d{5}$")
PROVINCE_CODES = tuple(f"{province:02d}" for province in range(1, 53))
MAX_ATTEMPTS = 5
BACKOFF_BASE_SECONDS = 2
PAUSE_BETWEEN_QUERIES_SECONDS = 1
REQUEST_TIMEOUT_SECONDS = 120
RETRYABLE_STATUS_CODES = {429}
PROVINCE_QUERY_TEMPLATE = """SELECT ?code ?es ?ca ?eu ?gl WHERE {{
  ?municipality wdt:P772 ?code .
  FILTER(STRSTARTS(?code, "{province}") && STRLEN(?code) = 5)
  OPTIONAL {{ ?municipality rdfs:label ?es . FILTER(LANG(?es) = "es") }}
  OPTIONAL {{ ?municipality rdfs:label ?ca . FILTER(LANG(?ca) = "ca") }}
  OPTIONAL {{ ?municipality rdfs:label ?eu . FILTER(LANG(?eu) = "eu") }}
  OPTIONAL {{ ?municipality rdfs:label ?gl . FILTER(LANG(?gl) = "gl") }}
}}"""


@dataclass(frozen=True)
class MunicipalityLabels:
    es: str
    ca: str
    eu: str = ""
    gl: str = ""


def build_province_query(province: str) -> str:
    return PROVINCE_QUERY_TEMPLATE.format(province=province)


def build_request(province: str) -> urllib.request.Request:
    query = urllib.parse.quote(build_province_query(province))
    return urllib.request.Request(
        f"{SPARQL_ENDPOINT}?query={query}",
        headers={"Accept": "text/csv", "User-Agent": USER_AGENT},
    )


def send_with_retry(
    request: urllib.request.Request,
    opener: Callable = urllib.request.urlopen,
    sleep: Callable[[float], None] = time.sleep,
) -> str:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with opener(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as error:
            if not _is_retryable_status(error.code) or attempt == MAX_ATTEMPTS:
                raise
            sleep(_retry_delay(error, attempt))
        except (urllib.error.URLError, OSError):
            if attempt == MAX_ATTEMPTS:
                raise
            sleep(_backoff_delay(attempt))
    raise AssertionError("unreachable")


def fetch_province_csv(province: str) -> str:
    return send_with_retry(build_request(province))


def fetch_labels_csv(
    fetch_province: Callable[[str], str] = fetch_province_csv,
    sleep: Callable[[float], None] = time.sleep,
) -> str:
    rows = []
    for index, province in enumerate(PROVINCE_CODES):
        if index:
            sleep(PAUSE_BETWEEN_QUERIES_SECONDS)
        rows.extend(list(csv.reader(io.StringIO(fetch_province(province))))[1:])
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(HEADER)
    writer.writerows(rows)
    return output.getvalue()


def normalize_labels_csv(raw_csv: str) -> str:
    return _render_labels(_parse_rows(raw_csv))


def refresh_labels(
    fetch_csv: Callable[[], str], path: Path, ine_names: dict[str, str]
) -> int:
    labels = _with_ine_fallback(_parse_rows(fetch_csv()), ine_names)
    _validate_labels(labels, ine_names)
    path.write_text(_render_labels(labels), encoding="utf-8")
    return len(labels)


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


def _render_labels(labels: dict[str, MunicipalityLabels]) -> str:
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(HEADER)
    for code in sorted(labels):
        writer.writerow([code, *(getattr(labels[code], key) for key in HEADER[1:])])
    return output.getvalue()


def _with_ine_fallback(
    labels: dict[str, MunicipalityLabels], ine_names: dict[str, str]
) -> dict[str, MunicipalityLabels]:
    return {
        code: replace(label, es=label.es or ine_names.get(code, ""))
        for code, label in labels.items()
    }


def _validate_labels(
    labels: dict[str, MunicipalityLabels], ine_names: dict[str, str]
) -> None:
    missing = sorted(set(ine_names) - set(labels))
    blank = sorted(code for code, label in labels.items() if not label.es)
    if missing:
        raise BuildError(
            f"{len(missing)} INE municipalities missing from Wikidata: "
            f"{', '.join(missing[:20])}"
        )
    if blank:
        raise BuildError(
            f"{len(blank)} municipalities without an es name: {', '.join(blank[:20])}"
        )


def _is_retryable_status(status: int) -> bool:
    return status in RETRYABLE_STATUS_CODES or status >= 500


def _retry_delay(error: urllib.error.HTTPError, attempt: int) -> float:
    retry_after = (error.headers or {}).get("Retry-After", "")
    return float(retry_after) if retry_after.isdigit() else _backoff_delay(attempt)


def _backoff_delay(attempt: int) -> float:
    return BACKOFF_BASE_SECONDS**attempt
