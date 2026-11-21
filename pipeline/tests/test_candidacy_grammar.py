import os
from collections import Counter
from pathlib import Path

import pytest

from elecciones_pipeline.candidacies import (
    BoeXmlSource,
    CandidacyHeader,
    parse_candidacies,
    parse_candidacy_header,
)
from elecciones_pipeline.candidacies.grammar import ParsedCandidacy
from elecciones_pipeline.candidacies.source import SourceDocument, SourceParagraph

BOE_ID = "BOE-A-2026-23103"
FIXTURES = Path(__file__).parent / "fixtures" / "boe"
EXCERPT_XML = FIXTURES / f"{BOE_ID}-excerpt.xml"
RAW_XML = Path(
    os.environ.get(
        "BOE_RAW_XML",
        Path(__file__).parents[1] / "data" / "raw" / f"{BOE_ID}.xml",
    )
)


@pytest.fixture(scope="module")
def excerpt():
    return parse_candidacies(BoeXmlSource(EXCERPT_XML, BOE_ID).load())


def select(parsed, province, chamber):
    return [
        candidacy
        for candidacy in parsed
        if candidacy.province_heading == province and candidacy.chamber == chamber
    ]


def document_of(*lines):
    paragraphs = tuple(SourceParagraph(css, text) for css, text in lines)
    return SourceDocument(BOE_ID, "url", paragraphs)


def test_excerpt_counts_read_by_hand(excerpt):
    counts = Counter((c.province_heading, c.chamber) for c in excerpt)
    assert counts == {
        ("BARCELONA", "congreso"): 11,
        ("BARCELONA", "senado"): 7,
        ("ILLES BALEARS", "congreso"): 7,
        ("ILLES BALEARS", "senado"): 10,
        ("CEUTA", "congreso"): 6,
        ("CEUTA", "senado"): 4,
        ("MELILLA", "congreso"): 5,
        ("MELILLA", "senado"): 3,
        ("SANTA CRUZ DE TENERIFE", "congreso"): 12,
        ("SANTA CRUZ DE TENERIFE", "senado"): 19,
        ("VALLADOLID", "congreso"): 13,
        ("VALLADOLID", "senado"): 10,
    }


def test_header_simple():
    assert parse_candidacy_header(
        "1. PARTIDO SOCIALISTA OBRERO ESPAÑOL (PSOE)"
    ) == CandidacyHeader(1, "PARTIDO SOCIALISTA OBRERO ESPAÑOL", "PSOE", False)


def test_header_nested_acronym():
    header = parse_candidacy_header(
        "4. PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSE-EE (PSOE))"
    )
    assert header.acronym == "PSE-EE (PSOE)"


def test_header_keeps_leading_parenthesis_in_denomination():
    header = parse_candidacy_header(
        "1. PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE) (PSC)"
    )
    assert (header.denomination, header.acronym) == (
        "PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE)",
        "PSC",
    )


def test_header_coalition():
    header = parse_candidacy_header(
        "7. COALICIÓN CANARIA-MUNICIPALISTAS PRIMERO CANARIAS (CC-MPC)"
    )
    assert header.is_coalition


def test_header_mixed_case_denomination_with_acronym():
    header = parse_candidacy_header("9. Frente Amplio (FA)")
    assert (header.denomination, header.acronym) == ("Frente Amplio", "FA")


def test_header_without_acronym():
    header = parse_candidacy_header("6. FRENTE OBRERO")
    assert (header.denomination, header.acronym) == ("FRENTE OBRERO", "")


def test_candidate_line_is_not_header():
    assert parse_candidacy_header("1. Candidata Ejemplo Pérez") is None


def test_candidate_line_with_party_suffix_is_not_header():
    assert parse_candidacy_header("1. Katia García Casas (Independiente).") is None


def test_barcelona_congreso_in_boe_order(excerpt):
    candidacies = select(excerpt, "BARCELONA", "congreso")
    assert [c.header.boe_order for c in candidacies] == [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        11,
        13,
    ]
    assert candidacies[0].header.acronym == "PSC"


