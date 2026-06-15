"""
Match profile feature keys (must_have / preferred_home_features) to listing data.

Uses RESO-style fields when present, then a searchable text blob (facts + description).
"""

from __future__ import annotations

import re
from typing import Any

# Canonical keys from Client MUST_HAVE_OPTIONS (value field) and similar.
_MUST_HAVE_SYNONYMS: dict[str, tuple[str, ...]] = {
    "basement": ("basement", "cellar", "walkout", "daylight basement", "finished lower"),
    "single_story": (
        "single story",
        "single-story",
        "one story",
        "one-story",
        "1 story",
        "one level",
        "ranch",
        "rambler",
        "bungalow",
    ),
    "garage": (
        "garage",
        "attached garage",
        "detached garage",
        "parking garage",
        "carport",
        "garage parking",
    ),
    "ac": (
        "air conditioning",
        "air conditioned",
        "central air",
        "central a/c",
        "a/c",
        "cooling",
        "hvac",
    ),
    "heating": (
        "heating",
        "forced air",
        "heat pump",
        "radiant",
        "furnace",
        "baseboard heat",
        "natural gas heat",
    ),
    "pool": (
        "pool",
        "in-ground pool",
        "inground pool",
        "swimming pool",
        "private pool",
        "spa",
    ),
    "waterfront": (
        "waterfront",
        "water front",
        "lakefront",
        "lake front",
        "riverfront",
        "oceanfront",
        "dock",
        "water view",
        "waterview",
    ),
    "fenced_in_backyard": (
        "fenced backyard",
        "fenced back yard",
        "fenced-in backyard",
        "fenced in backyard",
        "fenced yard",
        "fully fenced",
        "privacy fence",
        "private fenced",
        "backyard fence",
        "back yard fence",
    ),
    "fenced_backyard": (
        "fenced backyard",
        "fenced back yard",
        "fenced-in backyard",
        "fenced in backyard",
        "fenced yard",
        "fully fenced",
        "privacy fence",
        "private fenced",
    ),
    "fenced_yard": (
        "fenced yard",
        "fenced backyard",
        "fenced back yard",
        "fully fenced",
        "privacy fence",
        "private fenced",
    ),
}


def _normalize_need_key(need: str) -> str:
    return re.sub(r"\s+", "_", str(need).strip().lower().replace("-", "_"))


def _flatten_values(obj: Any) -> list[str]:
    if obj is None:
        return []
    if isinstance(obj, dict):
        out: list[str] = []
        for v in obj.values():
            out.extend(_flatten_values(v))
        return out
    if isinstance(obj, list):
        out = []
        for x in obj:
            out.extend(_flatten_values(x))
        return out
    return [str(obj)]


def _flatten_dict_keys_and_values(block: dict[str, Any]) -> list[str]:
    """Include dict keys and values so features like {\"garage\": \"2-car\"} match garage."""
    parts: list[str] = []
    for k, v in block.items():
        if k is not None and str(k).strip():
            parts.append(str(k))
        parts.extend(_flatten_values(v))
    return parts


def _feature_dict_value_truthy(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, int | float):
        return value > 0
    if isinstance(value, str):
        s = value.strip().lower()
        if not s:
            return False
        return s not in ("no", "none", "false", "0", "n/a", "na")
    if isinstance(value, list | dict):
        return len(value) > 0
    return True


def _features_dict_key_match(prop: dict[str, Any], key: str) -> bool | None:
    """
    True when prop[\"features\"] (or homeFacts) has a truthy entry for a known need key.
    None when no feature dict is present.
    """
    for container_key in ("features", "homeFacts"):
        block = prop.get(container_key)
        if not isinstance(block, dict):
            continue
        for raw_k, raw_v in block.items():
            if _normalize_need_key(str(raw_k)) != key:
                continue
            if _feature_dict_value_truthy(raw_v):
                return True
            return False
    return None


def _reso_facts(prop: dict[str, Any]) -> dict[str, Any]:
    rf = prop.get("resoFacts")
    return rf if isinstance(rf, dict) else {}


def _as_int(v: Any) -> int | None:
    if v is None:
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _collect_property_feature_text(prop: dict[str, Any]) -> tuple[str, str]:
    """Lowerercase spaced blob and space-stripped compact blob for substring checks."""
    parts: list[str] = []

    desc = prop.get("description")
    if desc:
        parts.append(str(desc).lower())

    for key in ("listingType", "listing_type", "homeStatus", "home_type", "propertyType"):
        v = prop.get(key)
        if v is not None:
            parts.append(str(v).lower())

    for container_key in ("homeFacts", "resoFacts", "features"):
        block = prop.get(container_key)
        if isinstance(block, dict):
            parts.extend(x.lower() for x in _flatten_dict_keys_and_values(block) if x)
        elif isinstance(block, list):
            parts.extend(str(x).lower() for x in block if x)
        elif block is not None:
            parts.append(str(block).lower())

    att = prop.get("attributionInfo")
    if isinstance(att, dict):
        for v in att.values():
            if v is not None:
                parts.append(str(v).lower())

    spaced = " ".join(parts)
    compact = re.sub(r"\s+", "", spaced)
    return spaced, compact


