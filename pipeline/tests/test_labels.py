from elecciones_pipeline.labels import (
    SPARQL_ENDPOINT,
    SPARQL_QUERY,
    USER_AGENT,
    MunicipalityLabels,
    build_request,
    normalize_labels_csv,
    read_labels,
    refresh_labels,
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
    request = build_request()
    assert request.full_url.startswith(SPARQL_ENDPOINT)
    assert request.get_header("User-agent") == USER_AGENT


def test_refresh_writes_normalized_csv(tmp_path):
    path = tmp_path / "labels.csv"
    count = refresh_labels(lambda: RAW_CSV, path)
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
    assert "?eu ?gl" in SPARQL_QUERY
    assert 'LANG(?eu) = "eu"' in SPARQL_QUERY
    assert 'LANG(?gl) = "gl"' in SPARQL_QUERY
