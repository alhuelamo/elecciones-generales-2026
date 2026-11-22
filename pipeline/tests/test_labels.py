import io
import urllib.error
import urllib.request

import pytest

from elecciones_pipeline.errors import BuildError
from elecciones_pipeline.labels import (
    MAX_ATTEMPTS,
    PROVINCE_CODES,
    SPARQL_ENDPOINT,
    USER_AGENT,
    MunicipalityLabels,
    build_province_query,
    build_request,
    fetch_labels_csv,
    normalize_labels_csv,
    read_labels,
    refresh_labels,
    send_with_retry,
)

RAW_CSV = (
    "code,es,ca\r\n"
    "20069,San Sebastián,Sant Sebastià\r\n"
    "03014,Alicante,Alacant\r\n"
    "03014,Alicante,Alacant\r\n"
    "15030,La Coruña,la Corunya\r\n"
    "0301,Bad,Bad\r\n"
    "08019,Barcelona,\r\n"
)


def test_normalize_sorts_dedupes_and_drops_invalid_codes():
    lines = normalize_labels_csv(RAW_CSV).splitlines()
    assert [line.split(",")[0] for line in lines] == [
        "code",
        "03014",
        "08019",
        "15030",
        "20069",
    ]


def test_read_labels_capitalizes_and_keeps_missing_empty(tmp_path):
    path = tmp_path / "labels.csv"
    path.write_text(normalize_labels_csv(RAW_CSV), encoding="utf-8")
    labels = read_labels(path)
    assert labels["15030"] == MunicipalityLabels("La Coruña", "La Corunya")
    assert labels["08019"] == MunicipalityLabels("Barcelona", "")


def test_request_targets_wikidata_with_user_agent():
    request = build_request("04")
    assert request.full_url.startswith(SPARQL_ENDPOINT)
    assert request.get_header("User-agent") == USER_AGENT


INE_NAMES = {
    "03014": "Alicante",
    "08019": "Barcelona",
    "15030": "Coruña, A",
    "20069": "Donostia",
}


def test_refresh_writes_normalized_csv(tmp_path):
    path = tmp_path / "labels.csv"
    count = refresh_labels(lambda: RAW_CSV, path, INE_NAMES)
    assert count == 4
    assert "03014,Alicante,Alacant" in path.read_text()


def test_normalize_writes_five_columns():
    raw = "code,es,ca,eu,gl\n20069,San Sebastián,Sant Sebastià,Donostia,Donostia\n"
    assert normalize_labels_csv(raw).splitlines() == [
        "code,es,ca,eu,gl",
        "20069,San Sebastián,Sant Sebastià,Donostia,Donostia",
    ]


def test_read_labels_without_eu_gl_columns_defaults_to_empty(tmp_path):
    path = tmp_path / "labels.csv"
    path.write_text("code,es,ca\n03014,Alicante,Alacant\n", encoding="utf-8")
    labels = read_labels(path)["03014"]
    assert (labels.eu, labels.gl) == ("", "")


def test_read_labels_reads_eu_gl_columns(tmp_path):
    path = tmp_path / "labels.csv"
    path.write_text(
        "code,es,ca,eu,gl\n20069,San Sebastián,Sant Sebastià,donostia,Donostia\n",
        encoding="utf-8",
    )
    assert read_labels(path)["20069"] == MunicipalityLabels(
        "San Sebastián", "Sant Sebastià", "Donostia", "Donostia"
    )


def test_query_requests_eu_and_gl_labels():
    query = build_province_query("04")
    assert "?eu ?gl" in query
    assert 'LANG(?eu) = "eu"' in query
    assert 'LANG(?gl) = "gl"' in query


def test_query_filters_by_province_prefix():
    query = build_province_query("04")
    assert 'STRSTARTS(?code, "04")' in query
    assert "STRLEN(?code) = 5" in query


def test_query_does_not_depend_on_instance_type_so_ceuta_is_included():
    assert "P31" not in build_province_query("51")


