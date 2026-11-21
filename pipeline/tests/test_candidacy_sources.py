from pathlib import Path

from elecciones_pipeline.candidacies import (
    BoeHtmlSource,
    BoeXmlSource,
    SourceParagraph,
    parse_candidacies,
)

BOE_ID = "BOE-A-2026-23103"
FIXTURES = Path(__file__).parent / "fixtures" / "boe"
EXCERPT_XML = FIXTURES / f"{BOE_ID}-excerpt.xml"
EXCERPT_HTML = FIXTURES / f"{BOE_ID}-excerpt.html"


def test_xml_source_keeps_order_and_classes():
    document = BoeXmlSource(EXCERPT_XML, BOE_ID).load()
    assert document.boe_id == BOE_ID
    assert document.url == f"https://www.boe.es/diario_boe/txt.php?id={BOE_ID}"
    assert document.paragraphs[:2] == (
        SourceParagraph("centro_negrita", "JUNTA ELECTORAL DE ILLES BALEARS"),
        document.paragraphs[1],
    )
    assert document.paragraphs[1].text.startswith("La Junta Electoral Provincial")


def test_xml_source_joins_indented_spans_into_one_line():
    document = BoeXmlSource(EXCERPT_XML, BOE_ID).load()
    texts = [paragraph.text for paragraph in document.paragraphs]
    assert "Suplente 1: Óscar López Hidalgo." in texts


def test_html_source_reads_text_container_only():
    document = BoeHtmlSource(EXCERPT_HTML, BOE_ID).load()
    assert document.paragraphs[0] == SourceParagraph(
        "centro_negrita", "JUNTA ELECTORAL DE ILLES BALEARS"
    )


def test_xml_and_html_sources_yield_same_candidacies():
    xml = BoeXmlSource(EXCERPT_XML, BOE_ID)
    html = BoeHtmlSource(EXCERPT_HTML, BOE_ID)
    assert parse_candidacies(xml.load()) == parse_candidacies(html.load())
