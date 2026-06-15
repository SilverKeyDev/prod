"""PostHog host constants — US cloud only, not env-driven."""

from app.services.analytics.posthog_constants import (
    POSTHOG_APP_URL,
    POSTHOG_CAPTURE_URL,
    POSTHOG_HOST,
    POSTHOG_LOGS_ENDPOINT,
    POSTHOG_PROJECT_ID,
    POSTHOG_QUERY_URL,
)


def test_posthog_host_is_us_cloud_ingest():
    assert POSTHOG_HOST == "https://us.i.posthog.com"
    assert POSTHOG_CAPTURE_URL == "https://us.i.posthog.com/capture/"
    assert POSTHOG_LOGS_ENDPOINT == "https://us.i.posthog.com/i/v1/logs"


def test_posthog_app_url_and_project():
    assert POSTHOG_APP_URL == "https://us.posthog.com"
    assert POSTHOG_PROJECT_ID == "441667"
    assert POSTHOG_QUERY_URL == "https://us.posthog.com/api/projects/441667/query/"
