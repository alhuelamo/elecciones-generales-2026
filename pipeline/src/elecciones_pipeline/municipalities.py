import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path

from openpyxl import load_workbook

from elecciones_pipeline.labels import MunicipalityLabels
from elecciones_pipeline.normalize import normalize_text

FIRST_DATA_ROW = 4
SPARSE_LANGUAGES = ("eu", "gl")
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


def localized_names(
    official_name: str, labels: MunicipalityLabels | None
) -> dict[str, str]:
    labels = labels or MunicipalityLabels(es="", ca="")
    parts = [_display_part(part) for part in official_name.split("/")]
    if len(parts) == 1:
        return {"es": parts[0], "ca": parts[0]}
    es = _closest_part(parts, labels.es) if labels.es else None
    ca = _closest_part(parts, labels.ca) if labels.ca else None
    names = {
        "es": es or _other_part(parts, ca),
        "ca": ca or _other_part(parts, es),
    }
    for language in SPARSE_LANGUAGES:
        label = getattr(labels, language)
        chosen = _closest_part(parts, label) if label else names["es"]
        if chosen != names["es"]:
            names[language] = chosen
    return names


def needs_label_fallback(official_name: str, labels: MunicipalityLabels | None) -> bool:
    is_bilingual = "/" in official_name
    has_labels = bool(labels and (labels.es or labels.ca))
    return is_bilingual and not has_labels


def search_aliases(
    official_name: str,
    names: dict[str, str],
    labels: MunicipalityLabels | None = None,
) -> list[str]:
    parts = official_name.split("/")
    candidates = [
        official_name,
        *(part.strip() for part in parts),
        display_name(official_name),
        *(_display_part(part) for part in parts),
        names["es"],
        names["ca"],
        *((labels.es, labels.ca, labels.eu, labels.gl) if labels else ()),
    ]
    unique = list(dict.fromkeys(candidates))
    displayed = {
        names["es"],
        names["ca"],
        *(names.get(language, names["es"]) for language in SPARSE_LANGUAGES),
    }
    return [
        alias
        for alias in unique
        if alias and (len(displayed) > 1 or alias not in displayed)
    ]


def _other_part(parts: list[str], chosen: str | None) -> str:
    remaining = [part for part in parts if part != chosen]
    return remaining[0] if chosen and len(parts) == 2 else parts[0]


def _closest_part(parts: list[str], label: str) -> str:
    target = normalize_text(label)
    return max(
        parts,
        key=lambda part: SequenceMatcher(None, normalize_text(part), target).ratio(),
    )


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
