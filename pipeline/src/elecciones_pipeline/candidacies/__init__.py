from elecciones_pipeline.candidacies.boe_html import BoeHtmlSource
from elecciones_pipeline.candidacies.boe_xml import BoeXmlSource
from elecciones_pipeline.candidacies.grammar import (
    CandidacyHeader,
    ParsedCandidacy,
    ParsedCandidate,
    parse_candidacies,
    parse_candidacy_header,
)
from elecciones_pipeline.candidacies.source import (
    CandidacySource,
    SourceDocument,
    SourceParagraph,
)

__all__ = [
    "BoeHtmlSource",
    "BoeXmlSource",
    "CandidacyHeader",
    "CandidacySource",
    "ParsedCandidacy",
    "ParsedCandidate",
    "SourceDocument",
    "SourceParagraph",
    "parse_candidacies",
    "parse_candidacy_header",
]
