from pathlib import Path

import pytest
from openpyxl import Workbook

from elecciones_pipeline.municipalities import (
    display_name,
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


@pytest.mark.parametrize(
    "official, aliases",
    [
        ("Alicante/Alacant", ["Alicante", "Alacant"]),
        ("Donostia/San Sebastián", ["Donostia", "San Sebastián"]),
        ("Coruña, A", ["Coruña, A"]),
        ("Barcelona", []),
    ],
)
def test_search_aliases(official, aliases):
    assert search_aliases(official) == aliases


@pytest.mark.skipif(
    not (RAW / "26codmun.xlsx").exists(), reason="INE file not downloaded"
)
def test_real_ine_file_has_all_provinces():
    municipalities = read_ine_municipalities(RAW / "26codmun.xlsx")
    assert len({m.code[:2] for m in municipalities}) == 52
    assert len(municipalities) > 8100
