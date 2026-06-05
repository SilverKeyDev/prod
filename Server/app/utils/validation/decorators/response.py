"""OpenAPI response validation decorator."""

from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

from flask import request
from pydantic import BaseModel, ValidationError

from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation.helpers import sanitize_validation_errors_for_log
from logger import log

F = TypeVar("F", bound=Callable[..., Any])


def validate_response(schema: type[BaseModel]) -> Callable[[F], F]:
    """
    Validate response matches OpenAPI schema.

    Always logs failures but never blocks response (server bug, not client error).
    """

    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            result = f(*args, **kwargs)

            if isinstance(result, tuple):
                response_data = result[0]
                status_code = result[1] if len(result) > 1 else 200
            else:
                response_data = result
                status_code = 200
                if hasattr(response_data, "status_code") and response_data.status_code is not None:
                    status_code = int(response_data.status_code)

            if status_code < 200 or status_code >= 300:
                return result

            try:
                if hasattr(response_data, "get_json"):
                    json_data = response_data.get_json()
                elif isinstance(response_data, dict):
                    json_data = response_data
                else:
                    return result

                schema(**json_data)
                return result

            except ValidationError as e:
                error_id = SecureErrorHandler.generate_error_id()

                payload: dict[str, Any] = {
                    "route": request.path,
                    "method": request.method,
                    "schema": schema.__name__,
                    "status_code": status_code,
                    "errors": sanitize_validation_errors_for_log(e.errors()),
                    "error_id": error_id,
                }
                if schema.__name__ == "SearchByPolygonResponse" and isinstance(json_data, dict):
                    props = json_data.get("properties")
                    if isinstance(props, list) and props and isinstance(props[0], dict):
                        payload["first_property_keys_sample"] = sorted(props[0].keys())[:24]
                    payload["contract_hint"] = (
                        "SearchByPolygonResponse items must match PropertySearchResult "
                        "(id, essentials, location). Legacy flat rows (zpid, latitude, …) "
                        "fail validation and can leave the client without normalized coords."
                    )
                log.error(
                    "ERRORS",
                    f"Response validation failed [{error_id}] - server returned invalid data",
                    payload,
                )
                return result

            except Exception as e:
                error_id = SecureErrorHandler.generate_error_id()
                log.error(
                    "ERRORS",
                    f"Unexpected error in response validation [{error_id}]",
                    {"route": request.path, "error": str(e)},
                )
                return result

        return wrapper  # type: ignore

    return decorator
