"""Chart type selection for research PDF sections."""

from io import BytesIO
from typing import Any

from app.services.graphics import (
    generate_horizontal_bar_chart,
    generate_vertical_lollipop_chart,
)

CHARTABLE_FIELDS = {
    "demographics",
    "income_distribution",
    "education_levels",
    "employment_stats",
    "safety_metrics",
    "transportation_usage",
}

CHARTABLE_STR_VALUES = [
    "high",
    "medium",
    "low",
    "very high",
    "very low",
    "moderate",
    "popular",
    "very popular",
    "unpopular",
]


def _format_field_title(key: str) -> str:
    return key.replace("_", " ").title()


def _is_chartable_value(val: Any) -> bool:
    """Return True if value is suitable for charting (numeric, percentage, rating, categorical)."""
    if val is None:
        return False
    if isinstance(val, int | float):
        return True
    if not isinstance(val, str):
        return False
    val_stripped = val.strip()
    if not val_stripped:
        return False
    if val_stripped.endswith("%") and val_stripped[:-1].replace(".", "").isdigit():
        return True
    if "/" in val_stripped and val_stripped.split("/")[0].replace(".", "").isdigit():
        return True
    if val_stripped.lower() in CHARTABLE_STR_VALUES:
        return True
    if any(c in val_stripped for c in ["$", "-", "/", " to ", " and ", "month", "year", "per"]):
        return False
    return False


def _age_distribution_chart_data(raw: dict) -> dict[str, str]:
    chart_data: dict[str, str] = {}
    for field_name, value in raw.items():
        if field_name.startswith("age_"):
            display_name = field_name.replace("age_", "").replace("_plus", "+").replace("_", "-")
            chart_data[display_name] = f"{value}%"
        else:
            chart_data[field_name] = f"{value}%"
    return chart_data


def chart_data_from_value(key: str, value: Any) -> tuple[BytesIO | None, str]:
    """Build (chart_buffer, chart_type) for known chart fields; (None, '') otherwise."""
    k = key.lower()
    title = _format_field_title(key)

    if hasattr(value, "with_percent") and callable(getattr(value, "with_percent", None)):
        chart_data = value.with_percent()
        data_as_dict: dict[str, Any] = chart_data if isinstance(chart_data, dict) else {}
        if k == "lifestyle_dna":
            buffer = generate_horizontal_bar_chart(data_as_dict, title)
            return (buffer, "Lifestyle DNA Bar Chart")
        if k == "age_distribution":
            buffer = generate_vertical_lollipop_chart(data_as_dict, title)
            return (buffer, "Age Distribution Chart")
        return (None, "")

    if not isinstance(value, dict):
        return (None, "")

    if k == "lifestyle_dna":
        chart_data = {fn: f"{val}%" for fn, val in value.items()}
        buffer = generate_horizontal_bar_chart(chart_data, title)
        return (buffer, "Lifestyle DNA Bar Chart")

    if k == "age_distribution":
        chart_data = _age_distribution_chart_data(value)
        buffer = generate_vertical_lollipop_chart(chart_data, title)
        return (buffer, "Age Distribution Chart")

    if k in CHARTABLE_FIELDS:
        total = len(value)
        chartable_count = sum(1 for val in value.values() if _is_chartable_value(val))
        if total > 0 and chartable_count >= (total * 0.5):
            buffer = generate_horizontal_bar_chart(value, title)
            return (buffer, "Data Chart")

    return (None, "")
