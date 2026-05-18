"""Config validator behavior in test vs production modes."""

import os

import pytest

from app.utils.validation.config_validator import validate_and_raise


def test_validate_and_raise_skips_when_testing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TESTING", "true")
    for key in (
        "AWS_ACCESS_KEY_ID",
        "DOCUSIGN_CLIENT_SECRET",
        "OPENAI_KEY",
    ):
        monkeypatch.delenv(key, raising=False)
    validate_and_raise()


def test_validate_and_raise_requires_env_when_not_testing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("TESTING", raising=False)
    monkeypatch.setattr(
        "app.utils.validation.config_validator.REQUIRED_ENV_VARS",
        ["FAKE_REQUIRED_FOR_PYTEST"],
    )
    monkeypatch.delenv("FAKE_REQUIRED_FOR_PYTEST", raising=False)
    with pytest.raises(RuntimeError, match="FAKE_REQUIRED_FOR_PYTEST"):
        validate_and_raise()
