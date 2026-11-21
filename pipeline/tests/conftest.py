import shutil
from pathlib import Path

import pytest
from openpyxl import Workbook

from elecciones_pipeline.build import BOE_ID, INE_FILE, BuildPaths

PIPELINE_DIR = Path(__file__).parent.parent
FIXTURES = Path(__file__).parent / "fixtures"
INE_ROWS = {
    "07": [("07", "040", "Palma de Mallorca"), ("07", "024", "Formentera")],
    "08": [("08", "019", "Barcelona"), ("08", "101", "Hospitalet de Llobregat, L'")],
    "51": [("51", "001", "Ceuta")],
}


def write_ine_workbook(path: Path, rows_by_province: dict) -> None:
    workbook = Workbook()
    workbook.remove(workbook.active)
    for province, rows in rows_by_province.items():
        sheet = workbook.create_sheet(province)
        sheet.append(["Title"])
        sheet.append([])
        sheet.append(["CPRO", "CMUN", "DC", "NOMBRE"])
        for province_code, municipality_code, name in rows:
            sheet.append([province_code, municipality_code, 0, name])
    workbook.save(path)


@pytest.fixture
def build_inputs(tmp_path) -> BuildPaths:
    data_dir = tmp_path / "data"
    raw_dir = tmp_path / "raw"
    data_dir.mkdir()
    raw_dir.mkdir()
    for yaml_file in (PIPELINE_DIR / "data").glob("*.yaml"):
        shutil.copy(yaml_file, data_dir / yaml_file.name)
    shutil.copytree(PIPELINE_DIR / "data" / "vendor", data_dir / "vendor")
    shutil.copy(
        FIXTURES / "boe" / "BOE-A-2026-23103-excerpt.xml", raw_dir / f"{BOE_ID}.xml"
    )
    write_ine_workbook(raw_dir / INE_FILE, INE_ROWS)
    return BuildPaths(data_dir, raw_dir, tmp_path / "out")
