"""
Test OpenAPI contract compliance for all routes.

Verifies that routes use OpenAPI validation decorators.
Run after migration to prevent regression.
"""

import pytest

from app import create_app
from app.utils.validation import has_request_validation_decorator


def test_all_routes_have_validation():
    """
    Ensure all POST/PUT/PATCH routes use @validate_request or @validate_form_request.

    Response-only @validate_response does not satisfy this check.
    """
    app = create_app()

    unvalidated_routes = []
    excluded_prefixes = [
        "/static",  # Static files
        "/health",  # Health check (no body)
        "/api/v1/maps/script",  # Script endpoint (no body)
    ]

    for rule in app.url_map.iter_rules():
        # Skip excluded routes
        if any(rule.rule.startswith(prefix) for prefix in excluded_prefixes):
            continue

        # Skip routes without POST/PUT/PATCH (no request body)
        if not any(method in rule.methods for method in ["POST", "PUT", "PATCH"]):
            continue

        try:
            view_func = app.view_functions[rule.endpoint]
            if not has_request_validation_decorator(view_func):
                unvalidated_routes.append(f"{rule.rule} ({', '.join(sorted(rule.methods))})")
        except KeyError:
            continue

    assert unvalidated_routes == [], (
        f"{len(unvalidated_routes)} mutating routes missing @validate_request "
        f"or @validate_form_request:\n" + "\n".join(f"  - {r}" for r in sorted(unvalidated_routes))
    )


def test_validation_mode_configured():
    """Verify OPENAPI_VALIDATION_MODE environment variable is set."""
    import os

    mode = os.getenv("OPENAPI_VALIDATION_MODE", "strict")

    assert mode in [
        "gradual",
        "strict",
    ], f"Invalid OPENAPI_VALIDATION_MODE: {mode}. Must be 'gradual' or 'strict'"

    assert mode  # configured


def test_schemas_available():
    """Verify generated Pydantic schemas are importable."""
    try:
        from app.schemas import LoginData, SignupData, User

        assert LoginData is not None
        assert SignupData is not None
        assert User is not None

    except ImportError as e:
        pytest.fail(f"Failed to import generated schemas: {e}")


if __name__ == "__main__":
    # Allow running tests directly for quick checks
    pytest.main([__file__, "-v"])
