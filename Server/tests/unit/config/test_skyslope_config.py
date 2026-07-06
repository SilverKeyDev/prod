from app.config.skyslope import skyslope_partnership_configured


def test_skyslope_partnership_configured(monkeypatch):
    monkeypatch.setenv("SKYSLOPE_ACCESS_KEY", "access")
    monkeypatch.setenv("SKYSLOPE_SECRET", "secret")
    assert skyslope_partnership_configured() is True

    monkeypatch.delenv("SKYSLOPE_SECRET", raising=False)
    assert skyslope_partnership_configured() is False
