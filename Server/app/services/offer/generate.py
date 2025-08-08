# offer_generator.py
import os
import json
import logging
import re
import uuid
import time
import traceback
from io import BytesIO
from typing import Dict, Optional

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry  # OK to keep for req==2.x

# --- ReportLab (for placeholder PDF only) ---
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except Exception:  # pragma: no cover
    canvas = None
    letter = None

# If you have your own PDF module, keep this import.
# Expecting a function named `_create_pdf(data, address, filename, comparison_address=None, user_preferences=None)`
try:
    from .pdf import _pdf  # type: ignore
except Exception:
    _pdf = None  # we'll fall back to a placeholder if missing

# -------------------------------------------------
# Logging
# -------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------------------------
# Perplexity API config
# -------------------------------------------------
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
if not PERPLEXITY_API_KEY:
    logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json",
}

PPLX_URL = "https://api.perplexity.ai/chat/completions"
PPLX_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar")

# -------------------------------------------------
# Utility: placeholder PDF
# -------------------------------------------------
def create_placeholder_pdf() -> bytes:
    if not canvas or not letter:
        return b"%PDF-1.4\n% placeholder\n"
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(72, 750, "Report is generating...")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()

# -------------------------------------------------
# Utility: address validation
# -------------------------------------------------
def validate_address(address: str) -> bool:
    if not address or not isinstance(address, str):
        logger.error("❌ Address is empty or not a string")
        return False
    if len(address.strip()) == 0:
        logger.error("❌ Address is empty after stripping whitespace")
        return False
    logger.debug(f"✅ Address validation passed: {address}")
    return True

# -------------------------------------------------
# Utility: remove empty fields
# -------------------------------------------------
def _remove_empty_fields(obj):
    if isinstance(obj, dict):
        return {k: _remove_empty_fields(v) for k, v in obj.items() if v not in ("", None, [], {})}
    if isinstance(obj, list):
        return [ _remove_empty_fields(x) for x in obj if x not in ("", None, [], {}) ]
    return obj

# -------------------------------------------------
# JSON parse w/ cleanup
# -------------------------------------------------
def _safe_parse_json(text: str, report_customization: Optional[dict] = None) -> dict:
    try:
        logger.debug("🔧 Attempting to parse model output as structured JSON")
        logger.debug(f"📝 Raw model output (first 500 chars): {text[:500]}...")
        if report_customization:
            logger.info(
                "🎛️ Report customization passed: %s",
                json.dumps(report_customization, indent=2)
            )

        # strip think tags and smart quotes
        cleaned = re.sub(
            r"(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)",
            "",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        ).strip()
        cleaned = cleaned.replace("“", '"').replace("”", '"').replace("’", "'")
        # remove trailing commas before ] or }
        cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"🛑 Failed to parse structured JSON: {e}")
            logger.error("🧵 Traceback:\n%s", traceback.format_exc())
            raise ValueError("Failed to parse structured JSON from model output") from e

        logger.info("🧹 CLEANUP: Removing empty fields...")
        parsed = _remove_empty_fields(parsed)
        if isinstance(parsed, dict):
            logger.info(f"✅ Successfully parsed and cleaned JSON with {len(parsed.keys())} keys")
        else:
            logger.info("✅ Successfully parsed and cleaned non-dict JSON")
        return parsed

    except Exception as e:
        logger.error(f"🛑 Failed to parse structured JSON: {e}")
        logger.error("🧵 Traceback:\n%s", traceback.format_exc())
        raise ValueError("Failed to parse structured JSON from model output") from e

# -------------------------------------------------
# Simple single-call runner
# -------------------------------------------------
def _requests_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=2,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False,
    )
    session.mount("https://", HTTPAdapter(max_retries=retries))
    return session

