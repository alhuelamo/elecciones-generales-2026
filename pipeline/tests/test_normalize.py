import pytest

from elecciones_pipeline.normalize import normalize_text, slugify


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("Hospitalet de Llobregat, L'", "hospitalet de llobregat l"),
        ("ARABA/ÁLAVA", "araba alava"),
        ("  València/Valencia ", "valencia valencia"),
        ("Sant Llorenç d’Hortons", "sant llorenc d hortons"),
        ("Castellbell i el Vilar", "castellbell i el vilar"),
        ("Col·legi", "collegi"),
    ],
)
def test_normalize_text(raw, expected):
    assert normalize_text(raw) == expected


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("PSOE", "psoe"),
        ("PSC-PSOE", "psc-psoe"),
        ("B.N.G.", "bng"),
        ("EH Bildu", "eh-bildu"),
        ("PSE-EE (PSOE)", "pse-ee-psoe"),
        ("C's", "cs"),
        ("Más Madrid", "mas-madrid"),
        ("CC-MPC", "cc-mpc"),
        ("+MPC", "mpc"),
        ("JxCAT-JUNTS", "jxcat-junts"),
    ],
)
def test_slugify(raw, expected):
    assert slugify(raw) == expected
