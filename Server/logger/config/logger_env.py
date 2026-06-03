"""Logger environment helpers."""

import os


def is_logger_production() -> bool:
    return os.getenv("FLASK_ENV") == "production"


def is_logger_verbose_dev() -> bool:
    return (os.getenv("LOGGER_VERBOSE") or "").strip() == "1"


def parse_dev_category_overrides() -> list[str]:
    raw = (os.getenv("LOGGER_CATEGORIES") or "").strip()
    if not raw:
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def should_export_logs_to_posthog() -> bool:
    if is_logger_production():
        return True
    return (os.getenv("LOGGER_POSTHOG") or "").strip() == "1"
