"""Must-have features post-filter for polygon search."""

from app.services.search.home_matching.mcda.criteria.user_feature_match import (
    listing_satisfies_all_must_haves,
)
from logger import LOG_CATEGORIES, log

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]


def apply_must_have_filter(
    all_properties: list,
    must_have: list,
    request_id: str,
    log_fn,
    strict_preference_filter: bool = False,
) -> list:
    """Apply must-have features filter (ALL must match).

    When strict_preference_filter is False, skip this filter entirely.
    """
    if not isinstance(must_have, list) or len(must_have) == 0:
        return all_properties

    # Skip must_have filter when not in strict mode
    if not strict_preference_filter:
        log_fn(
            request_id,
            "must_have",
            len(all_properties),
            len(all_properties),
            {
                "must_have_count": len(must_have),
                "skipped_non_strict": True,
            },
        )
        return all_properties

    _before_mh = len(all_properties)
    empty_facts = 0

    def _property_matches_must_have(prop):
        """Check if property matches must_have, treating empty facts as a match (benefit of doubt)."""
        facts = prop.get("homeFacts") or prop.get("features") or prop.get("resoFacts") or {}
        if isinstance(facts, dict):
            fs = " ".join(str(v).lower() for v in facts.values() if v)
        elif isinstance(facts, list):
            fs = " ".join(str(x).lower() for x in facts)
        else:
            fs = str(facts).lower()

        # If no facts available, KEEP the property (can't prove it doesn't have the feature)
        if not fs.strip():
            nonlocal empty_facts
            empty_facts += 1
            return True

        # If facts are available, check if must_have features match
        return listing_satisfies_all_must_haves(prop, must_have)

    all_properties = [p for p in all_properties if _property_matches_must_have(p)]
    log_fn(
        request_id,
        "must_have",
        _before_mh,
        len(all_properties),
        {"must_have_count": len(must_have)},
    )
    if len(all_properties) == 0 and _before_mh > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (must_have)",
            {
                "request_id": request_id,
                "before": _before_mh,
                "must_have_count": len(must_have),
                "props_with_empty_facts": empty_facts,
            },
        )
    return all_properties
