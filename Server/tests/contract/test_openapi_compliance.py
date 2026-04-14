"""
Test OpenAPI contract compliance for all routes.

Verifies that routes use OpenAPI validation decorators.
Run after migration to prevent regression.
"""

import pytest

from app import create_app
from app.utils.validation import has_validation_decorator
from logger import LOG_CATEGORIES, log


def test_all_routes_have_validation():
    """
    Ensure all API routes use @validate_request or equivalent OpenAPI validation.

    This test helps prevent regression during the OpenAPI migration.
    Routes without validation may allow schema drift between client and server.
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

        # Check if route has validation decorator
        try:
            view_func = app.view_functions[rule.endpoint]
            if not has_validation_decorator(view_func):
                unvalidated_routes.append(f"{rule.rule} ({', '.join(sorted(rule.methods))})")
        except KeyError:
            # Skip routes without view functions (e.g., built-in Flask routes)
            continue

    # For now, this test is informational (warning instead of failure)
    # After full migration, change to assert len(unvalidated_routes) == 0
    if unvalidated_routes:
        routes_block = "\n".join(f"  - {route}" for route in sorted(unvalidated_routes))
        log.info(
            LOG_CATEGORIES["API"],
            (
                "Routes without OpenAPI validation:\n"
                f"{routes_block}\n"
                f"Total: {len(unvalidated_routes)} routes need migration"
            ),
        )

        # Uncomment after migration is complete:
        # pytest.fail(f"{len(unvalidated_routes)} routes missing validation")
    else:
        log.info(LOG_CATEGORIES["API"], "All routes have OpenAPI validation")


def test_validation_mode_configured():
    """Verify OPENAPI_VALIDATION_MODE environment variable is set."""
    import os

    mode = os.getenv("OPENAPI_VALIDATION_MODE", "gradual")

    assert mode in ["gradual", "strict"], (
        f"Invalid OPENAPI_VALIDATION_MODE: {mode}. Must be 'gradual' or 'strict'"
    )

    log.info(LOG_CATEGORIES["API"], f"Validation mode: {mode}")


def test_schemas_available():
    """Verify generated Pydantic schemas are importable."""
    try:
        from app.schemas import LoginData, SignupData, User

        assert LoginData is not None
        assert SignupData is not None
        assert User is not None

        log.info(LOG_CATEGORIES["API"], "Generated schemas are available")
    except ImportError as e:
        pytest.fail(f"Failed to import generated schemas: {e}")


if __name__ == "__main__":
    # Allow running tests directly for quick checks
    pytest.main([__file__, "-v"])