# -------------------------------------------------
# Response formats (one schema per call, selected by section_type)
# Keep these minimal and aligned with your Pydantic models.
# -------------------------------------------------
def _response_format_for(section_type: str) -> dict:
    """
    Returns a JSON Schema for the requested section. Exactly ONE schema per call.
    Valid section_type values:
      - "purchase_agreement"
      - "preapproval"
      - "earnest_money"
      - "buyer_letter"
    """
    if section_type == "purchase_agreement":
        return {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "state_template_code": {"type": "string"},
                "buyers": {
                    "type": "array",
                    "items": {"type": "object", "properties": {"name": {"type": "string"}, "email": {"type": "string"}}},
                    "minItems": 1,
                },
                "sellers": {
                    "type": "array",
                    "items": {"type": "object", "properties": {"name": {"type": "string"}, "email": {"type": "string"}}},
                },
                "property_address": {
                    "type": "object",
                    "properties": {
                        "line1": {"type": "string"},
                        "line2": {"type": "string"},
                        "city": {"type": "string"},
                        "state": {"type": "string"},
                        "postal_code": {"type": "string"},
                    },
                    "required": ["line1", "city", "state", "postal_code"],
                    "additionalProperties": True,
                },
                "offer_price_usd": {"type": "integer", "minimum": 0},
                "contingencies": {"type": "array", "items": {"type": "string"}},
                "closing_date": {"type": "string"},
                "earnest_money_usd": {"type": "integer", "minimum": 0},
                "whats_included": {"type": "array", "items": {"type": "string"}},
                "whats_excluded": {"type": "array", "items": {"type": "string"}},
                "send_decision": {
                    "type": "object",
                    "properties": {
                        "action": {"type": "string", "enum": ["SEND", "DONT_SEND"]},
                        "reasons": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": [
                                    "NotReadyOfficialOffer",
                                    "ClarifyingDisclosuresOrHOAOrTitle",
                                    "RequestSellerPreferredContract",
                                ],
                            },
                        },
                        "message_to_seller": {"type": "string"},
                    },
                    "required": ["action"],
                },
                "generate_agreement": {"type": "boolean"},
            },
            "required": ["state_template_code", "buyers", "property_address", "offer_price_usd", "closing_date", "send_decision"],
        }

    if section_type == "preapproval":
        return {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "decision": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["SEND_PREAPPROVAL", "SEND_PROOF_OF_FUNDS", "DONT_SEND"],
                        },
                        "reasons_if_dont_send": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": [
                                    "CashOfferWillSendPOF",
                                    "WaitingOnPreApprovalButSignalingIntent",
                                    "OffMarketKnownFinancing",
                                ],
                            },
                        },
                    },
                    "required": ["action"],
                },
                "upload_preapproval_letter": {"type": "object"},
                "upload_proof_of_funds": {"type": "object"},
            },
            "required": ["decision"],
        }

    if section_type == "earnest_money":
        return {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "amount_text": {"type": "string"},
                "amount_usd": {"type": "integer", "minimum": 0},
                "escrow_holder_name": {"type": "string"},
                "payment_timeline_text": {"type": "string"},
                "additional_instructions": {"type": "string"},
                "decision": {
                    "type": "object",
                    "properties": {
                        "action": {"type": "string", "enum": ["INCLUDE_INSTRUCTIONS", "DONT_INCLUDE"]},
                        "reasons_if_dont_include": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": ["AgreeTermsFirst", "SpeedOfferThenProvideLater", "EscrowHolderUnspecified"],
                            },
                        },
                    },
                    "required": ["action"],
                },
            },
            "required": ["decision"],
        }

    if section_type == "buyer_letter":
        return {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "letter_text": {"type": "string"},
                "decision": {
                    "type": "object",
                    "properties": {
                        "action": {"type": "string", "enum": ["INCLUDE", "DONT_INCLUDE"]},
                        "reasons_if_dont_include": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": [
                                    "ListingAgentForbidsLetters",
                                    "HighlyCompetitiveMarketDiscouraged",
                                    "PreferProfessionalOnly",
                                ],
                            },
                        },
                    },
                    "required": ["action"],
                },
            },
            "required": ["decision"],
        }

    raise ValueError(f"Unknown section_type '{section_type}'")

# -------------------------------------------------
# Build single payload per section_type
# -------------------------------------------------
def _build_payload(
    section_type: str,
    address: str,
    params: Optional[dict] = None,
    report_customization: Optional[dict] = None,
) -> dict:
    """
    Creates exactly ONE payload for the specified section_type.
    No multithreading, no multi-schema fanout.
    """
    params = params or {}
    response_format = _response_format_for(section_type)

    system_content = (
        "You are a structured JSON generator for real-estate offer components. "
        "Return ONLY valid JSON matching the provided response_format. "
        "No markdown, no prose—JSON object only."
    )

    # Minimal, section-specific user instruction (you can expand if needed)
    user_content = (
        f"Generate the '{section_type}' object for the property at {address}. "
        "Fill reasonable defaults if unspecified. Return valid JSON only."
    )

    payload = {
        "model": PPLX_MODEL,
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        "search_mode": "web",  # adjust to "concise" if you want to skip web
        "reasoning_effort": "medium",
        "temperature": params.get("temperature", 0.1),
        "max_tokens": params.get("max_tokens", 1500),
        "stream": False,
        "return_images": False,
        "return_citations": False,
        "response_format": response_format,  # <- single schema per call
    }

    return payload

