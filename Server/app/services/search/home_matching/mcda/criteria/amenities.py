"""Amenity overlap vs must_have and preferred_home_features (RESO + text)."""

from __future__ import annotations

from typing import Any

from .user_feature_match import user_feature_need_matches_property


def soft_amenities_normalized(preferences: dict[str, Any], property_dict: dict[str, Any]) -> float:
    must = preferences.get("must_have")
    nice = preferences.get("preferred_home_features")

    must_list = must if isinstance(must, list) else []
    nice_list = nice if isinstance(nice, list) else []

    if not must_list and not nice_list:
        return 0.5

    # Weight must-haves higher so they move match score more than nice-to-haves.
    w_must = 0.78
    w_nice = 0.22
    score = 0.0
    weight_sum = 0.0
    must_hits = 0

    if must_list:
        must_hits = sum(
            1 for n in must_list if user_feature_need_matches_property(property_dict, str(n))
        )
        frac = must_hits / len(must_list)
        score += w_must * frac
        weight_sum += w_must

    if nice_list:
        nice_hits = sum(
            1 for n in nice_list if user_feature_need_matches_property(property_dict, str(n))
        )
        frac = nice_hits / len(nice_list)
        score += w_nice * frac
        weight_sum += w_nice

    if weight_sum <= 0:
        return 0.5

    out = max(0.0, min(1.0, score / weight_sum))
    # Reward full must-have satisfaction when user declared must-haves (boosts ranking).
    if must_list and must_hits == len(must_list):
        out = min(1.0, out + 0.12)
    return out
