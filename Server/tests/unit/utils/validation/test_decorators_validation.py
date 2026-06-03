"""Unit tests for OpenAPI validation decorators."""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import patch

from flask import Flask

from app.utils.validation.decorators import (
    OPENAPI_VALIDATE_FORM_ATTR,
    OPENAPI_VALIDATE_REQUEST_ATTR,
    has_request_validation_decorator,
    has_validation_decorator,
    validate_form_request,
    validate_request,
    validate_response,
)

from .validation_decorator_test_schemas import (
    FormAllFields,
    FormJsonBlob,
    FormSingleKey,
    InvalidRequestBody,
    ValidRequestBody,
    ValidResponseBody,
)


def test_validate_request_passes_validated_model(app: Flask):
    captured: dict[str, Any] = {}

    @validate_request(ValidRequestBody)
    def route(data: ValidRequestBody | None = None):
        captured["data"] = data
        return {"ok": True}

    with app.test_request_context(
        "/api/v1/other/login",
        method="POST",
        json={"email": "user@example.com", "password": "secret"},
    ):
        result = route()

    assert result == {"ok": True}
    assert captured["data"] is not None
    assert captured["data"].email == "user@example.com"


def test_validate_request_gradual_mode_passes_none_on_invalid(app: Flask):
    captured: dict[str, Any] = {}

    @validate_request(InvalidRequestBody)
    def route(data: InvalidRequestBody | None = None):
        captured["data"] = data
        return "continued"

    with (
        patch("app.utils.validation.decorators.VALIDATION_MODE", "gradual"),
        patch("app.utils.validation.decorators.is_strict_for_request_path", return_value=False),
    ):
        with app.test_request_context("/api/v1/other/action", method="POST", json={}):
            with patch("app.utils.validation.decorators.log") as mock_log:
                result = route()

    assert result == "continued"
    assert captured["data"] is None
    mock_log.warn.assert_called_once()
    mock_log.info.assert_called_once()


def test_validate_request_strict_path_returns_400(app: Flask):
    @validate_request(InvalidRequestBody)
    def route(data: InvalidRequestBody | None = None):
        return "should not run"

    with (
        patch("app.utils.validation.decorators.VALIDATION_MODE", "gradual"),
        patch("app.utils.validation.decorators.is_strict_for_request_path", return_value=True),
    ):
        with app.test_request_context("/api/v1/auth/login", method="POST", json={}):
            with patch("app.utils.validation.decorators.log") as mock_log:
                result = route()

    assert isinstance(result, tuple)
    assert result[1] == 400
    mock_log.warn.assert_called_once()


def test_validate_request_global_strict_mode_returns_400(app: Flask):
    @validate_request(InvalidRequestBody)
    def route(data: InvalidRequestBody | None = None):
        return "should not run"

    with patch("app.utils.validation.decorators.VALIDATION_MODE", "strict"):
        with app.test_request_context("/api/v1/other/action", method="POST", json={}):
            result = route()

    assert isinstance(result, tuple)
    assert result[1] == 400


def test_validate_request_sets_openapi_attr_on_wrapper():
    @validate_request(ValidRequestBody)
    def route(data: ValidRequestBody | None = None):
        return None

    assert getattr(route, OPENAPI_VALIDATE_REQUEST_ATTR, None) is ValidRequestBody


def test_validate_form_request_all_form_fields(app: Flask):
    captured: dict[str, Any] = {}

    @validate_form_request(FormAllFields)
    def route(data: FormAllFields | None = None):
        captured["data"] = data
        return "ok"

    with app.test_request_context(
        "/api/v1/upload",
        method="POST",
        data={"title": "Hello", "count": "7"},
    ):
        result = route()

    assert result == "ok"
    assert captured["data"] is not None
    assert captured["data"].title == "Hello"
    assert captured["data"].count == 7


def test_validate_form_request_single_form_key(app: Flask):
    captured: dict[str, Any] = {}

    @validate_form_request(FormSingleKey, form_key="metadata")
    def route(data: FormSingleKey | None = None):
        captured["data"] = data
        return "ok"

    with app.test_request_context(
        "/api/v1/upload",
        method="POST",
        data={"metadata": '{"label":"x"}'},
    ):
        route()

    assert captured["data"] is not None
    assert captured["data"].metadata == '{"label":"x"}'


