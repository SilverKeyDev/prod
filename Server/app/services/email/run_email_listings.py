import os
from typing import Dict, List, Tuple

from app import create_app, db
from app.models.home_universal import HomeUniversal
from app.services.email.last_logged_in import get_recently_logged_in_users_with_preferences
from app.services.email.send_test_emails_via_ses import (
    send_personalized_emails_via_ses,
)


app = create_app()


def _format_listings_text(listings: List[HomeUniversal], max_items: int = 10) -> str:
    """
    Produce a simple plaintext summary of listings for email body.
    """
    lines: List[str] = []
    if not listings:
        return "No listings found."

    count = 0
    for home in listings:
        count += 1
        if count > max_items:
            break
        parts = [
            f"Address: {home.address or 'N/A'}",
            f"Price: {home.price or 'N/A'}",
            f"Beds: {home.beds or 'N/A'}",
            f"Baths: {home.baths or 'N/A'}",
            f"Sqft: {home.sqft or 'N/A'}",
            f"Score: {home.score if home.score is not None else 'N/A'}",
        ]
        if home.zillow_url:
            parts.append(f"Link: {home.zillow_url}")
        lines.append(" | ".join(parts))

    return "\n".join(lines)


def build_messages_for_recent_users(max_items_per_user: int = 10) -> List[Tuple[str, str, str]]:
    """
    Build personalized email messages for recently active users with preferences.
    Each tuple is (recipient_email, subject, body_text).
    """
    users = get_recently_logged_in_users_with_preferences() or []
    messages: List[Tuple[str, str, str]] = []
    for entry in users:
        user_id = str(entry.get("user_id", "") or "")
        email = (entry.get("email", "") or "").strip()
        if not user_id or not email:
            continue

        # Prefer highest score, then most recently updated
        listings = (
            HomeUniversal.query.filter_by(user_id=user_id)
            .order_by(HomeUniversal.score.desc().nullslast(), HomeUniversal.updated_at.desc())
            .limit(max_items_per_user)
            .all()
        )
        subject = "Your updated listings"
        body = _format_listings_text(listings, max_items=max_items_per_user)
        messages.append((email, subject, body))

    return messages


def run_orchestrator():
    """
    Orchestrates: fetch users -> update searches -> email listings.
    """
    # Quick sanity check: confirms we're in an app context with the correct db
    try:
        print(f"DB URL: {db.engine.url}")
    except Exception as e:
        print(f"DB engine not available: {e}")
    # Optionally throttle/paging settings for polygon search
    pause_seconds = float(os.getenv("POLY_SEARCH_PAUSE_SECONDS", "1.0"))
    per_bucket_pages = int(os.getenv("POLY_SEARCH_PER_BUCKET_PAGES", "5"))
    user_limit_env = os.getenv("POLY_SEARCH_USER_LIMIT")
    user_limit = int(user_limit_env) if (user_limit_env and user_limit_env.isdigit()) else None

    # Update search information for all users (import lazily to avoid circulars)
    try:
        from app.services.email.run_polygon_for_all_users import run_polygon_search_for_all_users

        run_polygon_search_for_all_users(
            pause_seconds=pause_seconds, per_bucket_pages=per_bucket_pages, user_limit=user_limit
        )
    except Exception as exc:
        print(f"Polygon search run failed or unavailable: {exc}")

    # Build personalized messages based on current HomeUniversal records
    messages = build_messages_for_recent_users(max_items_per_user=int(os.getenv("EMAIL_MAX_ITEMS_PER_USER", "10")))
    if not messages:
        print("No messages to send.")
        return

    # Send via SES
    sent_ids = send_personalized_emails_via_ses(messages)
    print(f"Sent {len(sent_ids)} emails via SES. MessageIds={sent_ids}")


if __name__ == "__main__":
    with app.app_context():
        run_orchestrator()


