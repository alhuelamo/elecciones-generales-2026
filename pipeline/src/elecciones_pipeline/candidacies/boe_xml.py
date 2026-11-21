from pathlib import Path

from lxml import etree

from elecciones_pipeline.candidacies.source import SourceDocument, build_document


class BoeXmlSource:
    def __init__(self, path: Path, boe_id: str) -> None:
        self._path = path
        self._boe_id = boe_id

    def load(self) -> SourceDocument:
        parser = etree.XMLParser(resolve_entities=False, no_network=True)
        root = etree.parse(str(self._path), parser).getroot()
        return build_document(self._boe_id, root.find("texto").iter("p"))