# -------------------------------------------------
# PDF wrapper (call your existing _pdf if present)
# -------------------------------------------------
def _render_pdf_or_placeholder(
    data: dict,
    address: str,
    filename: str,
):
    """
    Tries to call your existing _pdf function; falls back to placeholder.
    """
    if _pdf and callable(_pdf):
        try:
            # The _pdf function expects (report, address, filename, title)
            title = f"Offer Document - {filename}"
            _pdf(data, address, filename, title)  # type: ignore
            logger.info(f"✅ PDF generated successfully: {filename}")
            return True
        except Exception as e:
            logger.error("❌ _pdf generation failed: %s", str(e))
            logger.error("📋 Traceback: %s", traceback.format_exc())
            # fall through to placeholder
    
    # Generate placeholder PDF as fallback
    logger.warning("⚠️ Using placeholder PDF - actual PDF generation unavailable")
    placeholder_content = create_placeholder_pdf()
    
    # In a real implementation, you might want to save this placeholder to S3
    # For now, we'll just log that we created it
    logger.info(f"📄 Placeholder PDF created for {filename} ({len(placeholder_content)} bytes)")
    return False

# -------------------------------------------------
# Public: generate_report (single section)
# -------------------------------------------------
def generate_report(
    section_type: str,
    address: str,
    filename: str,
    user_id: str,
    *,
    params: Optional[dict] = None,
    report_customization: Optional[dict] = None,
    comparison_address: Optional[str] = None,
    user_preferences: Optional[dict] = None,
    max_retries: int = 2,
) -> Dict:
    """
    Generate a SINGLE section (by section_type) using a SINGLE Perplexity call.
    No multithreading. No multi-schema fanout. Clean JSON parsing with retries.
    Returns the parsed JSON (and attempts PDF render via your _pdf hook).
    """
    task_id = str(uuid.uuid4())
    section_name = section_type  # alias used in logs
    logger.info(f"📝 REPORT_GEN[{task_id}]: Start for '{section_type}' at address: {address}")
    logger.info(f"🆔 REPORT_GEN[{task_id}]: user_id={user_id}")

    if not validate_address(address):
        raise ValueError("Invalid address")

    payload = _build_payload(section_type, address, params=params, report_customization=report_customization)
    session = _requests_session()

    last_error = None
    for attempt in range(max_retries + 1):
        attempt_num = attempt + 1
        logger.info(f"📨 {section_name}: Attempt {attempt_num}/{max_retries + 1}")
        start_time = time.perf_counter()
        try:
            resp = session.post(PPLX_URL, headers=HEADERS, json=payload, timeout=300)
        except Exception as e:
            duration = time.perf_counter() - start_time
            last_error = f"Request error: {e}"
            logger.error(f"❌ {section_name}: {last_error} ({duration:.2f}s)")
            if attempt < max_retries:
                continue
            raise

        duration = time.perf_counter() - start_time
        logger.info(f"📊 {section_name}: HTTP {resp.status_code} in {duration:.2f}s")

        if resp.status_code != 200:
            # try to expose Perplexity error details
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

        # Success path
        try:
            content = resp.json()
        except Exception as e:
            last_error = f"JSON decode error: {e}"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise

        # Validate response structure
        if "choices" not in content or not content["choices"]:
            last_error = "Malformed API response: missing 'choices'"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise RuntimeError(last_error)

        raw = content["choices"][0]["message"]["content"]
        logger.debug(f"🧾 {section_name}: Raw length {len(raw)} chars")

        try:
            parsed = _safe_parse_json(raw, report_customization)
        except Exception as pe:
            last_error = f"Parse error: {pe}"
            logger.error(f"❌ {section_name}: {last_error}")
            if attempt < max_retries:
                continue
            raise

        # Render PDF (best-effort)
        try:
            _render_pdf_or_placeholder(parsed, address, filename, comparison_address, user_preferences)
        except Exception as pdf_e:
            # Non-fatal for the JSON generation path
            logger.error(f"⚠️ PDF generation failed (non-fatal): {pdf_e}")

        logger.info(f"✅ REPORT_GEN[{task_id}]: Completed '{section_type}' successfully")
        return {"task_id": task_id, "section": section_type, "success": True, "data": parsed}

    # Should not reach here
    raise RuntimeError(last_error or "Unknown error during report generation")
