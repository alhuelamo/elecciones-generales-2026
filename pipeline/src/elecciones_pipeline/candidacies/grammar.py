import re
from dataclasses import dataclass, field

from elecciones_pipeline.candidacies.source import SourceDocument, SourceParagraph
from elecciones_pipeline.normalize import normalize_text

CHAMBER_BY_HEADING = {
    "CONGRESO DE LOS DIPUTADOS": "congreso",
    "SENADO": "senado",
}
JUNTA_PREFIX = re.compile(r"^JUNTA ELECTORAL (?:PROVINCIAL )?DE ")
ISLAND_PREFIX = "Circunscripción electoral: "
NUMBERED_LINE = re.compile(r"^(\d+)\.\s+(.+)$")
SUBSTITUTE_OF_TITULAR = re.compile(r"^Suplente \d+:\s*(.+)$")
NOT_PROCLAIMED = "No proclamada."
TITULAR_MARKER = "Titular:"
SUBSTITUTE_MARKERS = {"Suplente:", "Suplentes:"}


@dataclass(frozen=True)
class CandidacyHeader:
    boe_order: int
    denomination: str
    acronym: str
    is_coalition: bool


@dataclass(frozen=True)
class ParsedCandidate:
    position: int
    name: str
    substitute_names: tuple[str, ...] = ()


@dataclass(frozen=True)
class ParsedCandidacy:
    province_heading: str
    chamber: str
    island_heading: str | None
    header: CandidacyHeader
    candidates: tuple[ParsedCandidate, ...]
    substitutes: tuple[ParsedCandidate, ...]


def parse_candidacy_header(text: str) -> CandidacyHeader | None:
    match = NUMBERED_LINE.match(text)
    if match is None or not _looks_like_header(match.group(2)):
        return None
    return _build_header(int(match.group(1)), match.group(2))


def parse_candidacies(document: SourceDocument) -> list[ParsedCandidacy]:
    parser = _CandidacyParser()
    for paragraph in document.paragraphs:
        parser.feed(paragraph)
    return parser.finish()


def _looks_like_header(body: str) -> bool:
    if body.endswith("."):
        return body == body.upper()
    return body.endswith(")") or body == body.upper()


def _build_header(boe_order: int, body: str) -> CandidacyHeader:
    denomination, acronym = _split_trailing_group(body)
    return CandidacyHeader(
        boe_order=boe_order,
        denomination=denomination,
        acronym=acronym,
        is_coalition="coalicion" in normalize_text(denomination),
    )


def _split_trailing_group(body: str) -> tuple[str, str]:
    if not body.endswith(")"):
        return body, ""
    depth = 0
    for index in range(len(body) - 1, -1, -1):
        depth += {")": 1, "(": -1}.get(body[index], 0)
        if depth == 0:
            head = body[:index].strip()
            return (head, body[index + 1 : -1]) if head else (body, "")
    return body, ""


def _strip_final_period(text: str) -> str:
    return text[:-1] if text.endswith(".") else text


@dataclass
class _OpenCandidacy:
    header: CandidacyHeader
    candidates: list[ParsedCandidate] = field(default_factory=list)
    substitutes: list[ParsedCandidate] = field(default_factory=list)
    substitute_names: list[list[str]] = field(default_factory=list)
    in_substitutes: bool = False
    last_substitute_number: int = 0
    not_proclaimed: bool = False


