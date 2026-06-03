import json
import logging
import time
import uuid
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config.llm_models import perplexity_model_negotiation

from ..research.perplexity.perplexity_config import (
    PERPLEXITY_API_KEY,
    PERPLEXITY_HEADERS,
    PERPLEXITY_URL,
)
from .json_utils import _safe_parse_json, validate_address
from .payload_builder import build_payload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _requests_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=2,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False,
    )
    # urllib3 HTTPAdapter accepts Retry for max_retries at runtime; stubs expect int
    session.mount("https://", HTTPAdapter(max_retries=retries))  # type: ignore[reportArgumentType]
    return session


def generate_report(
    section_type: str,
    address: str,
    filename: str,
    user_id: str,
    *,
    params: dict[str, Any] | None = None,
    report_customization: dict[str, Any] | None = None,
    user_preferences: dict[str, Any] | None = None,
    max_retries: int = 2,
) -> dict[str, Any]:
    """
    Generate a negotiation strategy using a SINGLE Perplexity call.
    No multithreading. Clean JSON parsing with retries.
    Returns the parsed JSON strategy data.
    """
    task_id = str(uuid.uuid4())
    section_name = section_type

    if not PERPLEXITY_API_KEY:
        logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
        raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

    if not validate_address(address):
        raise ValueError("Invalid address")

    payload = build_payload(
        section_type,
        address,
        perplexity_model_negotiation(),
        params=params,
        report_customization=report_customization,
        user_preferences=user_preferences,
    )
    session = _requests_session()

    last_error = None
    for attempt in range(max_retries + 1):
        start_time = time.perf_counter()
        try:
            resp = session.post(
                PERPLEXITY_URL, headers=PERPLEXITY_HEADERS, json=payload, timeout=300
            )
        except Exception as e:
            duration = time.perf_counter() - start_time
            last_error = f"Request error: {e}"
            logger.error(f"❌ {section_name}: {last_error} ({duration:.2f}s)")
            if attempt < max_retries:
                continue
            raise

        duration = time.perf_counter() - start_time

        if resp.status_code != 200:
            err = f"API error {resp.status_code}"
            try:
                ed = resp.json()
                rid = ed.get("request_id") or ed.get("error", {}).get("request_id")
                msg = ed.get("error", {}).get("message") or ed.get("message")
                if rid:
                    err += f" (Request ID: {rid})"
                if msg:
                    err += f" - {msg}"
                logger.error("🔍 API error details: %s", json.dumps(ed, indent=2))
            except Exception:
                logger.error("🔍 Non-JSON error response: %s", resp.text[:1000])
            last_error = err
            if attempt < max_retries:
                continue
            raise RuntimeError(err)

        try:
            content = resp.json()
        except Exception as e:
            last_error = f"JSON decode error: {e}"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise

        if "choices" not in content or not content["choices"]:
            last_error = "Malformed API response: missing 'choices'"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise RuntimeError(last_error)

        raw = content["choices"][0]["message"]["content"]

        try:
            parsed = _safe_parse_json(raw, report_customization)
        except Exception as pe:
            last_error = f"Parse error: {pe}"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise

        return {"task_id": task_id, "section": section_type, "success": True, "data": parsed}

    raise RuntimeError(last_error or "Unknown error during report generation")
