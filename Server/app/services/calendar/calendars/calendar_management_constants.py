"""Shared constants for calendar management (rate limits, dedupe cooldowns)."""

# Rate limiting constants
DELETE_DELAY_SECONDS = 1.0  # Delay between delete operations to avoid rate limits
MAX_RETRIES = 3  # Maximum retries for rate limit errors
RETRY_BASE_DELAY = 2.0  # Base delay for exponential backoff (seconds)

# Skip repeated owned-calendar dedupe delete bursts (same user, many parallel UI requests).
SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC = 3600.0
