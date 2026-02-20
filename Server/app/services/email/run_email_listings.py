import os

from app import create_app, db
from app.models import HomeUniversal, User
from app.services.email.format_email_content import EmailFormatter
from app.services.email.last_logged_in import get_recently_logged_in_users_with_preferences
from app.services.email.send_test_emails_via_ses import send_personalized_emails_via_ses
from logger import LOG_CATEGORIES, log

# Optional portability import for ordering; safe to keep even if unused
HAVE_SA_HELPERS = True

app = create_app()


def build_messages_for_recent_users(
    max_items_per_user: int = 10,
    use_llm: bool = False,
    use_html: bool = True,
) -> list[tuple[str, str, str, str | None]]:
    """
    Build personalized email messages for recently active users with preferences.
    Each tuple is (recipient_email, subject, body_text, html_body).

    Args:
        max_items_per_user: Maximum number of listings per email
        use_llm: Whether to use LLM personalization (not yet implemented)
        use_html: If True, render HTML email using React Email (default: True)
    """
    users = get_recently_logged_in_users_with_preferences() or []

    # Filter to test email if TEST_EMAIL is set
    test_email = os.getenv("TEST_EMAIL", "").strip()
    if test_email:
        users = [
            u for u in users if (u.get("email", "") or "").strip().lower() == test_email.lower()
        ]
        # If not found in recently logged in users, try to find by email directly
        if not users:
            log.info(
                LOG_CATEGORIES["API"],
                "TEST_EMAIL specified but no matching user found in recently logged in users. Looking up by email directly...",
                {"test_email": test_email},
            )
            user = User.query.filter_by(email=test_email).first()
            if user and user.has_preferences:
                users = [{"user_id": user.id, "email": user.email}]
                log.info(
                    LOG_CATEGORIES["API"],
                    "Found user by direct email lookup",
                    {"email": user.email},
                )
            else:
                log.info(
                    LOG_CATEGORIES["API"],
                    "User with email not found or does not have preferences",
                    {"test_email": test_email},
                )

    # Initialize email formatter
    formatter = EmailFormatter(use_llm=use_llm)

    messages: list[tuple[str, str, str, str | None]] = []
    for entry in users:
        user_id = str(entry.get("user_id", "") or "")
        email = (entry.get("email", "") or "").strip()
        if not user_id or not email:
            continue

        # Prefer highest score, then most recently updated (only current homes)
        q = HomeUniversal.query.filter_by(user_id=user_id, current=True)
        if HAVE_SA_HELPERS:
            # More portable nulls-last ordering if needed
            try:
                from sqlalchemy import desc, nullslast

                q = q.order_by(
                    nullslast(desc(HomeUniversal.score)), HomeUniversal.updated_at.desc()
                )
            except Exception:
                q = q.order_by(
                    HomeUniversal.score.desc().nullslast(), HomeUniversal.updated_at.desc()
                )
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
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to format email",
                {"email": email, "error": str(e)},
            )
            continue

    return messages


def run_orchestrator():
    """
    Orchestrates: fetch users -> update searches -> email listings.
    """
    # App/DB sanity
    try:
        log.info(LOG_CATEGORIES["API"], "DB URL", {"url": str(db.engine.url)})
    except Exception as e:
        log.warn(LOG_CATEGORIES["ERRORS"], "DB engine not available", {"error": str(e)})

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
            pause_seconds=pause_seconds, per_bucket_pages=per_bucket_pages, user_limit=user_limit
        )
    except Exception as exc:
        log.warn(
            LOG_CATEGORIES["ERRORS"],
            "Polygon search run failed or unavailable",
            {"error": str(exc)},
        )

    # Build messages
    max_items = int(os.getenv("EMAIL_MAX_ITEMS_PER_USER", "10"))
    use_html = os.getenv("EMAIL_USE_HTML", "true").lower() in ("1", "true", "yes")
    messages = build_messages_for_recent_users(
        max_items_per_user=max_items,
        use_html=use_html,
    )

    if not messages:
        log.info(LOG_CATEGORIES["API"], "No messages to send (no eligible users or no listings)")
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
            preview_text = f"[DRY_RUN] Would send {len(messages)} emails. First 1 preview:\nTo: {msg[0]}\nSubject: {msg[1]}\n\nText Body: {msg[2][:500]}{html_preview}"
            log.info(LOG_CATEGORIES["API"], preview_text)
        return

    # Send via SES
    try:
        sent_ids = send_personalized_emails_via_ses(messages)
        log.info(
            LOG_CATEGORIES["API"],
            "Sent emails via SES",
            {"count": len(sent_ids), "message_ids": sent_ids},
        )
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], "SES send failed", {"error": str(e)})
        raise SystemExit(1) from e


if __name__ == "__main__":
    with app.app_context():
        run_orchestrator()
