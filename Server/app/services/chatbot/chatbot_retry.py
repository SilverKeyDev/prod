"""
OpenAI request retry helpers (rate limit and API error handling).
"""

import logging
import re
import time

from openai import APIError, RateLimitError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def extract_retry_after_time(error_message: str) -> float | None:
    """
    Extract retry-after time from OpenAI rate limit error message.

    Error format: "Please try again in 68ms" or "Please try again in 1.5s"
    Returns time in seconds, or None if not found.
    """
    pattern = r"Please try again in ([\d.]+)(ms|s|seconds?)"
    match = re.search(pattern, error_message, re.IGNORECASE)
    if match:
        value = float(match.group(1))
        unit = match.group(2).lower()
        if unit == "ms":
            return value / 1000.0
        else:
            return value
    return None


def make_openai_request_with_retry(client, request_func, max_retries: int = 3):
    """Make OpenAI API request with retry logic that respects retry-after time."""
    for attempt in range(max_retries):
        try:
            return request_func()
        except RateLimitError as e:
            error_str = str(e)
            wait_time = extract_retry_after_time(error_str)

            if wait_time is None:
                wait_time = 2**attempt
                logger.warning(
                    f"⏳ Rate limit hit on attempt {attempt + 1}, using exponential backoff: {wait_time}s"
                )
            else:
                wait_time = max(wait_time + 0.1, 0.1)
                logger.warning(
                    f"⏳ Rate limit hit on attempt {attempt + 1}, waiting {wait_time:.3f}s (as requested by API)..."
                )

            if attempt < max_retries - 1:
                time.sleep(wait_time)
            else:
                logger.error(f"❌ Rate limit exceeded after {max_retries} attempts: {e}")
                raise
        except APIError as e:
            wait_time = 2**attempt
            if attempt < max_retries - 1:
                logger.warning(
                    f"⚠️ API error on attempt {attempt + 1}: {e}, waiting {wait_time}s before retry..."
                )
                time.sleep(wait_time)
            else:
                logger.error(f"❌ API error after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"❌ Unexpected error after {max_retries} attempts: {e}")
                raise
            else:
                logger.warning(
                    f"⚠️ Unexpected error on attempt {attempt + 1}: {e}, retrying in 1s..."
                )
                time.sleep(1)
