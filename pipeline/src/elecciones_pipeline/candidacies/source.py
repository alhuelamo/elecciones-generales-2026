from dataclasses import dataclass
from typing import Iterable, Protocol

from lxml.etree import _Element

BOE_TEXT_URL_TEMPLATE = "https://www.boe.es/diario_boe/txt.php?id={boe_id}"


@dataclass(frozen=True)
class SourceParagraph:
    css_class: str
    text: str


@dataclass(frozen=True)
class SourceDocument:
    boe_id: str
    url: str
    paragraphs: tuple[SourceParagraph, ...]


class CandidacySource(Protocol):
    def load(self) -> SourceDocument: ...


def build_document(boe_id: str, elements: Iterable[_Element]) -> SourceDocument:
    paragraphs = (_to_paragraph(element) for element in elements)
    return SourceDocument(
        boe_id=boe_id,
        url=BOE_TEXT_URL_TEMPLATE.format(boe_id=boe_id),
        paragraphs=tuple(paragraph for paragraph in paragraphs if paragraph.text),
    )


def _to_paragraph(element: _Element) -> SourceParagraph:
    text = " ".join("".join(element.itertext()).split())
    return SourceParagraph(css_class=element.get("class", ""), text=text)
