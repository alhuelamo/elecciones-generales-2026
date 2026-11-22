from pathlib import Path

import pytest
from openpyxl import Workbook

from elecciones_pipeline.labels import MunicipalityLabels
from elecciones_pipeline.municipalities import (
    display_name,
    localized_names,
    needs_label_fallback,
    read_ine_municipalities,
    search_aliases,
)

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"
HEADERS = ["CPRO", "CMUN", "DC", "NOMBRE"]


@pytest.fixture
def ine_xlsx(tmp_path):
    workbook = Workbook()
    first = workbook.active
    first.title = "07"
    second = workbook.create_sheet("08")
    for sheet in (first, second):
        sheet.append(["Title"])
        sheet.append([])
        sheet.append(HEADERS)
    first.append([7, 40, 1, "Palma de Mallorca"])
    first.append([None, None, None, None])
    second.append(["08", "101", "3", "Hospitalet de Llobregat, L'"])
    second.append(["08", "019", "2", "Barcelona"])
    path = tmp_path / "26codmun.xlsx"
    workbook.save(path)
    return path


def test_reads_zero_padded_codes_from_every_sheet(ine_xlsx):
    codes = [m.code for m in read_ine_municipalities(ine_xlsx)]
    assert codes == ["07040", "08019", "08101"]


def test_reads_official_names(ine_xlsx):
    names = {m.code: m.official_name for m in read_ine_municipalities(ine_xlsx)}
    assert names["08101"] == "Hospitalet de Llobregat, L'"


@pytest.mark.parametrize(
    "official, shown",
    [
        ("Hospitalet de Llobregat, L'", "L'Hospitalet de Llobregat"),
        ("Coruña, A", "A Coruña"),
        ("Rozas de Madrid, Las", "Las Rozas de Madrid"),
        ("Salines, Ses", "Ses Salines"),
        ("Alicante/Alacant", "Alicante/Alacant"),
        ("Barcelona", "Barcelona"),
        ("Eliana, l'", "L'Eliana"),
        ("Palmas de Gran Canaria, Las", "Las Palmas de Gran Canaria"),
        ("Palmas, Las/Pàmies", "Las Palmas/Pàmies"),
    ],
)
def test_display_name(official, shown):
    assert display_name(official) == shown


ALICANTE = MunicipalityLabels("Alicante", "Alacant")
SAN_SEBASTIAN = MunicipalityLabels("San Sebastián", "Sant Sebastià")
NO_LABELS = MunicipalityLabels("", "")


@pytest.mark.parametrize(
    "official, labels, es, ca",
    [
        ("Alicante/Alacant", ALICANTE, "Alicante", "Alacant"),
        ("Coruña, A", NO_LABELS, "A Coruña", "A Coruña"),
        ("Coruña, A", None, "A Coruña", "A Coruña"),
        ("Alicante/Alacant", MunicipalityLabels("Alicante", ""), "Alicante", "Alacant"),
        ("Alicante/Alacant", MunicipalityLabels("", "Alacant"), "Alicante", "Alacant"),
        ("Alicante/Alacant", NO_LABELS, "Alicante", "Alicante"),
        (
            "Coruña, A",
            MunicipalityLabels("La Coruña", "la Corunya"),
            "A Coruña",
            "A Coruña",
        ),
        ("Girona", MunicipalityLabels("Gerona", "Girona"), "Girona", "Girona"),
        ("Lleida", MunicipalityLabels("Lérida", "Lleida"), "Lleida", "Lleida"),
        ("Eivissa", MunicipalityLabels("Ibiza", "Eivissa"), "Eivissa", "Eivissa"),
        (
            "Pamplona/Iruña",
            MunicipalityLabels("Pamplona", "Pamplona"),
            "Pamplona",
            "Pamplona",
        ),
        ("Donostia/San Sebastián", SAN_SEBASTIAN, "San Sebastián", "San Sebastián"),
        ("Elche/Elx", MunicipalityLabels("Elche", "Elx"), "Elche", "Elx"),
        ("Barcelona", MunicipalityLabels("Barcelona", ""), "Barcelona", "Barcelona"),
    ],
)
def test_localized_names(official, labels, es, ca):
    assert localized_names(official, labels) == {"es": es, "ca": ca}


@pytest.mark.parametrize(
    "official, labels, expected",
    [
        (
            "Donostia/San Sebastián",
            MunicipalityLabels(
                "San Sebastián", "Sant Sebastià", "Donostia", "Donostia"
            ),
            {
                "es": "San Sebastián",
                "ca": "San Sebastián",
                "eu": "Donostia",
                "gl": "Donostia",
            },
        ),
        (
            "Donostia/San Sebastián",
            MunicipalityLabels("San Sebastián", "Sant Sebastià"),
            {"es": "San Sebastián", "ca": "San Sebastián"},
        ),
        (
            "Barcelona",
            MunicipalityLabels("Barcelona", "Barcelona", "Bartzelona", "Barcelona"),
            {"es": "Barcelona", "ca": "Barcelona"},
        ),
        (
            "Alicante/Alacant",
            MunicipalityLabels("Alicante", "Alacant", "Alacant", "Alicante"),
            {"es": "Alicante", "ca": "Alacant", "eu": "Alacant"},
        ),
    ],
)
def test_localized_names_are_sparse_for_eu_and_gl(official, labels, expected):
    assert localized_names(official, labels) == expected


def test_needs_label_fallback_only_for_bilingual_names_without_labels():
    assert needs_label_fallback("Alicante/Alacant", NO_LABELS)
    assert needs_label_fallback("Alicante/Alacant", None)
    assert not needs_label_fallback("Alicante/Alacant", ALICANTE)
    assert not needs_label_fallback("Barcelona", None)


def test_wikidata_exonyms_stay_searchable_but_never_shown():
    labels = MunicipalityLabels("La Coruña", "la Corunya")
    names = localized_names("Coruña, A", labels)
    assert names == {"es": "A Coruña", "ca": "A Coruña"}
    assert {"La Coruña", "la Corunya"} <= set(
        search_aliases("Coruña, A", names, labels)
    )


def test_aliases_cover_both_languages_and_official_form():
    names = localized_names("Donostia/San Sebastián", SAN_SEBASTIAN)
    assert search_aliases("Donostia/San Sebastián", names, SAN_SEBASTIAN) == [
        "Donostia/San Sebastián",
        "Donostia",
        "Sant Sebastià",
    ]


def test_eu_only_label_is_searchable():
    labels = MunicipalityLabels("Vitoria", "Vitòria", "Gasteiz", "")
    names = localized_names("Vitoria-Gasteiz", labels)
    assert "Gasteiz" in search_aliases("Vitoria-Gasteiz", names, labels)


def test_aliases_keep_raw_postposed_article_form():
    names = localized_names("Coruña, A", NO_LABELS)
    assert "Coruña, A" in search_aliases("Coruña, A", names)


def test_aliases_are_empty_when_every_form_is_the_shown_name():
    names = localized_names("Barcelona", MunicipalityLabels("Barcelona", "Barcelona"))
    assert search_aliases("Barcelona", names) == []


@pytest.mark.skipif(
    not (RAW / "26codmun.xlsx").exists(), reason="INE file not downloaded"
)
def test_real_ine_file_has_all_provinces():
    municipalities = read_ine_municipalities(RAW / "26codmun.xlsx")
    assert len({m.code[:2] for m in municipalities}) == 52
    assert len(municipalities) > 8100
