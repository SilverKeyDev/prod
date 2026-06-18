"""Force-set integration API key stubs for pytest/CI (no real credentials).

Stubs win over shell exports and load_dotenv() so local runs match GitHub Actions.
Extend TEST_ENV_STUBS when a new import-time or boot-time read requires a key.
"""

from __future__ import annotations

import os

TEST_ENV_STUBS: dict[str, str] = {
    "PERPLEXITY_API_KEY": "pytest-stub-perplexity-not-for-production",
    "OPENAI_KEY": "pytest-stub-openai-not-for-production",
    "GOOGLE_MAPS_API_KEY": "pytest-stub-gmaps-not-for-production",
    "CENSUS_API_KEY": "pytest-stub-census-not-for-production",
    "SERP_API": "pytest-stub-serp-not-for-production",
    "SLIPSTREAM_PRIVATE": "pytest-stub-slipstream-private-not-for-production",
    "SLIPSTREAM_PUBLIC": "pytest-stub-slipstream-public-not-for-production",
    "POSTHOG_PROJECT_TOKEN": "pytest-stub-posthog-not-for-production",
    "CREDENTIAL_ENCRYPTION_KEY": "pytest-stub-credential-encryption-key-not-for-production",
}


def apply_test_env_stubs() -> None:
    """Force assignment so stubs override developer .env and shell exports."""
    for key, value in TEST_ENV_STUBS.items():
        os.environ[key] = value
