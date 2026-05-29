"""Parse dot-notation and legacy log category inputs."""

from __future__ import annotations

from dataclasses import dataclass

from .categories import LOG_CATEGORIES, LOG_PATHS, LogCategory


@dataclass(frozen=True)
class ParsedLogPath:
    path: str
    category: LogCategory
    subcategory: str | None
    category_label: str


_LOG_PATH_SET = frozenset(LOG_PATHS)
_API_SUBCATEGORIES = frozenset(
    path.split(".", 1)[1] for path in LOG_PATHS if path.startswith("API.")
)


def _snake_to_camel(name: str) -> str:
    parts = name.lower().split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def parse_log_path(value: LogCategory | str) -> ParsedLogPath:
    if isinstance(value, LogCategory):
        label = value.value
        return ParsedLogPath(
            path=label,
            category=value,
            subcategory=None,
            category_label=label,
        )

    normalized = value.strip()
    if not normalized:
        raise ValueError("Log path must be a non-empty string")

    if normalized in _LOG_PATH_SET:
        if "." not in normalized:
            category = LogCategory(normalized)
            return ParsedLogPath(
                path=normalized,
                category=category,
                subcategory=None,
                category_label=normalized,
            )

        category_part, sub_part = normalized.split(".", 1)
        category = LogCategory(category_part)
        return ParsedLogPath(
            path=normalized,
            category=category,
            subcategory=sub_part,
            category_label=normalized,
        )

    if "." in normalized:
        category_part, sub_part = normalized.split(".", 1)
        if category_part == LogCategory.API.value and sub_part in _API_SUBCATEGORIES:
            category = LogCategory.API
            return ParsedLogPath(
                path=normalized,
                category=category,
                subcategory=sub_part,
                category_label=normalized,
            )

    if normalized in LOG_CATEGORIES:
        category = LogCategory(normalized)
        return ParsedLogPath(
            path=normalized,
            category=category,
            subcategory=None,
            category_label=normalized,
        )

    _snake_to_camel(normalized)
    raise ValueError(f"Unknown log path: {normalized}")
