"""Validation helper tests."""

from app.utils.validation.helpers import sanitize_validation_errors_for_log


def test_sanitize_validation_errors_for_log_redacts_sensitive_input() -> None:
    errors = [
        {
            "type": "string_type",
            "loc": ("password",),
            "msg": "Field required",
            "input": "super-secret-password",
        }
    ]

    sanitized = sanitize_validation_errors_for_log(errors)

    assert len(sanitized) == 1
    assert sanitized[0]["loc"] == ["password"]
    assert sanitized[0]["msg"] == "Field required"
    assert sanitized[0]["input"] == "[REDACTED]"
    assert "super-secret-password" not in str(sanitized)


def test_sanitize_validation_errors_for_log_omits_non_sensitive_input() -> None:
    errors = [
        {
            "type": "string_type",
            "loc": ("email",),
            "msg": "value is not a valid email",
            "input": "not-an-email",
        }
    ]

    sanitized = sanitize_validation_errors_for_log(errors)

    assert sanitized[0]["input"] == "[OMITTED]"
    assert "not-an-email" not in str(sanitized)
