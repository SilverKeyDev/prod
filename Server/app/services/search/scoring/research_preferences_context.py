"""
Resolve whose preferences power property research / pros-cons, analysis counts,
and cache signatures (agent + selected client vs self).
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Literal

from app.services.agent.client_service import agent_may_access_client
from app.services.aggregation import get_preferences_dict_optional
from app.services.auth.user_role_helpers import user_is_agent

ProfileSubject = Literal["self", "client"]
BulletStyle = Literal["short", "medium", "long"]


@dataclass(frozen=True)
class ResearchAnalysisOptions:
    """Resolved options for one property research / streaming request."""

    preferences_user_id: str
    profile_subject: ProfileSubject
    viewer_is_agent: bool
    pros_count: int
    cons_count: int
    bullet_style: BulletStyle
    cache_signature: str
    preferences: dict[str, Any]


def _clamp_int(value: Any, lo: int, hi: int, default: int) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, n))


def _detail_level_from_prefs(prefs: dict[str, Any] | None) -> str | None:
    if not prefs:
        return None
    raw = prefs.get("information_detail_level")
    if raw is None:
        return None
    s = str(raw).strip().lower()
    if s in ("low", "brief", "minimal", "compact"):
        return "compact"
    if s in ("high", "verbose", "detailed", "maximum"):
        return "detailed"
    if s in ("medium", "standard", "normal", "default"):
        return "standard"
    return None


def _counts_from_detail_level(level: str) -> tuple[int, int, BulletStyle]:
    if level == "compact":
        return 2, 2, "short"
    if level == "detailed":
        return 5, 5, "long"
    return 3, 3, "medium"


def parse_research_request_body(body: dict[str, Any] | None) -> dict[str, Any]:
    """Extract optional research tuning fields from JSON body."""
    if not body or not isinstance(body, dict):
        return {}
    return {
        "preferences_user_id": body.get("preferences_user_id"),
        "pros_count": body.get("pros_count"),
        "cons_count": body.get("cons_count"),
        "detail_level": body.get("detail_level"),
    }


def resolve_preferences_user_id_for_research(
    user: Any, requested_id: str | None
) -> tuple[str | None, dict[str, Any] | None]:
    """
    Determine which user's preference row to load.

    Returns:
        (resolved_user_id, None) on success
        (None, error_payload) on authorization failure (agent only)
    """
    uid = str(user.id)
    if not requested_id or str(requested_id).strip() == "" or str(requested_id) == uid:
        return uid, None

    if not user_is_agent(user):
        # Buyers: ignore other users' ids (no privilege escalation probe)
        return uid, None

    target = str(requested_id).strip()
    if not agent_may_access_client(uid, target):
        return None, {
            "success": False,
            "error": "FORBIDDEN",
            "message": "Access denied: User is not your client",
        }

    return target, None


def merge_pros_cons_counts(
    body: dict[str, Any],
    prefs: dict[str, Any] | None,
) -> tuple[int, int, BulletStyle]:
    """Resolve pros/cons list lengths and bullet verbosity from body + stored prefs."""
    dl_body = body.get("detail_level")
    if isinstance(dl_body, str) and dl_body.strip():
        lv = dl_body.strip().lower()
        if lv in ("compact", "standard", "detailed"):
            pros, cons, style = _counts_from_detail_level(lv)
        else:
            pros, cons, style = _counts_from_detail_level("standard")
    else:
        dl = _detail_level_from_prefs(prefs) or "standard"
        pros, cons, style = _counts_from_detail_level(dl)

    pros = _clamp_int(body.get("pros_count"), 1, 6, pros)
    cons = _clamp_int(body.get("cons_count"), 1, 6, cons)
    return pros, cons, style


def compute_analysis_cache_signature(
    preferences_user_id: str,
    profile_subject: ProfileSubject,
    viewer_is_agent: bool,
    pros_count: int,
    cons_count: int,
    bullet_style: BulletStyle,
) -> str:
    payload = json.dumps(
        {
            "preferences_user_id": preferences_user_id,
            "profile_subject": profile_subject,
            "viewer_is_agent": viewer_is_agent,
            "pros_count": pros_count,
            "cons_count": cons_count,
            "bullet_style": bullet_style,
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()[:40]


def build_research_analysis_options(
    user: Any,
    body: dict[str, Any] | None,
) -> tuple[ResearchAnalysisOptions | None, dict[str, Any] | None]:
    """
    Build fully resolved analysis options for the current request.

    Returns (options, None) or (None, error_payload).
    """
    parsed = parse_research_request_body(body)
    resolved_id, err = resolve_preferences_user_id_for_research(
        user, parsed.get("preferences_user_id")
    )
    if err is not None:
        return None, err
    assert resolved_id is not None

    prefs = get_preferences_dict_optional(resolved_id)
    if not prefs:
        prefs = {}

    viewer_is_agent = user_is_agent(user)
    profile_subject: ProfileSubject = "client" if resolved_id != str(user.id) else "self"

    pros_count, cons_count, bullet_style = merge_pros_cons_counts(parsed, prefs)
    sig = compute_analysis_cache_signature(
        resolved_id,
        profile_subject,
        viewer_is_agent,
        pros_count,
        cons_count,
        bullet_style,
    )

    return (
        ResearchAnalysisOptions(
            preferences_user_id=resolved_id,
            profile_subject=profile_subject,
            viewer_is_agent=viewer_is_agent,
            pros_count=pros_count,
            cons_count=cons_count,
            bullet_style=bullet_style,
            cache_signature=sig,
            preferences=prefs,
        ),
        None,
    )


def analysis_cache_signature_matches(
    cached_analysis: dict[str, Any] | None, expected_signature: str
) -> bool:
    if not cached_analysis or not isinstance(cached_analysis, dict):
        return False
    meta = cached_analysis.get("_analysis_meta")
    if not isinstance(meta, dict):
        return False
    return meta.get("signature") == expected_signature


def attach_analysis_cache_meta(property_analysis: dict[str, Any], signature: str) -> dict[str, Any]:
    """Embed cache signature into persisted analysis (client should ignore _analysis_meta)."""
    out = {**property_analysis, "_analysis_meta": {"signature": signature}}
    return out


def public_property_analysis(property_analysis: dict[str, Any] | None) -> dict[str, Any]:
    """Strip server-only keys before sending analysis to the client."""
    if not property_analysis or not isinstance(property_analysis, dict):
        return {}
    return {k: v for k, v in property_analysis.items() if not k.startswith("_")}
