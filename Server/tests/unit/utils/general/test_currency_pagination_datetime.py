"""Tests for currency formatting, pagination helpers, and UTC datetime serialization."""

from datetime import datetime, timezone

from app.utils.format.currency import format_currency, resolve_price
from app.utils.format.datetime import to_aware_utc_iso
from app.utils.http.pagination import (
    build_pagination,
    clamp_page,
    clamp_per_page,
    parse_query_pagination_args,
)


def test_format_currency_int_and_float():
    assert format_currency(1234567) == "$1,234,567"
    assert format_currency(1234567.89) == "$1,234,567.89"


def test_format_currency_string_usd_and_european_thousands():
    assert format_currency("$1,234,567") == "$1,234,567"
    assert format_currency("350.000") == "$350,000"
    assert format_currency("1.234.567") == "$1,234,567"


def test_format_currency_empty_and_unparsable():
    assert format_currency(None) == ""
    assert format_currency("") == ""
    assert format_currency("nope") == ""


def test_resolve_price_prefers_first_nonzero():
    home = {"price": 0, "listPrice": 100, "unformattedPrice": 200}
    assert resolve_price(home) == 200

    home2 = {"listing_price": " 500000 "}
    assert resolve_price(home2) == " 500000 "

    home3 = {"price": ""}
    assert resolve_price(home3) == ""


def test_clamp_per_page_and_page():
    assert clamp_per_page(0) == 1
    assert clamp_per_page(500, maximum=100) == 100
    assert clamp_page(0) == 1


def test_build_pagination_edges():
    meta = build_pagination(page=1, per_page=10, total=25)
    assert meta["total_pages"] == 3
    assert meta["has_next"] is True
    assert meta["next_page"] == 2

    meta2 = build_pagination(page=3, per_page=10, total=25)
    assert meta2["has_next"] is False
    assert meta2["next_page"] is None

    empty = build_pagination(page=1, per_page=20, total=0)
    assert empty["total_pages"] == 0
    assert empty["has_next"] is False


def test_parse_query_pagination_args():
    assert parse_query_pagination_args({"page": "2", "per_page": "5"}) == (2, 5)
    assert parse_query_pagination_args({"limit": "15", "offset": "30"}) == (3, 15)
    assert parse_query_pagination_args({}, default_per_page=50) == (1, 50)
    assert parse_query_pagination_args({}) == (1, 20)


def test_to_aware_utc_iso():
    assert to_aware_utc_iso(None) is None
    naive = datetime(2024, 1, 2, 3, 4, 5)
    out = to_aware_utc_iso(naive)
    assert out is not None
    assert "+00:00" in out or "Z" in out.replace("z", "Z")

    aware = datetime(2024, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    assert to_aware_utc_iso(aware) == aware.isoformat()
