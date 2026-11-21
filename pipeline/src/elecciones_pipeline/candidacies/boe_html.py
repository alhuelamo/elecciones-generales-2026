from pathlib import Path

from lxml import html

from elecciones_pipeline.candidacies.source import SourceDocument, build_document


class BoeHtmlSource:
    def __init__(self, path: Path, boe_id: str) -> None:
        self._path = path
        self._boe_id = boe_id

    def load(self) -> SourceDocument:
        root = html.parse(str(self._path)).getroot()
        return build_document(self._boe_id, root.xpath("//*[@id='textoxslt']//p"))
