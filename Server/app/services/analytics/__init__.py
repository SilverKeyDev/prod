"""Product analytics helpers (PostHog).

Import from submodules directly, e.g. ``posthog_events.capture_product_event``,
to avoid circular imports with ``app.posthog_client`` during app startup.
"""

__all__ = [
    "capture_product_event",
    "set_person_properties",
]
