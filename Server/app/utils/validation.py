"""
OpenAPI validation decorators for Flask routes.

Provides request and response validation against Pydantic schemas
generated from openapi.yaml. Supports gradual rollout mode.
"""

import os
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

from flask import request
from pydantic import BaseModel, ValidationError

from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, log

# Validation mode: gradual (log + accept) or strict (reject invalid)
VALIDATION_MODE = os.getenv("OPENAPI_VALIDATION_MODE", "gradual")

F = TypeVar("F", bound=Callable[..., Any])


def _coerce_json_body_for_schema(schema: type[BaseModel], json_data: Any) -> dict[str, Any]:
    """
    Normalize legacy JSON bodies so validation receives a dict.

    Some routes historically accepted a raw JSON array while OpenAPI describes an object.
    """
    if json_data is None:
        return {}
    if isinstance(json_data, dict):
        d: dict[str, Any] = dict(json_data)
        name = schema.__name__
        # Google Calendar legacy bodies (OpenAPI uses different field names / nesting).
        if name == "CreateCalendarRequest" and "summary" not in d and "name" in d:
            d = {**d, "summary": d["name"]}
        if name == "AddCalendarACLRequest" and "scope" not in d and d.get("agent_email"):
            d = {
                "role": d.get("role", "writer"),
                "scope": {"type": "user", "value": d["agent_email"]},
            }
        if name == "FreebusyRequest":
            if "items" not in d:
                ids = d.get("calendarIds") or ["primary"]
                d = {**d, "items": [{"id": cid} for cid in ids]}
        if name == "ClientAvailabilityRequest":
            if "start_date" not in d and "timeMin" in d:
                d["start_date"] = d.pop("timeMin")
            if "end_date" not in d and "timeMax" in d:
                d["end_date"] = d.pop("timeMax")
            if "timezone" not in d and "timeZone" in d:
                d["timezone"] = d.pop("timeZone")
        if name == "UpdateTaskChecklistRequest":
            if "data" not in d and "checkedIds" in d:
                raw_ids = d.get("checkedIds")
                if isinstance(raw_ids, list):
                    coerced_ids: list[int] = []
                    for x in raw_ids:
                        if isinstance(x, bool):
                            continue
                        if isinstance(x, int):
                            coerced_ids.append(x)
                        elif isinstance(x, float) and x.is_integer():
                            coerced_ids.append(int(x))
                    return {"data": {"items": [], "checkedIds": coerced_ids}}
        return d
    # Match OpenAPI-generated class names without importing app.schemas (heavy import graph).
    if schema.__name__ == "UpdateChecklistRequest" and isinstance(json_data, list):
        return {"checklist": {"checkedIds": json_data}}
    if schema.__name__ == "BulkUpdateFavoritesRequest" and isinstance(json_data, list):
        return {"favorites": json_data}
    if schema.__name__ in ("AddFeedLikeRequest", "AddCommentRequest") and isinstance(
        json_data, dict
    ):
        out = dict(json_data)
        if "home_id" not in out or out.get("home_id") in (None, ""):
            hid = out.get("homeId") or out.get("home_id")
            if hid is not None:
                out["home_id"] = str(hid).strip() if hid else ""
        return out
    if schema.__name__ == "ClientErrorReport" and isinstance(json_data, dict):
        out = dict(json_data)
        if not out.get("error_message"):
            msg = out.get("message") or out.get("name") or ""
            if not msg and out.get("stack"):
                msg = str(out["stack"])[:2000]
            out["error_message"] = msg if msg else "(no message)"
        if "user_agent" not in out and out.get("userAgent"):
            out["user_agent"] = out["userAgent"]
        return out
    # Non-dict bodies cannot be passed as **kwargs to the schema
    return {}


