import csv
from collections import Counter
from pathlib import Path

import pytest

from elecciones_pipeline.constituencies import (
    UnknownIslandHeading,
    UnknownProvinceName,
    UnmappedIslandMunicipality,
    load_constituencies,
    senado_max_marks,
)

DATA_DIR = Path(__file__).parent.parent / "data"
VENDOR_CSV = DATA_DIR / "vendor" / "municipios_islas.csv"


def vendor_rows():
    with VENDOR_CSV.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def all_vendor_codes():
    return [row["municipio_id"] for row in vendor_rows()]


def code_of(name):
    row = next(row for row in vendor_rows() if row["nombre"] == name)
    return row["provincia_id"] + row["cmun"]


@pytest.fixture
def registry():
    return load_constituencies(DATA_DIR)


def test_congreso_has_52_constituencies_ordered_by_id(registry):
    ids = [c.id for c in registry.congreso]
    assert (len(ids), ids == sorted(ids)) == (52, True)


def test_congreso_seats_sum_to_350(registry):
    assert sum(c.seats for c in registry.congreso) == 350


def test_ceuta_and_melilla_elect_one_deputy(registry):
    assert [registry.get("congreso", p).seats for p in ("51", "52")] == [1, 1]


def test_madrid_and_balears_congreso_seats(registry):
    assert [registry.get("congreso", p).seats for p in ("28", "07")] == [38, 8]


def test_senado_has_209_seats_in_60_constituencies(registry):
    assert (len(registry.senado), sum(c.seats for c in registry.senado)) == (60, 209)


def test_senado_is_ordered_by_id(registry):
    ids = [c.id for c in registry.senado]
    assert ids == sorted(ids)


def test_island_provinces_have_no_province_level_senado(registry):
    ids = {c.id for c in registry.senado}
    assert not ids & {"07", "35", "38"}


@pytest.mark.parametrize("seats, marks", [(4, 3), (3, 2), (2, 1), (1, 1)])
def test_senado_max_marks(seats, marks):
    assert senado_max_marks(seats) == marks


def test_mallorca_max_marks_is_two(registry):
    assert registry.get("senado", "07-mallorca").max_marks == 2


def test_congreso_has_no_max_marks(registry):
    assert registry.get("congreso", "08").max_marks is None


@pytest.mark.parametrize("province", ["51", "52"])
def test_autonomous_cities_elect_two_senators(registry, province):
    assert registry.get("senado", province).seats == 2


@pytest.mark.parametrize(
    "name, island",
    [
        ("Palma", "07-mallorca"),
        ("Formentera", "07-formentera"),
        ("Eivissa", "07-eivissa"),
        ("Ciutadella de Menorca", "07-menorca"),
        ("Teguise", "35-lanzarote"),
        ("Valverde", "38-el-hierro"),
        ("San Sebastián de la Gomera", "38-la-gomera"),
    ],
)
def test_island_municipalities(registry, name, island):
    assert registry.senado_id_for(code_of(name)) == island


def test_every_island_municipality_is_mapped(registry):
    counts = Counter(registry.senado_id_for(code)[:2] for code in all_vendor_codes())
    assert counts == {"07": 67, "35": 34, "38": 54}


def test_mainland_municipality_uses_province(registry):
    assert (registry.congreso_id_for("08019"), registry.senado_id_for("08019")) == (
        "08",
        "08",
    )


def test_island_municipality_uses_province_for_congreso(registry):
    assert registry.congreso_id_for(code_of("Teguise")) == "35"


def test_unmapped_island_municipality_raises(registry):
    with pytest.raises(UnmappedIslandMunicipality):
        registry.senado_id_for("07999")


@pytest.mark.parametrize(
    "name, code",
    [
        ("ARABA/ÁLAVA", "01"),
        ("Illes Balears", "07"),
        ("VALÈNCIA/VALENCIA", "46"),
        ("A CORUÑA", "15"),
        ("Bizkaia", "48"),
        ("SANTA CRUZ DE TENERIFE", "38"),
        ("CEUTA", "51"),
        ("Coruña, A", "15"),
        ("Balears, Illes", "07"),
    ],
)
def test_province_code_for_name(registry, name, code):
    assert registry.province_code_for_name(name) == code


def test_unknown_province_name_raises(registry):
    with pytest.raises(UnknownProvinceName):
        registry.province_code_for_name("ATLANTIS")


@pytest.mark.parametrize(
    "province, heading, island",
    [
        ("07", "Circunscripción electoral: Formentera", "07-formentera"),
        ("07", "Eivissa", "07-eivissa"),
        ("07", "MALLORCA", "07-mallorca"),
        ("35", "Gran Canaria", "35-gran-canaria"),
        ("38", "La Palma", "38-la-palma"),
        ("38", "El Hierro", "38-el-hierro"),
    ],
)
def test_island_heading(registry, province, heading, island):
    assert registry.senado_id_for_island_heading(province, heading) == island


def test_unknown_island_heading_raises(registry):
    with pytest.raises(UnknownIslandHeading):
        registry.senado_id_for_island_heading("07", "Tenerife")


def test_congreso_name_carries_eu_when_province_has_one(registry):
    names = registry.get("congreso", "31").names
    assert names["es"] == "Navarra"
    assert names["eu"] == "Nafarroa"
    assert "gl" not in names


def test_congreso_name_has_no_eu_gl_when_same_as_es(registry):
    assert set(registry.get("congreso", "28").names) == {"es", "ca"}


def test_senado_names_of_province_use_eu_and_gl(registry):
    assert registry.get("senado", "26").names["gl"] == "A Rioxa"
    assert registry.get("senado", "26").names["eu"] == "Errioxa"


def test_senado_islands_have_no_eu_gl_names(registry):
    islands = [c for c in registry.senado if "-" in c.id]
    assert islands
    assert all(set(c.names) == {"es", "ca"} for c in islands)


def test_province_names_in_eu_and_gl_resolve_to_code(registry):
    assert registry.province_code_for_name("Nafarroa") == "31"
    assert registry.province_code_for_name("Xirona") == "17"
