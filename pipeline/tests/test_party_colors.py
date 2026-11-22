import pytest

from elecciones_pipeline.errors import BuildError
from elecciones_pipeline.party_colors import load_party_colors


def write_colors(tmp_path, content):
    path = tmp_path / "party_colors.yaml"
    path.write_text(content, encoding="utf-8")
    return path


def test_load_party_colors_maps_acronym_to_lowercase_hex(tmp_path):
    path = write_colors(
        tmp_path,
        """
PP:
  color: "#1D84CE"
  sourceUrl: https://es.wikipedia.org/wiki/Partido_Popular
PSC:
  color: "#FF0000"
  sourceUrl: https://es.wikipedia.org/wiki/PSOE
  inheritedFrom: PSOE
""",
    )

    assert load_party_colors(path) == {"PP": "#1d84ce", "PSC": "#ff0000"}


def test_empty_file_gives_no_colors(tmp_path):
    assert load_party_colors(write_colors(tmp_path, "")) == {}


def test_missing_color_raises_build_error(tmp_path):
    path = write_colors(
        tmp_path, "PP:\n  sourceUrl: https://es.wikipedia.org/wiki/PP\n"
    )

    with pytest.raises(BuildError, match="PP"):
        load_party_colors(path)


@pytest.mark.parametrize(
    "bad_color", ["red", "#12345", "#gggggg", "1d84ce", "#1d84ce00"]
)
def test_malformed_hex_raises_build_error(tmp_path, bad_color):
    path = write_colors(tmp_path, f'PP:\n  color: "{bad_color}"\n')

    with pytest.raises(BuildError, match="PP"):
        load_party_colors(path)
