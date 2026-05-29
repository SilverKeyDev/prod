"""
Content-Security-Policy for the Vite web SPA (HTML document responses only).

Tuned for: same-origin API, AWS (Cognito, S3), Google Maps, DocuSign,
Google Fonts, listing imagery from arbitrary HTTPS hosts, map label workers
(WASM + data URL fetches), and WebAssembly runtimes that require wasm-unsafe-eval.

Extend with env `CSP_CONNECT_SRC_EXTRA`: comma-separated origins appended to connect-src.
"""

from __future__ import annotations

import os

from app.services.analytics.posthog_constants import POSTHOG_APP_URL, POSTHOG_HOST


def build_content_security_policy() -> str:
    """Return a single-line Content-Security-Policy value for the main SPA."""
    is_prod = os.getenv("FLASK_ENV") == "production"
    connect_extra = os.getenv("CSP_CONNECT_SRC_EXTRA", "")
    connect_parts: list[str] = [
        "'self'",
        "data:",
        "http://127.0.0.1:5000",
        "http://localhost:5000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://usesilverkey.com",
        "https://www.usesilverkey.com",
        "wss://usesilverkey.com",
        "wss://www.usesilverkey.com",
        "https://*.amazonaws.com",
        "https://*.googleapis.com",
        "https://*.gstatic.com",
        "https://*.docusign.com",
        "https://*.docusign.net",
        "https://account-d.docusign.com",
        "https://account.docusign.com",
        POSTHOG_HOST,
        POSTHOG_APP_URL,
    ]
    for part in connect_extra.split(","):
        s = part.strip()
        if s:
            connect_parts.append(s)
    connect_src = " ".join(connect_parts)

    # img-src: listing and CDN imagery use many hosts; allow any HTTPS.
    base = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "form-action 'self' https:; "
        f"connect-src {connect_src}; "
        "script-src 'self' 'wasm-unsafe-eval' https://*.googleapis.com https://*.gstatic.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "img-src 'self' data: blob: https:; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "worker-src 'self' blob:; "
        "frame-src 'self' https:; "
        "object-src 'none'; "
        "frame-ancestors 'self'"
    )
    if is_prod:
        base += "; upgrade-insecure-requests"
    return base