class _CandidacyParser:
    def __init__(self) -> None:
        self._results: list[ParsedCandidacy] = []
        self._province: str | None = None
        self._chamber: str | None = None
        self._island: str | None = None
        self._open: _OpenCandidacy | None = None

    def feed(self, paragraph: SourceParagraph) -> None:
        text = paragraph.text
        if paragraph.css_class == "centro_negrita":
            self._feed_heading(text)
        elif paragraph.css_class == "centro_cursiva":
            self._feed_chamber(text)
        elif paragraph.css_class == "centro_redonda":
            self._feed_header(text)
        elif self._open is not None:
            self._feed_line(text)

    def finish(self) -> list[ParsedCandidacy]:
        self._close_candidacy()
        return self._results

    def _feed_heading(self, text: str) -> None:
        self._close_candidacy()
        if text.startswith(ISLAND_PREFIX):
            self._island = text[len(ISLAND_PREFIX) :]
        elif JUNTA_PREFIX.match(text):
            self._province = JUNTA_PREFIX.sub("", text)
            self._chamber = None
            self._island = None
        else:
            raise ValueError(f"Unexpected heading: {text!r}")

    def _feed_chamber(self, text: str) -> None:
        self._close_candidacy()
        if text not in CHAMBER_BY_HEADING:
            raise ValueError(f"Unexpected chamber heading: {text!r}")
        self._chamber = CHAMBER_BY_HEADING[text]
        self._island = None

    def _feed_header(self, text: str) -> None:
        self._close_candidacy()
        match = NUMBERED_LINE.match(text)
        if match is None or self._chamber is None:
            raise ValueError(f"Unexpected candidacy header: {text!r}")
        self._open = _OpenCandidacy(_build_header(int(match.group(1)), match.group(2)))

    def _feed_line(self, text: str) -> None:
        candidacy = self._open
        if text == NOT_PROCLAIMED:
            candidacy.not_proclaimed = True
        elif text == TITULAR_MARKER:
            candidacy.in_substitutes = False
        elif text in SUBSTITUTE_MARKERS:
            candidacy.in_substitutes = True
        elif self._chamber == "senado":
            self._feed_senado_line(candidacy, text)
        else:
            self._feed_congreso_line(candidacy, text)

    def _feed_congreso_line(self, candidacy: _OpenCandidacy, text: str) -> None:
        match = NUMBERED_LINE.match(text)
        if match is None:
            raise ValueError(f"Unexpected line in {candidacy.header}: {text!r}")
        target = (
            candidacy.substitutes if candidacy.in_substitutes else candidacy.candidates
        )
        target.append(
            ParsedCandidate(int(match.group(1)), _strip_final_period(match.group(2)))
        )

    def _feed_senado_line(self, candidacy: _OpenCandidacy, text: str) -> None:
        substitute = SUBSTITUTE_OF_TITULAR.match(text)
        if substitute is not None:
            self._add_senado_substitute(candidacy, substitute.group(1))
            return
        match = NUMBERED_LINE.match(text)
        number = int(match.group(1)) if match else None
        name = match.group(2) if match else text
        if (
            candidacy.in_substitutes
            and number is not None
            and number > candidacy.last_substitute_number
        ):
            candidacy.last_substitute_number = number
            self._add_senado_substitute(candidacy, name)
            return
        candidacy.in_substitutes = False
        candidacy.candidates.append(
            ParsedCandidate(len(candidacy.candidates) + 1, _strip_final_period(name))
        )
        candidacy.substitute_names.append([])

    def _add_senado_substitute(self, candidacy: _OpenCandidacy, name: str) -> None:
        if not candidacy.candidates:
            raise ValueError(
                f"Substitute before titular in {candidacy.header}: {name!r}"
            )
        candidacy.substitute_names[-1].append(_strip_final_period(name))

    def _close_candidacy(self) -> None:
        candidacy, self._open = self._open, None
        if candidacy is None or candidacy.not_proclaimed:
            return
        candidates = tuple(
            ParsedCandidate(candidate.position, candidate.name, tuple(names))
            for candidate, names in zip(
                candidacy.candidates, candidacy.substitute_names
            )
        ) or tuple(candidacy.candidates)
        self._results.append(
            ParsedCandidacy(
                self._province,
                self._chamber,
                self._island,
                candidacy.header,
                candidates,
                tuple(candidacy.substitutes),
            )
        )
