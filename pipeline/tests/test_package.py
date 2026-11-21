import elecciones_pipeline.cli as cli


def test_package_is_importable():
    assert callable(cli.main)
