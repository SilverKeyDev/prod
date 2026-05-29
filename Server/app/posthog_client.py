"""PostHog analytics client — initialized once in create_app()."""

import atexit
import os

from posthog import Posthog

from app.services.analytics.posthog_constants import POSTHOG_API_HOST

_client: Posthog | None = None


def get_posthog_client() -> Posthog | None:
    return _client


def init_posthog() -> Posthog | None:
    global _client
    api_key = os.environ.get("POSTHOG_PROJECT_TOKEN")
    if not api_key:
        return None
    _client = Posthog(
        project_api_key=api_key,
        host=POSTHOG_API_HOST,
        enable_exception_autocapture=True,
    )
    atexit.register(_client.shutdown)
    return _client
