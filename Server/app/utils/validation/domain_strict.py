"""Per-domain strict OpenAPI validation rollout (env helpers; decorators are strict-only)."""

import os

# Comma-separated path prefixes, e.g. "/api/v1/auth,/api/v1/login,/api/v1/agent"
_STRICT_PREFIXES_RAW = os.getenv(
    "OPENAPI_VALIDATION_STRICT_DOMAINS",
    "/api/v1/auth,/api/v1/admin/logger-config",
)


def strict_path_prefixes() -> tuple[str, ...]:
    return tuple(p.strip() for p in _STRICT_PREFIXES_RAW.split(",") if p.strip())


def is_strict_for_request_path(path: str, global_mode: str) -> bool:
    if global_mode == "strict":
        return True
    for prefix in strict_path_prefixes():
        if path.startswith(prefix):
            return True
    return False
