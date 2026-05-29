"""Public rev-share redirect handler GET /r/<link_id>."""

from __future__ import annotations

from flask import redirect, request

from app.schemas import RevShareRedirectQueryParams
from app.services.rev_share.redirect import RedirectClickContext, record_click_and_get_destination
from app.utils.security.security import rate_limit
from app.utils.validation import validate_query


def _client_ip() -> str | None:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr


@rate_limit(max_requests=60, window_seconds=60, per="ip")
@validate_query(RevShareRedirectQueryParams)
def rev_share_redirect(link_id: str, query: RevShareRedirectQueryParams | None = None):
    """
    RESPA: Logs brokerage marketplace placement click; redirects to partner destination.
    """
    params = query or RevShareRedirectQueryParams()
    ctx = RedirectClickContext(
        buyer_id=params.buyer_id,
        transaction_id=params.transaction_id,
        step_id=params.step_id,
        session_id=params.session_id,
        ip_address=_client_ip(),
        user_agent=request.headers.get("User-Agent"),
        referrer=request.headers.get("Referer"),
        utm_source=params.utm_source,
        utm_medium=params.utm_medium,
        utm_campaign=params.utm_campaign,
    )
    destination = record_click_and_get_destination(link_id, ctx)
    if not destination:
        return {"success": False, "error": "link_not_found"}, 404
    return redirect(destination, code=302)
