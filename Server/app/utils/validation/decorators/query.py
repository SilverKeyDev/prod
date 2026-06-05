"""OpenAPI query-string validation decorator."""

from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

from flask import request
from pydantic import BaseModel, ValidationError

from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation.domain_strict import is_strict_for_request_path
from app.utils.validation.helpers import sanitize_validation_errors_for_log
from logger import log

from .shared import VALIDATION_MODE

F = TypeVar("F", bound=Callable[..., Any])


def validate_query(schema: type[BaseModel]) -> Callable[[F], F]:
    """Validate query string parameters against a Pydantic model."""

    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                raw_args = dict(request.args.items())
                validated_query = schema.model_validate(raw_args)
                return f(*args, query=validated_query, **kwargs)

            except ValidationError as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.warn(
                    "ERRORS",
                    f"OpenAPI query validation failed [{error_id}]",
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
                    field_errors = {}
                    for err in e.errors():
                        field = ".".join(str(loc) for loc in err["loc"])
                        field_errors[field] = err["msg"]
                    return SecureErrorHandler.handle_validation_error(e, field_errors)

                log.info(
                    "ERRORS",
                    f"Gradual mode: accepting query despite validation failure [{error_id}]",
                    {"route": request.path},
                )
                return f(*args, query=None, **kwargs)

            except Exception as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.error(
                    "ERRORS",
                    f"Unexpected error in query validation [{error_id}]",
                    {"route": request.path, "error": str(e)},
                )
                return SecureErrorHandler.handle_error(
                    e, context={"function": "validate_query", "schema": schema.__name__}
                )

        return wrapper  # type: ignore

    return decorator
