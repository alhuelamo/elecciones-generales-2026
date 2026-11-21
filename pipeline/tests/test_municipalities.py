from pathlib import Path

import pytest
from openpyxl import Workbook

from elecciones_pipeline.labels import MunicipalityLabels
from elecciones_pipeline.municipalities import (
    display_name,
    localized_names,
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
        ("Donostia/San Sebastián", SAN_SEBASTIAN, "San Sebastián", "Sant Sebastià"),
        ("Coruña, A", NO_LABELS, "A Coruña", "A Coruña"),
        ("Coruña, A", None, "A Coruña", "A Coruña"),
        ("Alicante/Alacant", MunicipalityLabels("Alicante", ""), "Alicante", "Alacant"),
        ("Alicante/Alacant", MunicipalityLabels("", "Alacant"), "Alicante", "Alacant"),
        ("Alicante/Alacant", NO_LABELS, "Alicante/Alacant", "Alicante/Alacant"),
        ("Elche/Elx", MunicipalityLabels("Elche", "Elx"), "Elche", "Elx"),
        ("Barcelona", MunicipalityLabels("Barcelona", ""), "Barcelona", "Barcelona"),
    ],
)
def test_localized_names(official, labels, es, ca):
    assert localized_names(official, labels) == {"es": es, "ca": ca}


def test_aliases_cover_both_languages_and_official_form():
    names = localized_names("Donostia/San Sebastián", SAN_SEBASTIAN)
    assert search_aliases("Donostia/San Sebastián", names) == [
        "Donostia/San Sebastián",
        "Donostia",
        "San Sebastián",
        "Sant Sebastià",
    ]


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
