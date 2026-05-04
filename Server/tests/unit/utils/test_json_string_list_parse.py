"""Tests for JSON/CSV string-list parsing used on user id columns."""

import json

from app.utils.json_string_list_parse import parse_json_or_csv_string_list


def test_parse_none_or_empty():
    assert parse_json_or_csv_string_list(None) == []
    assert parse_json_or_csv_string_list("") == []
    assert parse_json_or_csv_string_list("   ") == []


def test_parse_python_list_strip():
    assert parse_json_or_csv_string_list([" x ", "", None, "y"]) == ["x", "y"]
    assert parse_json_or_csv_string_list([]) == []


def test_parse_json_array():
    payload = json.dumps(["a", " b ", "", "c"])
    assert parse_json_or_csv_string_list(payload) == ["a", "b", "c"]


def test_parse_csv_fallback():
    assert parse_json_or_csv_string_list("u1,u2 , u3") == ["u1", "u2", "u3"]


def test_invalid_json_fallback_to_csv():
    assert parse_json_or_csv_string_list("id1,id2") == ["id1", "id2"]
