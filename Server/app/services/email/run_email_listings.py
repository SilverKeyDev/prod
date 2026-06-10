import os

from sqlalchemy import select

from app import create_app, db
from app.models import PropertyCache, User, UserPropertyLink
from app.services.email.format_email_content import EmailFormatter
from app.services.email.last_logged_in import get_recently_logged_in_users_with_preferences
from app.services.email.send_test_emails_via_ses import send_personalized_emails_via_ses
from app.utils.db.orm_lookup import get_model
from logger import log

HAVE_SA_HELPERS = True

app = create_app()


class _EmailListingProxy:
    """Lightweight adapter so the EmailFormatter can access property attributes uniformly."""

    def __init__(self, prop: PropertyCache, link: UserPropertyLink):
        self.id = prop.id
        self.address = prop.address
        self.price = prop.price
        self.beds = prop.beds
        self.baths = prop.baths
        self.sqft = prop.sqft
        self.score = link.score
        self.image_url = prop.primary_image_url


def build_messages_for_recent_users(
    max_items_per_user: int = 10,
    use_llm: bool = False,
    use_html: bool = True,
) -> list[tuple[str, str, str, str | None]]:
    """Build personalized email messages for recently active users with preferences."""
    users = get_recently_logged_in_users_with_preferences() or []

    test_email = os.getenv("TEST_EMAIL", "").strip()
    if test_email:
        users = [
            u for u in users if (u.get("email", "") or "").strip().lower() == test_email.lower()
        ]
        if not users:
            log.info(
                "API",
                "TEST_EMAIL specified but no matching user found. Looking up by email directly...",
                {"test_email": test_email},
            )
            user = db.session.scalar(select(User).where(User.email == test_email))
            if user and user.has_preferences:
                users = [{"user_id": user.id, "email": user.email}]
                log.info(
                    "API",
                    "Found user by direct email lookup",
                    {"email": user.email},
                )
            else:
                log.info(
                    "API",
                    "User with email not found or does not have preferences",
                    {"test_email": test_email},
                )

    formatter = EmailFormatter(use_llm=use_llm)

    messages: list[tuple[str, str, str, str | None]] = []
    for entry in users:
        user_id = str(entry.get("user_id", "") or "")
        email = (entry.get("email", "") or "").strip()
        if not user_id or not email:
            continue

        q = select(UserPropertyLink).where(
            UserPropertyLink.user_id == user_id,
            UserPropertyLink.current.is_(True),
        )
        if HAVE_SA_HELPERS:
            try:
                from sqlalchemy import desc, nullslast

                q = q.order_by(
                    nullslast(desc(UserPropertyLink.score)), UserPropertyLink.updated_at.desc()
                )
            except Exception:
                q = q.order_by(
                    UserPropertyLink.score.desc().nullslast(), UserPropertyLink.updated_at.desc()
                )
        else:
            q = q.order_by(
                UserPropertyLink.score.desc().nullslast(), UserPropertyLink.updated_at.desc()
            )

        links = db.session.scalars(q.limit(max_items_per_user)).all()

        if not links:
            continue

        listings = []
        for link in links:
            prop = get_model(PropertyCache, link.property_id)
            if prop:
                listings.append(_EmailListingProxy(prop, link))

        if not listings:
            continue

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
                "ERRORS",
                "Failed to format email",
                {"email": email, "error": str(e)},
            )
            continue

    return messages


def run_orchestrator():
    """Orchestrates: fetch users -> update searches -> email listings."""
    try:
        log.info("API", "DB URL", {"url": str(db.engine.url)})
    except Exception as e:
        log.warn("ERRORS", "DB engine not available", {"error": str(e)})

    pause_seconds = float(os.getenv("POLY_SEARCH_PAUSE_SECONDS", "1.0"))
    per_bucket_pages = int(os.getenv("POLY_SEARCH_PER_BUCKET_PAGES", "5"))
    user_limit_env = os.getenv("POLY_SEARCH_USER_LIMIT")
    user_limit = int(user_limit_env) if (user_limit_env and user_limit_env.isdigit()) else None

    try:
        from app.services.email.run_polygon_for_all_users import (
            run_polygon_search_for_all_users_with_context as run_polygon_search_for_all_users,
        )

        run_polygon_search_for_all_users(
            pause_seconds=pause_seconds, per_bucket_pages=per_bucket_pages, user_limit=user_limit
        )
    except Exception as exc:
        log.warn(
            "ERRORS",
            "Polygon search run failed or unavailable",
            {"error": str(exc)},
        )

    max_items = int(os.getenv("EMAIL_MAX_ITEMS_PER_USER", "10"))
    use_html = os.getenv("EMAIL_USE_HTML", "true").lower() in ("1", "true", "yes")
    messages = build_messages_for_recent_users(max_items_per_user=max_items, use_html=use_html)

    if not messages:
        log.info("API", "No messages to send (no eligible users or no listings)")
        if os.getenv("FAIL_ON_EMPTY", "false").lower() in ("1", "true", "yes"):
            raise SystemExit(2)
        return

    if os.getenv("DRY_RUN", "false").lower() in ("1", "true", "yes"):
        if messages:
            msg = messages[0]
            html_preview = ""
            if len(msg) > 3 and msg[3]:
                html_preview = f"\nHTML Body: {len(msg[3])} chars (preview: {msg[3][:200]}...)"
            preview_text = (
                f"[DRY_RUN] Would send {len(messages)} emails. First 1 preview:\n"
                f"To: {msg[0]}\nSubject: {msg[1]}\n\nText Body: {msg[2][:500]}{html_preview}"
            )
            log.info("API", preview_text)
        return

    try:
        sent_ids = send_personalized_emails_via_ses(messages)
        log.info(
            "API",
            "Sent emails via SES",
            {"count": len(sent_ids), "message_ids": sent_ids},
        )
    except Exception as e:
        log.error("ERRORS", "SES send failed", {"error": str(e)})
        raise SystemExit(1) from e


if __name__ == "__main__":
    with app.app_context():
        run_orchestrator()
