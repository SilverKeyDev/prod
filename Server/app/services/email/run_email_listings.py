import os
from typing import Dict, List, Tuple, Optional

from app import create_app, db
from app.models.home_universal import HomeUniversal
from app.services.email.last_logged_in import get_recently_logged_in_users_with_preferences
from app.services.email.send_test_emails_via_ses import send_personalized_emails_via_ses
from app.services.email.format_email_content import EmailFormatter

# Optional portability import for ordering; safe to keep even if unused
try:
    from sqlalchemy import desc
    from sqlalchemy.sql import expression
    HAVE_SA_HELPERS = True
except Exception:
    HAVE_SA_HELPERS = False

app = create_app()


def build_messages_for_recent_users(
    max_items_per_user: int = 10, 
    use_llm: bool = False,
    use_html: bool = True,
) -> List[Tuple[str, str, str, Optional[str]]]:
    """
    Build personalized email messages for recently active users with preferences.
    Each tuple is (recipient_email, subject, body_text, html_body).
    
    Args:
        max_items_per_user: Maximum number of listings per email
        use_llm: Whether to use LLM personalization (not yet implemented)
        use_html: If True, render HTML email using React Email (default: True)
    """
    users = get_recently_logged_in_users_with_preferences() or []
    
    # Initialize email formatter
    formatter = EmailFormatter(use_llm=use_llm)
    
    messages: List[Tuple[str, str, str, Optional[str]]] = []
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

        if not listings:
            # Skip users with no listings
            continue

        # Format email using the new formatter
        try:
            message = formatter.format_email_message(
                recipient_email=email,
                listings=listings,
                user_id=user_id,
                max_items=max_items_per_user,
                use_html=use_html,
            )
            messages.append(message)
        except Exception as e:
            print(f"Failed to format email for {email}: {e}")
            continue

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
        from app.services.email.run_polygon_for_all_users import (
            run_polygon_search_for_all_users_with_context as run_polygon_search_for_all_users,
        )
        run_polygon_search_for_all_users(
            pause_seconds=pause_seconds,
            per_bucket_pages=per_bucket_pages,
            user_limit=user_limit
        )
    except Exception as exc:
        print(f"Polygon search run failed or unavailable: {exc}")

    # Build messages
    max_items = int(os.getenv("EMAIL_MAX_ITEMS_PER_USER", "10"))
    use_html = os.getenv("EMAIL_USE_HTML", "true").lower() in ("1", "true", "yes")
    messages = build_messages_for_recent_users(
        max_items_per_user=max_items,
        use_html=use_html,
    )

    if not messages:
        print("No messages to send (no eligible users or no listings).")
        # Non-zero exit to catch misconfigurations when you expect traffic
        if os.getenv("FAIL_ON_EMPTY", "false").lower() in ("1", "true", "yes"):
            raise SystemExit(2)
        return

    # Respect DRY_RUN for CI
    if os.getenv("DRY_RUN", "false").lower() in ("1", "true", "yes"):
        if messages:
            msg = messages[0]
            html_preview = ""
            if len(msg) > 3 and msg[3]:
                html_preview = f"\nHTML Body: {len(msg[3])} chars (preview: {msg[3][:200]}...)"
            print(f"[DRY_RUN] Would send {len(messages)} emails. First 1 preview:\n"
                  f"To: {msg[0]}\nSubject: {msg[1]}\n\nText Body: {msg[2][:500]}{html_preview}")
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