def test_barcelona_congreso_titulares_and_suplentes(excerpt):
    candidacy = select(excerpt, "BARCELONA", "congreso")[0]
    assert [c.position for c in candidacy.candidates] == list(range(1, 33))
    assert candidacy.substitutes
    assert all(c.substitute_names == () for c in candidacy.candidates)
    assert all(c.substitute_names == () for c in candidacy.substitutes)


def test_senado_candidates_carry_substitutes(excerpt):
    for candidacy in select(excerpt, "BARCELONA", "senado"):
        assert candidacy.candidates
        assert all(len(c.substitute_names) >= 1 for c in candidacy.candidates)
        assert candidacy.substitutes == ()


def test_balearic_senado_split_by_island(excerpt):
    candidacies = select(excerpt, "ILLES BALEARS", "senado")
    assert [c.island_heading for c in candidacies] == [
        "Mallorca",
        "Mallorca",
        "Mallorca",
        "Menorca",
        "Menorca",
        "Eivissa",
        "Eivissa",
        "Formentera",
        "Formentera",
        "Formentera",
    ]
    assert all(
        c.island_heading is None for c in select(excerpt, "ILLES BALEARS", "congreso")
    )


def test_no_proclamada_candidacies_are_skipped_keeping_boe_order(excerpt):
    orders = [c.header.boe_order for c in select(excerpt, "MELILLA", "congreso")]
    assert orders == [1, 2, 3, 4, 6]
    assert [c.header.boe_order for c in select(excerpt, "MELILLA", "senado")] == [
        2,
        3,
        4,
    ]


def test_mixed_case_header_in_excerpt(excerpt):
    valladolid = select(excerpt, "VALLADOLID", "congreso")
    assert valladolid[11].header.denomination == "Frente Amplio"


def test_nested_acronym_in_excerpt(excerpt):
    acronyms = {c.header.acronym for c in select(excerpt, "VALLADOLID", "senado")}
    assert "SDP (PSOE-IU-MS)" in acronyms


def test_coalition_in_excerpt(excerpt):
    assert any(c.header.is_coalition for c in excerpt)


def test_senado_unnumbered_candidates_get_sequential_positions(excerpt):
    candidacy = select(excerpt, "VALLADOLID", "senado")[0]
    assert [c.position for c in candidacy.candidates] == [1, 2, 3]
    assert (
        candidacy.candidates[0].name == "José Ignacio Moratinos Delgado –el Empecinado–"
    )
    assert len(candidacy.candidates[0].substitute_names) == 2


def test_ceuta_senado_titular_and_suplente_markers(excerpt):
    candidacy = select(excerpt, "CEUTA", "senado")[0]
    assert [c.name for c in candidacy.candidates] == [
        "Abdelhakim Abdeselam Al-lal",
        "Cristina Díaz Moreno",
    ]
    assert [len(c.substitute_names) for c in candidacy.candidates] == [2, 2]


def test_ceuta_congreso_substitutes(excerpt):
    candidacy = select(excerpt, "CEUTA", "congreso")[4]
    assert [c.name for c in candidacy.substitutes] == [
        "Maria Luisa Jiménez Aguilar",
        "Manuel González Evangelista",
    ]


def test_province_heading_covers_repeated_junta_headings(excerpt):
    assert {c.province_heading for c in excerpt} == {
        "BARCELONA",
        "ILLES BALEARS",
        "CEUTA",
        "MELILLA",
        "SANTA CRUZ DE TENERIFE",
        "VALLADOLID",
    }


def test_unexpected_line_inside_candidacy_fails_loudly():
    document = document_of(
        ("centro_negrita", "JUNTA ELECTORAL DE CEUTA"),
        ("centro_cursiva", "CONGRESO DE LOS DIPUTADOS"),
        ("centro_redonda", "1. VOX (VOX)"),
        ("parrafo_2", "Texto inesperado."),
    )
    with pytest.raises(ValueError):
        parse_candidacies(document)


@pytest.mark.skipif(not RAW_XML.exists(), reason="raw BOE XML not downloaded")
def test_full_document_counts():
    parsed: list[ParsedCandidacy] = parse_candidacies(
        BoeXmlSource(RAW_XML, BOE_ID).load()
    )
    assert Counter(c.chamber for c in parsed) == {"congreso": 534, "senado": 361}
