"""Optional Google Meet link helper for campaign variants (SIL-309 stretch).

Reuses the same ``add_google_meet`` contract as calendar create_event /
``buildAgentTodoGoogleEvent({ addGoogleMeet: true })``. Does not create a
live Calendar event here (needs user OAuth); returns a template payload the
campaign email can embed once Meet is provisioned.
"""

from __future__ import annotations

from typing import Any


def build_meet_cta_payload(
    *,
    coordinator_label: str = "your services coordinator",
    meet_url: str | None = None,
) -> dict[str, Any]:
    """Structured Meet CTA for a variant body.

    When ``meet_url`` is None, returns instructions to create via existing
    calendar infrastructure (POST /api/v1/google/me/events with addGoogleMeet).
    """
    return {
        "cta_label": f"Book time with {coordinator_label}",
        "meet_url": meet_url,
        "calendar_create_hint": {
            "endpoint": "POST /api/v1/google/me/events",
            "body": {
                "summary": f"Services coordinator — {coordinator_label}",
                "addGoogleMeet": True,
                "description": "Campaign follow-up: in-house ancillary attach walkthrough",
            },
            "client_helper": "buildAgentTodoGoogleEvent({ addGoogleMeet: true })",
        },
        "embed_html": (
            f'<p><a href="{meet_url}">Book time with {coordinator_label}</a></p>'
            if meet_url
            else (
                f"<p>Book time with {coordinator_label} "
                "(Meet link attached after calendar event create).</p>"
            )
        ),
    }


def apply_meet_option_to_draft_variant(variant: dict[str, Any]) -> dict[str, Any]:
    """If variant requests Meet, attach CTA payload (no live API call)."""
    if not variant.get("include_meet_link"):
        return variant
    enriched = dict(variant)
    enriched["meet_cta"] = build_meet_cta_payload()
    return enriched
