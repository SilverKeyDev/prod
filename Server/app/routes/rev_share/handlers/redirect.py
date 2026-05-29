"""Public rev-share redirect handler GET /r/<link_id>."""

from __future__ import annotations

from flask import redirect, request

from app.services.rev_share.redirect import RedirectClickContext, record_click_and_get_destination
from app.utils.security.security import rate_limit


def _client_ip() -> str | None:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr


@rate_limit(max_requests=60, window_seconds=60, per="ip")
def rev_share_redirect(link_id: str):
    """
    RESPA: Logs brokerage marketplace placement click; redirects to partner destination.
    """
    ctx = RedirectClickContext(
        buyer_id=request.args.get("buyer_id"),
        transaction_id=request.args.get("transaction_id"),
        step_id=request.args.get("step_id"),
        ip_address=_client_ip(),
        user_agent=request.headers.get("User-Agent"),
        referrer=request.headers.get("Referer"),
        utm_source=request.args.get("utm_source"),
        utm_medium=request.args.get("utm_medium"),
        utm_campaign=request.args.get("utm_campaign"),
    )
    destination = record_click_and_get_destination(link_id, ctx)
    if not destination:
        return {"success": False, "error": "link_not_found"}, 404
    return redirect(destination, code=302)
