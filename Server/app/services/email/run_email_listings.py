import os
from typing import Dict, List, Tuple

from app import create_app, db
from app.models.home_universal import HomeUniversal
from app.services.email.last_logged_in import get_recently_logged_in_users_with_preferences
from app.services.email.send_test_emails_via_ses import send_personalized_emails_via_ses

# Optional portability import for ordering; safe to keep even if unused
try:
    from sqlalchemy import desc
    from sqlalchemy.sql import expression
    HAVE_SA_HELPERS = True
except Exception:
    HAVE_SA_HELPERS = False

app = create_app()

def _format_listings_text(listings: List[HomeUniversal], max_items: int = 10) -> str:
    """
    Produce a simple plaintext summary of listings for email body.
    """
    if not listings:
        return ""
    lines: List[str] = []
    for i, home in enumerate(listings, start=1):
        if i > max_items:
            break
        parts = [
            f"Address: {home.address or 'N/A'}",
            f"Price: {home.price if home.price is not None else 'N/A'}",
            f"Beds: {home.beds if home.beds is not None else 'N/A'}",
            f"Baths: {home.baths if home.baths is not None else 'N/A'}",
            f"Sqft: {home.sqft if home.sqft is not None else 'N/A'}",
            f"Score: {home.score if home.score is not None else 'N/A'}",
        ]
        if getattr(home, "zillow_url", None):
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
        q = HomeUniversal.query.filter_by(user_id=user_id)
        if HAVE_SA_HELPERS:
            # More portable nulls-last ordering if needed
            try:
                from sqlalchemy import nullslast
                q = q.order_by(nullslast(desc(HomeUniversal.score)), HomeUniversal.updated_at.desc())
            except Exception:
                q = q.order_by(HomeUniversal.score.desc().nullslast(), HomeUniversal.updated_at.desc())
        else:
            q = q.order_by(HomeUniversal.score.desc().nullslast(), HomeUniversal.updated_at.desc())

        listings = q.limit(max_items_per_user).all()

        body = _format_listings_text(listings, max_items=max_items_per_user)
        if not body:
            # Skip sending empty emails
            continue

        subject = "Your updated listings"
        messages.append((email, subject, body))

    return messages

def run_orchestrator():
    """
    Orchestrates: fetch users -> update searches -> email listings.
    """
    # App/DB sanity
    try:
        print(f"DB URL: {db.engine.url}")
    except Exception as e:
        print(f"DB engine not available: {e}")

    # Optional knobs for polygon search
    pause_seconds = float(os.getenv("POLY_SEARCH_PAUSE_SECONDS", "1.0"))
    per_bucket_pages = int(os.getenv("POLY_SEARCH_PER_BUCKET_PAGES", "5"))
    user_limit_env = os.getenv("POLY_SEARCH_USER_LIMIT")
    user_limit = int(user_limit_env) if (user_limit_env and user_limit_env.isdigit()) else None

    # Run polygon search if available
    try:
        from app.services.email.run_polygon_for_all_users import run_polygon_search_for_all_users
        run_polygon_search_for_all_users(
            pause_seconds=pause_seconds,
            per_bucket_pages=per_bucket_pages,
            user_limit=user_limit
        )
    except Exception as exc:
        print(f"Polygon search run failed or unavailable: {exc}")

    # Build messages
    max_items = int(os.getenv("EMAIL_MAX_ITEMS_PER_USER", "10"))
    messages = build_messages_for_recent_users(max_items_per_user=max_items)

    if not messages:
        print("No messages to send (no eligible users or no listings).")
        # Non-zero exit to catch misconfigurations when you expect traffic
        if os.getenv("FAIL_ON_EMPTY", "false").lower() in ("1", "true", "yes"):
            raise SystemExit(2)
        return

    # Respect DRY_RUN for CI
    if os.getenv("DRY_RUN", "false").lower() in ("1", "true", "yes"):
        print(f"[DRY_RUN] Would send {len(messages)} emails. First 1 preview:\n"
              f"To: {messages[0][0]}\nSubject: {messages[0][1]}\n\n{messages[0][2][:500]}")
        return

    # Send via SES
    try:
        sent_ids = send_personalized_emails_via_ses(messages)
        print(f"Sent {len(sent_ids)} emails via SES. MessageIds={sent_ids}")
    except Exception as e:
        print(f"SES send failed: {e}")
        raise SystemExit(1)

if __name__ == "__main__":
    with app.app_context():
        run_orchestrator()
