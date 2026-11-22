import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import yaml

from elecciones_pipeline.normalize import normalize_text

ISLAND_PROVINCE_CODES = frozenset({"07", "35", "38"})
PROVINCE_SENADO_SEATS = 4
AUTONOMOUS_CITY_SENADO_SEATS = 2
SPARSE_LANGUAGES = ("eu", "gl")
AUTONOMOUS_CITY_CODES = frozenset({"51", "52"})


@dataclass(frozen=True)
class Constituency:
    chamber: Literal["congreso", "senado"]
    id: str
    names: dict[str, str]
    seats: int
    max_marks: int | None


class UnmappedIslandMunicipality(Exception):
    pass


class UnknownProvinceName(Exception):
    pass


class UnknownIslandHeading(Exception):
    pass


def senado_max_marks(seats: int) -> int:
    return max(seats - 1, 1)


def load_constituencies(data_dir: Path) -> "ConstituencyRegistry":
    seats = _read_yaml(data_dir / "seats_2026.yaml")
    provinces = _read_yaml(data_dir / "provinces.yaml")
    islands = _read_yaml(data_dir / "island_constituencies.yaml")
    municipality_island_ids = _read_municipality_island_ids(data_dir)
    return ConstituencyRegistry(seats, provinces, islands, municipality_island_ids)


def _read_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _read_municipality_island_ids(data_dir: Path) -> dict[str, str]:
    path = data_dir / "vendor" / "municipios_islas.csv"
    with path.open(encoding="utf-8", newline="") as handle:
        return {row["municipio_id"]: row["isla_id"] for row in csv.DictReader(handle)}


class ConstituencyRegistry:
    def __init__(
        self,
        seats: dict[str, int],
        provinces: dict[str, dict],
        islands: dict[str, dict],
        municipality_island_ids: dict[str, str],
    ):
        self._provinces = provinces
        self._islands = islands
        self._municipality_island_ids = municipality_island_ids
        self._island_id_by_isla_id = {
            isla_id: island_id
            for island_id, island in islands.items()
            for isla_id in island["islaIds"]
        }
        self._province_code_by_name = self._index_province_names(provinces)
        self.congreso = self._build_congreso(seats, provinces)
        self.senado = self._build_senado(provinces, islands)
        self._by_key = {(c.chamber, c.id): c for c in self.congreso + self.senado}

    def congreso_id_for(self, municipality_code: str) -> str:
        return municipality_code[:2]

    def senado_id_for(self, municipality_code: str) -> str:
        province_code = municipality_code[:2]
        if province_code not in ISLAND_PROVINCE_CODES:
            return province_code
        isla_id = self._municipality_island_ids.get(municipality_code)
        island_id = self._island_id_by_isla_id.get(isla_id)
        if island_id is None:
            raise UnmappedIslandMunicipality(municipality_code)
        return island_id

    def province_code_for_name(self, name: str) -> str:
        try:
            return self._province_code_by_name[normalize_text(name)]
        except KeyError:
            raise UnknownProvinceName(name) from None

    def senado_id_for_island_heading(self, province_code: str, heading: str) -> str:
        normalized_heading = normalize_text(heading)
        for island_id, island in self._islands.items():
            if island_id[:2] != province_code:
                continue
            if any(
                normalize_text(name) in normalized_heading
                for name in island["headingNames"]
            ):
                return island_id
        raise UnknownIslandHeading(f"{province_code}: {heading}")

    def get(self, chamber: str, constituency_id: str) -> Constituency:
        return self._by_key[(chamber, constituency_id)]

    @staticmethod
    def _index_province_names(provinces: dict[str, dict]) -> dict[str, str]:
        index = {}
        for code, province in provinces.items():
            names = [
                *_province_names(province).values(),
                *province["boeNames"],
            ]
            for name in names:
                index[normalize_text(name)] = code
        return index

    @staticmethod
    def _build_congreso(seats: dict[str, int], provinces: dict[str, dict]):
        return [
            Constituency(
                "congreso",
                code,
                _province_names(provinces[code]),
                seats[code],
                None,
            )
            for code in sorted(provinces)
        ]

    @staticmethod
    def _build_senado(provinces: dict[str, dict], islands: dict[str, dict]):
        province_constituencies = [
            _senado_constituency(code, _province_names(province), _seats(code))
            for code, province in provinces.items()
            if code not in ISLAND_PROVINCE_CODES
        ]
        island_constituencies = [
            _senado_constituency(id, _province_names(island), island["seats"])
            for id, island in islands.items()
        ]
        return sorted(province_constituencies + island_constituencies, key=_by_id)


def _seats(province_code: str) -> int:
    if province_code in AUTONOMOUS_CITY_CODES:
        return AUTONOMOUS_CITY_SENADO_SEATS
    return PROVINCE_SENADO_SEATS


def _province_names(entry: dict) -> dict[str, str]:
    names = {"es": entry["es"], "ca": entry["ca"]}
    for language in SPARSE_LANGUAGES:
        if entry.get(language, entry["es"]) != entry["es"]:
            names[language] = entry[language]
    return names


def _senado_constituency(id: str, names: dict[str, str], seats: int):
    return Constituency("senado", id, names, seats, senado_max_marks(seats))


def _by_id(constituency: Constituency) -> str:
    return constituency.id