def _phrase_in_blob(phrase: str, spaced: str, compact: str) -> bool:
    p = phrase.lower().strip()
    if len(p) < 2:
        return False
    if p in spaced:
        return True
    if p.replace(" ", "") in compact:
        return True
    return False


def _structured_signal(key: str, rf: dict[str, Any], prop: dict[str, Any]) -> bool | None:
    """
    True = listing clearly has the feature.
    False = listing clearly lacks it (only when explicit in RESO).
    None = inconclusive; fall back to text blob.
    """
    if key == "garage":
        if (_as_int(rf.get("garageParkingCapacity")) or 0) > 0:
            return True
        if rf.get("hasAttachedGarage") is True:
            return True
        pf = rf.get("parkingFeatures")
        if isinstance(pf, list) and any("garage" in str(x).lower() for x in pf):
            return True
        if isinstance(pf, str) and "garage" in pf.lower():
            return True
        feat = _features_dict_key_match(prop, key)
        if feat is not None:
            return feat
        return None

    if key == "basement":
        b = rf.get("basement")
        if not b:
            feat = _features_dict_key_match(prop, key)
            if feat is not None:
                return feat
            return None
        bs = str(b).lower()
        if re.search(r"\bnone\b|\bno basement\b", bs):
            return False
        return True

    if key == "pool":
        if rf.get("hasPrivatePool") is True:
            return True
        pf = rf.get("poolFeatures")
        if isinstance(pf, list) and len(pf) > 0:
            return True
        if isinstance(pf, str) and pf.strip():
            return True
        feat = _features_dict_key_match(prop, key)
        if feat is not None:
            return feat
        return None

    if key == "waterfront":
        if prop.get("waterView") is True:
            return True
        if rf.get("waterViewYN") is True:
            return True
        wf = rf.get("waterfrontFeatures")
        if isinstance(wf, list) and len(wf) > 0:
            return True
        if isinstance(wf, str) and wf.strip():
            return True
        feat = _features_dict_key_match(prop, key)
        if feat is not None:
            return feat
        return None

    if key == "ac":
        if rf.get("hasCooling") is True:
            return True
        cl = rf.get("cooling")
        if isinstance(cl, list) and len(cl) > 0:
            return True
        if isinstance(cl, str) and cl.strip():
            return True
        feat = _features_dict_key_match(prop, key)
        if feat is not None:
            return feat
        return None

    if key == "heating":
        if rf.get("hasHeating") is True:
            return True
        ht = rf.get("heating")
        if isinstance(ht, list) and len(ht) > 0:
            return True
        if isinstance(ht, str) and ht.strip():
            return True
        feat = _features_dict_key_match(prop, key)
        if feat is not None:
            return feat
        return None

    if key == "single_story":
        for fld in ("stories", "levels", "storiesTotal"):
            n = _as_int(rf.get(fld))
            if n is not None:
                return n <= 1
        st = rf.get("structureType")
        if isinstance(st, str):
            sl = st.lower()
            if any(
                x in sl
                for x in (
                    "one story",
                    "1 story",
                    "single story",
                    "ranch",
                    "bungalow",
                )
            ):
                return True
        return None

    feat = _features_dict_key_match(prop, key)
    if feat is not None:
        return feat
    return None


def user_feature_need_matches_property(prop: dict[str, Any], need_raw: str) -> bool:
    """
    Whether a single user feature key (e.g. garage, ac) appears to be present on the listing.

    Unknown / empty listing data: returns False (does not count as a match for scoring/filtering).
    """
    key = _normalize_need_key(need_raw)
    if not key:
        return False

    rf = _reso_facts(prop)
    structured = _structured_signal(key, rf, prop)
    if structured is True:
        return True
    if structured is False:
        return False

    spaced, compact = _collect_property_feature_text(prop)
    if not spaced.strip():
        return False

    for phrase in _MUST_HAVE_SYNONYMS.get(key, (key.replace("_", " "),)):
        if _phrase_in_blob(phrase, spaced, compact):
            return True

    return False


def listing_satisfies_all_must_haves(prop: dict[str, Any], must_have: list[str]) -> bool:
    """All must-have keys must match (AND). Empty must_have list => True."""
    if not must_have:
        return True
    return all(user_feature_need_matches_property(prop, m) for m in must_have)
