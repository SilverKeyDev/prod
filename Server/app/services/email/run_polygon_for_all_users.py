from __future__ import annotations

import os
import time
from datetime import datetime, timedelta
from typing import Iterable, Optional

from flask import current_app

# App imports
from app import db
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.services.auth.minimal_token import minimal_token_service


def _iter_users_with_prefs(session, limit: Optional[int] = None, only_recently_logged_in: bool = True) -> Iterable[tuple[User, UserPreferences]]:
    """
    Yield (User, UserPreferences) for users who have preferences.
    If only_recently_logged_in is True, only includes users who logged in within the last month.
    Optional limit to bound the iteration for testing.
    """
    query = (
        session.query(User, UserPreferences)
        .join(UserPreferences, UserPreferences.user_id == User.id)
    )
    
    # Filter by recently logged in users (within last 30 days)
    if only_recently_logged_in:
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        query = query.filter(
            User.last_logged_in.isnot(None),
            User.last_logged_in >= one_month_ago
        )
    
    if isinstance(limit, int) and limit > 0:
        query = query.limit(limit)
    for user, prefs in query.all():
        yield user, prefs


def run_polygon_search_for_all_users(
    pause_seconds: float = 1.0,
    per_bucket_pages: int = 5,
    user_limit: Optional[int] = None,
    only_recently_logged_in: bool = True,
) -> dict:
    """
    Execute POST /api/v1/search/properties-by-polygon for each user that has
    recorded preferences. Uses Minimal access tokens to authenticate as the user.
    
    If only_recently_logged_in is True, only processes users who logged in within the last month.

    Returns a summary dict with simple counts.
    """
    results = {
        "total_users": 0,
        "attempted": 0,
        "succeeded": 0,
        "failed": 0,
        "errors": [],
    }

    # Use the Flask-SQLAlchemy scoped session (assumes app context is active)
    session = db.session
    # current_app is valid only if an app context is active
    with current_app.test_client() as client:
        for user, prefs in _iter_users_with_prefs(session=session, limit=user_limit, only_recently_logged_in=only_recently_logged_in):
            results["total_users"] += 1

            # Build Minimal access token for this user
            try:
                token = minimal_token_service.create_minimal_access_token(
                    user_id=str(user.id),
                    user_email=str(user.email or "user@example.com"),
                    expires_in_hours=8,
                )
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "user_id": str(user.id),
                    "stage": "token",
                    "error": str(e)[:300],
                })
                continue

            # Prepare request body using stored preferences
            body = {
                "user_preferences": prefs.to_dict(),
                "perBucketPages": int(max(0, min(per_bucket_pages, 20))),
            }

            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

            results["attempted"] += 1
            try:
                resp = client.post(
                    "/api/v1/search/properties-by-polygon",
                    json=body,
                    headers=headers,
                )
                if resp.status_code == 200 and (resp.is_json or False):
                    results["succeeded"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "user_id": str(user.id),
                        "stage": "route",
                        "status": resp.status_code,
                        "body": (resp.get_json(silent=True) if hasattr(resp, "get_json") else None),
                    })
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "user_id": str(user.id),
                    "stage": "request",
                    "error": str(e)[:300],
                })

            # Throttle between users to avoid hitting external API limits
            try:
                if pause_seconds and pause_seconds > 0:
                    time.sleep(pause_seconds)
            except Exception:
                pass

    return results


def run_polygon_search_for_all_users_with_context(*args, **kwargs):
    """
    Ensures an app context exists before running. Safe to call with or without
    an active app context.
    """
    try:
        _ = current_app.name  # raises if no app context
        return run_polygon_search_for_all_users(*args, **kwargs)
    except RuntimeError:
        from app import create_app
        app = create_app()
        with app.app_context():
            return run_polygon_search_for_all_users(*args, **kwargs)


if __name__ == "__main__":
    # Allow running as a script in CI for ad-hoc execution
    pause = float(os.getenv("POLY_SEARCH_PAUSE_SECONDS", "1.0"))
    pages = int(os.getenv("POLY_SEARCH_PER_BUCKET_PAGES", "5"))
    limit = os.getenv("POLY_SEARCH_USER_LIMIT")
    user_limit = int(limit) if (limit and limit.isdigit()) else None
    # Default to only recently logged in users (can be overridden via env var)
    only_recent = os.getenv("POLY_SEARCH_ONLY_RECENT", "true").lower() in ("1", "true", "yes")
    summary = run_polygon_search_for_all_users_with_context(
        pause_seconds=pause,
        per_bucket_pages=pages,
        user_limit=user_limit,
        only_recently_logged_in=only_recent,
    )
    # Minimal stdout summary for CI logs
    print({k: (v if k != "errors" else f"{len(v)} errors") for k, v in summary.items()})


