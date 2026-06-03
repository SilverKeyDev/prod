"""Tests for canonical housing keys on aggregated preferences."""

from app.services.aggregation.preferences_aggregation import apply_canonical_housing_preference_keys


def test_mirrors_bathrooms_from_min() -> None:
    out: dict = {"preferred_bedrooms_min": 2, "preferred_bathrooms_min": 1}
    apply_canonical_housing_preference_keys(out)
    assert "preferred_bedrooms" not in out
    assert out["preferred_bathrooms"] == 1


def test_does_not_emit_preferred_bedrooms_from_min() -> None:
    out: dict = {"preferred_bedrooms": 4, "preferred_bedrooms_min": 2}
    apply_canonical_housing_preference_keys(out)
    assert out["preferred_bedrooms"] == 4


def test_mirrors_preferred_housing_type_from_housing_type() -> None:
    out: dict = {"housing_type": "house,townhome"}
    apply_canonical_housing_preference_keys(out)
    assert out["preferred_housing_type"] == "house,townhome"


def test_skips_empty_housing_type() -> None:
    out: dict = {"housing_type": "  "}
    apply_canonical_housing_preference_keys(out)
    assert "preferred_housing_type" not in out
