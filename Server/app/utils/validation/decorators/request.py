"""OpenAPI request-body validation decorators."""

import json
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

from flask import request
from pydantic import BaseModel, ValidationError

from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation.domain_strict import is_strict_for_request_path
from app.utils.validation.helpers import (
    format_validation_errors,
    sanitize_validation_errors_for_log,
)
from logger import log

from .shared import (
    OPENAPI_VALIDATE_FORM_ATTR,
    OPENAPI_VALIDATE_REQUEST_ATTR,
    VALIDATION_MODE,
    coerce_json_body_for_schema,
)

F = TypeVar("F", bound=Callable[..., Any])


def validate_request(schema: type[BaseModel]) -> Callable[[F], F]:
    """
    Validate request body against OpenAPI Pydantic schema.

    Modes (via OPENAPI_VALIDATION_MODE env var):
    - gradual: Log validation failures but accept request (default)
    - strict: Reject invalid requests with 400 error
    """

    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                raw = request.get_json(silent=True)
                json_data = coerce_json_body_for_schema(schema, raw)
                validated_data = schema(**json_data)
                return f(*args, data=validated_data, **kwargs)

            except ValidationError as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.warn(
                    "ERRORS",
                    f"OpenAPI validation failed [{error_id}]",
                    {
                        "route": request.path,
                        "method": request.method,
                        "schema": schema.__name__,
                        "errors": sanitize_validation_errors_for_log(e.errors()),
                        "mode": VALIDATION_MODE,
                        "error_id": error_id,
                    },
                )

                if is_strict_for_request_path(request.path, VALIDATION_MODE):
                    field_errors = format_validation_errors(e.errors())
                    return SecureErrorHandler.handle_validation_error(e, field_errors)

                log.info(
                    "ERRORS",
                    f"Gradual mode: accepting request despite validation failure [{error_id}]",
                    {"route": request.path},
                )
                return f(*args, data=None, **kwargs)

            except Exception as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.error(
                    "ERRORS",
                    f"Unexpected error in request validation [{error_id}]",
                    {"route": request.path, "error": str(e)},
                )
                return SecureErrorHandler.handle_error(
                    e, context={"function": "validate_request", "schema": schema.__name__}
                )

        setattr(wrapper, OPENAPI_VALIDATE_REQUEST_ATTR, schema)
        return wrapper  # type: ignore

    return decorator


def validate_form_request(
    schema: type[BaseModel],
    *,
    form_key: str | None = None,
    parse_json: bool = False,
) -> Callable[[F], F]:
    """Validate multipart or form-encoded fields against a Pydantic schema."""

    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                if form_key is not None:
                    raw_value = request.form.get(form_key)
                    if parse_json:
                        if not raw_value:
                            validated_data = schema.model_validate({})
                        else:
                            validated_data = schema.model_validate_json(raw_value)
                    else:
                        validated_data = schema.model_validate({form_key: raw_value})
                else:
                    field_names = list(schema.model_fields.keys())
                    payload = {
                        name: request.form.get(name) for name in field_names if name in request.form
                    }
                    validated_data = schema.model_validate(payload)

                return f(*args, data=validated_data, **kwargs)

            except ValidationError as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.warn(
                    "ERRORS",
                    f"OpenAPI form validation failed [{error_id}]",
                    {
                        "route": request.path,
                        "method": request.method,
                        "schema": schema.__name__,
                        "errors": sanitize_validation_errors_for_log(e.errors()),
                        "mode": VALIDATION_MODE,
                        "error_id": error_id,
                    },
                )
                if is_strict_for_request_path(request.path, VALIDATION_MODE):
                    field_errors = format_validation_errors(e.errors())
                    return SecureErrorHandler.handle_validation_error(e, field_errors)
                log.info(
                    "ERRORS",
                    f"Gradual mode: accepting form despite validation failure [{error_id}]",
                    {"route": request.path},
                )
                return f(*args, data=None, **kwargs)

            except json.JSONDecodeError as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.warn(
                    "ERRORS",
                    f"Invalid JSON in form field [{error_id}]",
                    {"route": request.path, "form_key": form_key, "error": str(e)},
                )
                return SecureErrorHandler.create_secure_response(
                    "validation_error",
                    400,
                    additional_info={"message": "Invalid JSON in form field"},
                )

            except Exception as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.error(
                    "ERRORS",
                    f"Unexpected error in form validation [{error_id}]",
                    {"route": request.path, "error": str(e)},
                )
                return SecureErrorHandler.handle_error(
                    e,
                    context={"function": "validate_form_request", "schema": schema.__name__},
                )

        setattr(wrapper, OPENAPI_VALIDATE_FORM_ATTR, schema)
        return wrapper  # type: ignore

    return decorator