def test_validate_form_request_parse_json_empty_defaults(app: Flask):
    captured: dict[str, Any] = {}

    @validate_form_request(FormJsonBlob, form_key="payload", parse_json=True)
    def route(data: FormJsonBlob | None = None):
        captured["data"] = data
        return "ok"

    with app.test_request_context("/api/v1/upload", method="POST", data={}):
        route()

    assert captured["data"] is not None
    assert captured["data"].label is None
    assert captured["data"].value is None


def test_validate_form_request_parse_json_valid(app: Flask):
    captured: dict[str, Any] = {}

    @validate_form_request(FormJsonBlob, form_key="payload", parse_json=True)
    def route(data: FormJsonBlob | None = None):
        captured["data"] = data
        return "ok"

    with app.test_request_context(
        "/api/v1/upload",
        method="POST",
        data={"payload": json.dumps({"label": "L", "value": 9})},
    ):
        route()

    assert captured["data"] is not None
    assert captured["data"].label == "L"
    assert captured["data"].value == 9


def test_validate_form_request_gradual_invalid_returns_none(app: Flask):
    captured: dict[str, Any] = {}

    @validate_form_request(FormAllFields)
    def route(data: FormAllFields | None = None):
        captured["data"] = data
        return "ok"

    with patch("app.utils.validation.decorators.is_strict_for_request_path", return_value=False):
        with app.test_request_context("/api/v1/upload", method="POST", data={"count": "1"}):
            with patch("app.utils.validation.decorators.log") as mock_log:
                route()

    assert captured["data"] is None
    mock_log.warn.assert_called_once()
    mock_log.info.assert_called_once()


def test_validate_form_request_invalid_json_returns_400(app: Flask):
    @validate_form_request(FormJsonBlob, form_key="payload", parse_json=True)
    def route(data: FormJsonBlob | None = None):
        return "ok"

    with app.test_request_context(
        "/api/v1/upload",
        method="POST",
        data={"payload": "not-json"},
    ):
        with (
            patch.object(
                FormJsonBlob,
                "model_validate_json",
                side_effect=json.JSONDecodeError("Expecting value", "not-json", 0),
            ),
            patch("app.utils.validation.decorators.log") as mock_log,
        ):
            result = route()

    assert isinstance(result, tuple)
    assert result[1] == 400
    mock_log.warn.assert_called_once()


def test_validate_form_request_sets_openapi_form_attr_on_wrapper():
    @validate_form_request(FormAllFields)
    def route(data: FormAllFields | None = None):
        return None

    assert getattr(route, OPENAPI_VALIDATE_FORM_ATTR, None) is FormAllFields


def test_validate_response_passes_valid_dict(app: Flask):
    @validate_response(ValidResponseBody)
    def route():
        return {"success": True}

    with app.test_request_context("/api/v1/test", method="GET"):
        assert route() == {"success": True}


def test_validate_response_logs_validation_error_but_returns_payload(app: Flask):
    @validate_response(ValidResponseBody)
    def route():
        return {"success": "not-a-bool"}

    with app.test_request_context("/api/v1/test", method="GET"):
        with patch("app.utils.validation.decorators.log") as mock_log:
            result = route()

    assert result == {"success": "not-a-bool"}
    mock_log.error.assert_called_once()
    call_kwargs = mock_log.error.call_args[0][2]
    assert call_kwargs["schema"] == "ValidResponseBody"
    assert call_kwargs["status_code"] == 200


def test_validate_response_skips_validation_for_non_2xx(app: Flask):
    @validate_response(ValidResponseBody)
    def route():
        return ({"success": "bad"}, 500)

    with app.test_request_context("/api/v1/test", method="GET"):
        with patch("app.utils.validation.decorators.log") as mock_log:
            result = route()

    assert result == ({"success": "bad"}, 500)
    mock_log.error.assert_not_called()


def test_has_request_validation_decorator_detects_validate_request():
    @validate_request(ValidRequestBody)
    def route(data: ValidRequestBody | None = None):
        return None

    assert has_request_validation_decorator(route) is True


def test_has_request_validation_decorator_detects_validate_form_request():
    @validate_form_request(FormAllFields)
    def route(data: FormAllFields | None = None):
        return None

    assert has_request_validation_decorator(route) is True


def test_has_request_validation_decorator_false_for_plain_function():
    def route():
        return None

    assert has_request_validation_decorator(route) is False


def test_has_validation_decorator_true_for_request_decorator():
    @validate_request(ValidRequestBody)
    def route(data: ValidRequestBody | None = None):
        return None

    assert has_validation_decorator(route) is True


def test_has_validation_decorator_true_for_response_decorator():
    @validate_response(ValidResponseBody)
    def route():
        return {"success": True}

    assert has_validation_decorator(route) is True