def validate_request(schema: type[BaseModel]) -> Callable[[F], F]:
    """
    Validate request body against OpenAPI Pydantic schema.

    Modes (via OPENAPI_VALIDATION_MODE env var):
    - gradual: Log validation failures but accept request (default)
    - strict: Reject invalid requests with 400 error

    Args:
        schema: Pydantic model class from app.schemas.generated

    Usage:
        from app.schemas import LoginData

        @auth_bp.route('/login', methods=['POST'])
        @validate_request(LoginData)
        def login(data: LoginData):
            # data is validated Pydantic model
            return handle_login(data.model_dump())
    """

    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                # Get request JSON and validate against schema
                raw = request.get_json(silent=True)
                json_data = _coerce_json_body_for_schema(schema, raw)
                validated_data = schema(**json_data)

                # Pass validated data to route handler
                return f(*args, data=validated_data, **kwargs)

            except ValidationError as e:
                error_id = SecureErrorHandler.generate_error_id()

                # Log detailed validation failure
                log.warn(
                    LOG_CATEGORIES["ERRORS"],
                    f"OpenAPI validation failed [{error_id}]",
                    {
                        "route": request.path,
                        "method": request.method,
                        "schema": schema.__name__,
                        "errors": e.errors(),
                        "mode": VALIDATION_MODE,
                        "error_id": error_id,
                    },
                )

                if VALIDATION_MODE == "strict":
                    # Reject request with structured validation errors
                    field_errors = {}
                    for err in e.errors():
                        # Get field name from error location
                        field = ".".join(str(loc) for loc in err["loc"])
                        field_errors[field] = err["msg"]

                    return SecureErrorHandler.handle_validation_error(e, field_errors)
                else:
                    # Gradual mode: log but continue with None data
                    # Route handler must handle data=None case
                    log.info(
                        LOG_CATEGORIES["ERRORS"],
                        f"Gradual mode: accepting request despite validation failure [{error_id}]",
                        {"route": request.path},
                    )
                    return f(*args, data=None, **kwargs)

            except Exception as e:
                # Unexpected error during validation
                error_id = SecureErrorHandler.generate_error_id()
                log.error(
                    LOG_CATEGORIES["ERRORS"],
                    f"Unexpected error in request validation [{error_id}]",
                    {"route": request.path, "error": str(e)},
                )
                return SecureErrorHandler.handle_error(
                    e, context={"function": "validate_request", "schema": schema.__name__}
                )

        return wrapper  # type: ignore

    return decorator


def validate_response(schema: type[BaseModel]) -> Callable[[F], F]:
    """
    Validate response matches OpenAPI schema.

    Always logs failures but never blocks response (server bug, not client error).
    Useful for detecting schema drift during development/staging.

    Args:
        schema: Pydantic model class from app.schemas.generated

    Usage:
        from app.schemas import AuthResponse

        @auth_bp.route('/login', methods=['POST'])
        @validate_response(AuthResponse)
        def login():
            return {"success": True, "user": {...}}
    """

    def decorator(f: F) -> F:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Execute route handler
            result = f(*args, **kwargs)

            # Extract response data (handle tuples from jsonify)
            if isinstance(result, tuple):
                response_data = result[0]
                status_code = result[1] if len(result) > 1 else 200
            else:
                response_data = result
                status_code = 200
                if hasattr(response_data, "status_code") and response_data.status_code is not None:
                    status_code = int(response_data.status_code)

            # Only validate successful HTTP responses (2xx). Error payloads often differ from the
            # success schema and would produce noisy false positives.
            if status_code < 200 or status_code >= 300:
                return result

            # Try to validate response
            try:
                # Handle Flask Response objects
                if hasattr(response_data, "get_json"):
                    json_data = response_data.get_json()
                elif isinstance(response_data, dict):
                    json_data = response_data
                else:
                    # Can't validate non-JSON responses
                    return result

                # Validate against schema
                schema(**json_data)

                # Validation passed
                return result

            except ValidationError as e:
                error_id = SecureErrorHandler.generate_error_id()

                payload: dict[str, Any] = {
                    "route": request.path,
                    "method": request.method,
                    "schema": schema.__name__,
                    "status_code": status_code,
                    "errors": e.errors(),
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
                # Log response validation failure (server bug!)
                log.error(
                    LOG_CATEGORIES["ERRORS"],
                    f"Response validation failed [{error_id}] - server returned invalid data",
                    payload,
                )

                # Always return response anyway (don't break production)
                # Response validation failure = server bug, not client error
                return result

            except Exception as e:
                # Unexpected error during validation
                error_id = SecureErrorHandler.generate_error_id()
                log.error(
                    LOG_CATEGORIES["ERRORS"],
                    f"Unexpected error in response validation [{error_id}]",
                    {"route": request.path, "error": str(e)},
                )

                # Return response anyway
                return result

        return wrapper  # type: ignore

    return decorator


def has_validation_decorator(func: Callable) -> bool:
    """
    Check if a function has validation decorators applied.

    Used by contract tests to verify all routes have validation.

    Args:
        func: Route handler function

    Returns:
        True if function has @validate_request or @validate_response
    """
    # Check if function has validation wrappers in its closure
    if hasattr(func, "__wrapped__"):
        return has_validation_decorator(func.__wrapped__)

    # Check function name (decorator wrappers retain name via @wraps)
    if hasattr(func, "__name__"):
        # Look for validation decorator markers in closure
        if hasattr(func, "__closure__") and func.__closure__:
            for cell in func.__closure__:
                try:
                    if isinstance(cell.cell_contents, type) and issubclass(
                        cell.cell_contents, BaseModel
                    ):
                        return True
                except (TypeError, AttributeError):
                    continue

    return False
