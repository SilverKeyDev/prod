"""Defense-in-depth validation at service entry points."""

from typing import Any

from pydantic import BaseModel, ValidationError


def validate_service_payload(schema: type[BaseModel], data: Any) -> BaseModel:
    """Validate a dict or model instance before service logic runs."""
    if isinstance(data, schema):
        return data
    try:
        return schema.model_validate(data)
    except ValidationError as exc:
        raise ValueError(f"Invalid payload: {exc.errors()}") from exc


def assert_preferences_payload_bounds(data: dict[str, Any], *, max_keys: int = 200) -> None:
    if not isinstance(data, dict):
        raise ValueError("preferences payload must be an object")
    if len(data) > max_keys:
        raise ValueError("preferences payload has too many keys")
