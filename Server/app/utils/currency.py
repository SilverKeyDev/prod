import re
from typing import Any


def format_currency(value: Any) -> str:
    """Format a numeric or string value as a USD currency string.

    Examples:
        1234567 -> "$1,234,567"
        1234567.89 -> "$1,234,567.89"
        "$1,234,567" -> "$1,234,567"

    Returns empty string for falsy or unparsable values.
    """
    if value in (None, ""):
        return ""

    try:
        if isinstance(value, int | float):
            number = float(value)
        else:
            cleaned = re.sub(r"[^\d.]", "", str(value))
            if cleaned == "":
                return ""
            number = float(cleaned)

        # Show decimals only if non-zero
        if number.is_integer():
            return f"${int(number):,}"
        return f"${number:,.2f}"
    except Exception:
        return ""
