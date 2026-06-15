"""
OpenAPI validation decorators for Flask routes.

Provides request and response validation against Pydantic schemas
generated from openapi.yaml. Supports gradual rollout mode.
"""

from app.utils.validation.domain_strict import is_strict_for_request_path

from .introspection import has_request_validation_decorator, has_validation_decorator
from .query import validate_query
from .request import validate_form_request, validate_request
from .response import validate_response
from .shared import (
    OPENAPI_VALIDATE_FORM_ATTR,
    OPENAPI_VALIDATE_REQUEST_ATTR,
    VALIDATION_MODE,
    _coerce_json_body_for_schema,
    coerce_json_body_for_schema,
)

__all__ = [
    "OPENAPI_VALIDATE_FORM_ATTR",
    "OPENAPI_VALIDATE_REQUEST_ATTR",
    "VALIDATION_MODE",
    "is_strict_for_request_path",
    "_coerce_json_body_for_schema",
    "coerce_json_body_for_schema",
    "has_request_validation_decorator",
    "has_validation_decorator",
    "validate_form_request",
    "validate_query",
    "validate_request",
    "validate_response",
]
