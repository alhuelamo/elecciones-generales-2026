import re
import unicodedata

SEPARATORS_TO_SPACE = re.compile(r"['’.\-/,()]")
WHITESPACE_RUN = re.compile(r"\s+")
DROPPED_IN_SLUG = re.compile(r"[.'’·+]")
NON_ALPHANUMERIC_RUN = re.compile(r"[^a-z0-9]+")


def normalize_text(text: str) -> str:
    folded = _fold(text).replace("·", "")
    spaced = SEPARATORS_TO_SPACE.sub(" ", folded)
    return WHITESPACE_RUN.sub(" ", spaced).strip()


def slugify(text: str) -> str:
    kept = DROPPED_IN_SLUG.sub("", _fold(text))
    return NON_ALPHANUMERIC_RUN.sub("-", kept).strip("-")


def _fold(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    without_marks = "".join(c for c in decomposed if not unicodedata.combining(c))
    return without_marks.casefold()
