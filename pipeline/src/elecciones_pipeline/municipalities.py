import re
from dataclasses import dataclass
from pathlib import Path

from openpyxl import load_workbook

FIRST_DATA_ROW = 4
POSTPOSED_ARTICLES = {
    article.casefold()
    for article in "El La Los Las L' Els Les Es Sa Ses So Lo O A Os As".split()
}
POSTPOSED_ARTICLE_PATTERN = re.compile(r"^(?P<name>.+), (?P<article>\S+)$")


@dataclass(frozen=True)
class IneMunicipality:
    code: str
    official_name: str


def read_ine_municipalities(xlsx_path: Path) -> list[IneMunicipality]:
    workbook = load_workbook(xlsx_path, read_only=True, data_only=True)
    municipalities = [
        municipality
        for sheet in workbook.worksheets
        for municipality in _read_sheet(sheet)
    ]
    workbook.close()
    return sorted(municipalities, key=lambda municipality: municipality.code)


def display_name(official_name: str) -> str:
    return "/".join(_display_part(part) for part in official_name.split("/"))


def search_aliases(official_name: str) -> list[str]:
    parts = official_name.split("/")
    if len(parts) > 1:
        return [_display_part(part) for part in parts]
    if display_name(official_name) != official_name:
        return [official_name]
    return []


def _read_sheet(sheet) -> list[IneMunicipality]:
    rows = sheet.iter_rows(min_row=FIRST_DATA_ROW, max_col=4, values_only=True)
    return [
        IneMunicipality(
            code=f"{int(province):02d}{int(municipality):03d}",
            official_name=str(name).strip(),
        )
        for province, municipality, _, name in rows
        if province not in (None, "")
    ]


def _display_part(part: str) -> str:
    stripped = part.strip()
    match = POSTPOSED_ARTICLE_PATTERN.match(stripped)
    if not match or match["article"].casefold() not in POSTPOSED_ARTICLES:
        return stripped
    article = match["article"][0].upper() + match["article"][1:]
    separator = "" if article.endswith("'") else " "
    return f"{article}{separator}{match['name']}"
