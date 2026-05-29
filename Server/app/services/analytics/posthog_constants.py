"""SilverKey PostHog project (US cloud). Host, app URL, and project id are hardcoded — not env-configurable."""

POSTHOG_HOST = "https://us.i.posthog.com"
POSTHOG_APP_URL = "https://us.posthog.com"
POSTHOG_PROJECT_ID = "441667"

POSTHOG_CAPTURE_URL = f"{POSTHOG_HOST}/capture/"
POSTHOG_LOGS_ENDPOINT = f"{POSTHOG_HOST}/i/v1/logs"
POSTHOG_QUERY_URL = f"{POSTHOG_APP_URL}/api/projects/{POSTHOG_PROJECT_ID}/query/"

POSTHOG_DISTINCT_ID_HEADER = "X-POSTHOG-DISTINCT-ID"
POSTHOG_SESSION_ID_HEADER = "X-POSTHOG-SESSION-ID"
