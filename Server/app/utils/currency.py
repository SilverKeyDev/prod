import re
from typing import Any


def _strip_to_number(raw: str) -> str:
    """Remove currency symbols, commas, spaces, and other non-numeric chars.

    Handles '.' used as a thousands separator (common in European locales):
    - Multiple dots (e.g. "1.234.567"): all are thousands separators → strip.
    - Single dot followed by exactly 3 digits at the end (e.g. "350.000"):
      almost certainly a thousands separator for currency → strip.
    - Otherwise a single dot is kept as a decimal point.
    """
    cleaned = re.sub(r"[^\d.]", "", raw)
    if cleaned == "":
        return ""
    dot_count = cleaned.count(".")
    if dot_count > 1:
        cleaned = cleaned.replace(".", "")
    elif dot_count == 1 and re.fullmatch(r"\d+\.\d{3}", cleaned):
        cleaned = cleaned.replace(".", "")
    return cleaned


def format_currency(value: Any) -> str:
    """Format a numeric or string value as a USD currency string.

    Examples:
        1234567 -> "$1,234,567"
        1234567.89 -> "$1,234,567.89"
        "$1,234,567" -> "$1,234,567"
        "350.000"   -> "$350,000"   (European thousands separator)
        "1.234.567" -> "$1,234,567" (multiple European dots)

    Returns empty string for falsy or unparsable values.
    """
    if value in (None, ""):
        return ""

    try:
        if isinstance(value, int | float):
            number = float(value)
        else:
            cleaned = _strip_to_number(str(value))
            if cleaned == "":
                return ""
            number = float(cleaned)

        if number.is_integer():
            return f"${int(number):,}"
        return f"${number:,.2f}"
    except Exception:
        return ""


def resolve_price(home: dict[str, Any]) -> Any:
    """Pick the best available price value from a property dict.

    Mirrors the client-side fallback chain in formatPropertySearchListingPrice:
    unformattedPrice > unformatted_price > price > listPrice > list_price > listing_price.
    Skips values that are falsy or zero so a real price in a fallback field wins.
    """
    for key in (
        "unformattedPrice",
        "unformatted_price",
        "price",
        "listPrice",
        "list_price",
        "listing_price",
    ):
        val = home.get(key)
        if val is None:
            continue
        if isinstance(val, int | float) and val == 0:
            continue
        if isinstance(val, str) and val.strip() in ("", "$0", "0"):
            continue
        return val
    return home.get("price", "")