def test_user_agent_is_descriptive_and_generic():
    assert USER_AGENT == (
        "elecciones-2026-build/1.0 "
        "(+https://github.com/alhuelamo/elecciones-generales-2026)"
    )


def test_province_codes_cover_all_fifty_two_provinces():
    assert PROVINCE_CODES[0] == "01"
    assert PROVINCE_CODES[-1] == "52"
    assert len(PROVINCE_CODES) == 52


def test_refresh_fills_blank_es_from_ine_name(tmp_path):
    path = tmp_path / "labels.csv"
    raw = "code,es,ca\n04057,,Laujar d'Andarax\n"
    refresh_labels(lambda: raw, path, {"04057": "Laujar de Andarax"})
    assert read_labels(path)["04057"].es == "Laujar de Andarax"


def test_refresh_rejects_missing_codes_without_touching_file(tmp_path):
    path = tmp_path / "labels.csv"
    path.write_text("previous", encoding="utf-8")
    with pytest.raises(BuildError, match="08019"):
        refresh_labels(lambda: "code,es,ca\n03014,Alicante,Alacant\n", path, INE_NAMES)
    assert path.read_text() == "previous"


def test_refresh_rejects_blank_es_without_ine_fallback(tmp_path):
    path = tmp_path / "labels.csv"
    path.write_text("previous", encoding="utf-8")
    raw = "code,es,ca\n03014,,Alacant\n"
    with pytest.raises(BuildError, match="03014"):
        refresh_labels(lambda: raw, path, {"03014": ""})
    assert path.read_text() == "previous"


def test_fetch_merges_every_province_with_a_single_header():
    requested = []

    def fetch_province(province):
        requested.append(province)
        return f"code,es,ca,eu,gl\r\n{province}001,Name {province},,,\r\n"

    pauses = []
    merged = fetch_labels_csv(fetch_province, pauses.append)
    assert requested == list(PROVINCE_CODES)
    assert merged.count("code,es,ca,eu,gl") == 1
    assert "01001,Name 01" in merged and "52001,Name 52" in merged
    assert len(pauses) == len(PROVINCE_CODES) - 1


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False


def http_error(status, retry_after=None):
    headers = {"Retry-After": retry_after} if retry_after else {}
    return urllib.error.HTTPError("url", status, "err", headers, None)


def scripted_opener(outcomes):
    remaining = list(outcomes)

    def opener(request, timeout):
        outcome = remaining.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return FakeResponse(outcome.encode("utf-8"))

    return opener


def test_send_returns_body_on_first_success():
    request = build_request("04")
    assert send_with_retry(request, scripted_opener(["ok"]), lambda _: None) == "ok"


def test_send_retries_server_errors_with_exponential_backoff():
    delays = []
    opener = scripted_opener([http_error(504), http_error(503), TimeoutError(), "ok"])
    assert send_with_retry(build_request("04"), opener, delays.append) == "ok"
    assert delays == [2, 4, 8]


def test_send_honours_retry_after_header():
    delays = []
    opener = scripted_opener([http_error(429, "30"), "ok"])
    send_with_retry(build_request("04"), opener, delays.append)
    assert delays == [30]


def test_send_retries_connection_errors():
    opener = scripted_opener([urllib.error.URLError("down"), "ok"])
    assert send_with_retry(build_request("04"), opener, lambda _: None) == "ok"


def test_send_does_not_retry_client_errors():
    opener = scripted_opener([http_error(400), "ok"])
    with pytest.raises(urllib.error.HTTPError):
        send_with_retry(build_request("04"), opener, lambda _: None)


def test_send_gives_up_after_max_attempts():
    delays = []
    opener = scripted_opener([http_error(504)] * MAX_ATTEMPTS)
    with pytest.raises(urllib.error.HTTPError):
        send_with_retry(build_request("04"), opener, delays.append)
    assert len(delays) == MAX_ATTEMPTS - 1
