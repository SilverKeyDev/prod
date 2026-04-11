"""GET/PATCH current user's search display settings."""

from __future__ import annotations

from typing import Any

from flask import current_app, jsonify, request

from app import db
from app.models.user.user_search_display import RESULTS_ORDER_BY_ALLOWED, UserSearchDisplaySettings
from app.schemas import SearchDisplayPayload, SearchDisplayResponse
from app.services.auth import SecurityException, get_current_user
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import security_error_response
from app.utils.validation import validate_request, validate_response

MAP_HOME_CARDS_MIN = 1
MAP_HOME_CARDS_MAX = 5
DEFAULT_ORDER_BY = "match_score"


LAST_SEARCH_CONTEXT_ALLOWED_KEYS = frozenset(
    {"search_source", "viewport_ring", "place_label", "map_center", "map_zoom", "searched_at"}
)
LAST_SEARCH_CONTEXT_SOURCES = frozenset({"preferences", "location"})


def _sanitize_last_search_context(raw: Any) -> dict[str, Any] | None:
    """Validate and sanitize the last_search_context payload. Returns None on invalid input."""
    if raw is None:
        return None
    if not isinstance(raw, dict):
        return None
    out: dict[str, Any] = {}
    for key in LAST_SEARCH_CONTEXT_ALLOWED_KEYS:
        if key in raw:
            out[key] = raw[key]
    if out.get("search_source") and out["search_source"] not in LAST_SEARCH_CONTEXT_SOURCES:
        out["search_source"] = "preferences"
    ring = out.get("viewport_ring")
    if ring is not None:
        if not isinstance(ring, list) or len(ring) < 3:
            out.pop("viewport_ring", None)
        else:
            sanitized = []
            for pt in ring:
                if isinstance(pt, dict) and "lat" in pt and "lng" in pt:
                    try:
                        sanitized.append({"lat": float(pt["lat"]), "lng": float(pt["lng"])})
                    except (TypeError, ValueError):
                        continue
            out["viewport_ring"] = sanitized if len(sanitized) >= 3 else None
    center = out.get("map_center")
    if center is not None:
        if isinstance(center, dict) and "lat" in center and "lng" in center:
            try:
                out["map_center"] = {"lat": float(center["lat"]), "lng": float(center["lng"])}
            except (TypeError, ValueError):
                out.pop("map_center", None)
        else:
            out.pop("map_center", None)
    zoom = out.get("map_zoom")
    if zoom is not None:
        try:
            out["map_zoom"] = max(1, min(22, int(zoom)))
        except (TypeError, ValueError):
            out.pop("map_zoom", None)
    return out if out else None


def _row_to_dict(row: UserSearchDisplaySettings) -> dict[str, Any]:
    return {
        "show_commute_overlay": bool(row.show_commute_overlay),
        "map_home_cards_count": int(row.map_home_cards_count),
        "results_order_by": str(row.results_order_by or DEFAULT_ORDER_BY),
        "preferences_strict_filter": bool(getattr(row, "preferences_strict_filter", False)),
        "last_search_context": getattr(row, "last_search_context", None),
    }


def _get_or_create(user_id: str) -> UserSearchDisplaySettings:
    row = UserSearchDisplaySettings.query.filter_by(user_id=user_id).first()
    if row is None:
        row = UserSearchDisplaySettings(
            user_id=user_id,
            show_commute_overlay=True,
            map_home_cards_count=1,
            results_order_by=DEFAULT_ORDER_BY,
            preferences_strict_filter=False,
        )
        db.session.add(row)
        db.session.commit()
    return row


@validate_response(SearchDisplayResponse)
def get_search_display():
    log = current_app.logger
    try:
        user = get_current_user()
        if not user:
            log.warning("Unauthorized request: user not found in token")
            return jsonify({"error": "Unauthorized", "success": False}), 401
    except SecurityException as se:
        log.warning("Security exception in get_search_display: %s", se.error_tuple)
        return security_error_response(se.error_tuple)
    except Exception as e:
        log.error("Failed to get current user: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Authorization failure"}), 500
    try:
        row = _get_or_create(str(user.id))
        return jsonify({"success": True, "search_display": _row_to_dict(row)})
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "get_search_display", "user_id": getattr(user, "id", "unknown")}
        )


@validate_response(SearchDisplayResponse)
@validate_request(SearchDisplayPayload)
def patch_search_display(data: SearchDisplayPayload | None = None):
    log = current_app.logger
    try:
        user = get_current_user()
        if not user:
            log.warning("Unauthorized request: user not found in token")
            return jsonify({"error": "Unauthorized", "success": False}), 401
    except SecurityException as se:
        log.warning("Security exception in patch_search_display: %s", se.error_tuple)
        return security_error_response(se.error_tuple)
    except Exception as e:
        log.error("Failed to get current user: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Authorization failure"}), 500
    try:
        if data is not None:
            body = data.model_dump(exclude_unset=True)
        else:
            body = request.get_json()
            if not body or not isinstance(body, dict):
                log.warning("No JSON object in patch_search_display body")
                return jsonify({"success": False, "error": "No data provided"}), 400
    except Exception as e:
        log.error("Failed to parse JSON body: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Invalid JSON format"}), 400

    if not body:
        log.warning("No JSON object in patch_search_display body")
        return jsonify({"success": False, "error": "No data provided"}), 400

    try:
        row = _get_or_create(str(user.id))
        if "show_commute_overlay" in body:
            v = body["show_commute_overlay"]
            if v is None:
                return jsonify(
                    {"success": False, "error": "show_commute_overlay cannot be null"}
                ), 400
            row.show_commute_overlay = bool(v)
        if "map_home_cards_count" in body:
            v = body["map_home_cards_count"]
            if v is None:
                return jsonify(
                    {"success": False, "error": "map_home_cards_count cannot be null"}
                ), 400
            try:
                n = int(v)
            except (TypeError, ValueError):
                return jsonify(
                    {"success": False, "error": "map_home_cards_count must be an integer"}
                ), 400
            if n < MAP_HOME_CARDS_MIN or n > MAP_HOME_CARDS_MAX:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"map_home_cards_count must be between {MAP_HOME_CARDS_MIN} and {MAP_HOME_CARDS_MAX}",
                        }
                    ),
                    400,
                )
            row.map_home_cards_count = n
        if "results_order_by" in body:
            v = body["results_order_by"]
            if v is None or (isinstance(v, str) and not v.strip()):
                return jsonify({"success": False, "error": "results_order_by cannot be empty"}), 400
            key = str(v).strip().lower()
            if key not in RESULTS_ORDER_BY_ALLOWED:
                return jsonify({"success": False, "error": "Invalid results_order_by"}), 400
            row.results_order_by = key
        if "preferences_strict_filter" in body:
            v = body["preferences_strict_filter"]
            if v is None:
                return (
                    jsonify(
                        {"success": False, "error": "preferences_strict_filter cannot be null"}
                    ),
                    400,
                )
            row.preferences_strict_filter = bool(v)

        if "last_search_context" in body:
            raw_ctx = body["last_search_context"]
            if raw_ctx is None:
                row.last_search_context = None
            else:
                sanitized = _sanitize_last_search_context(raw_ctx)
                if sanitized is None:
                    return jsonify({"success": False, "error": "Invalid last_search_context"}), 400
                row.last_search_context = sanitized

        db.session.add(row)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "message": "Search display updated",
                "search_display": _row_to_dict(row),
            }
        )
    except Exception as e:
        db.session.rollback()
        return SecureErrorHandler.handle_database_error(
            e, {"function": "patch_search_display", "user_id": getattr(user, "id", "unknown")}
        )
