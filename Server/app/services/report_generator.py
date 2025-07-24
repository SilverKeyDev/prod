import os
import json
import logging
import re
from typing import Dict
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import uuid
import time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from flask import jsonify
import json5
import traceback
from .pdf_creator import _create_pdf
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from .guidance_generator import give_guidance

# Import Pydantic models for structured JSON output
from ..models.report_models import FullReport

# Configure verbose logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
if not PERPLEXITY_API_KEY:
    logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}


# -------------------- UTILS --------------------

def create_placeholder_pdf() -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, "Report is generating...")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


def validate_address(address: str) -> bool:
    """Validate that the address is provided and is a string"""
    if not address:
        logger.error("❌ Address is empty or None")
        return False
    
    if len(address.strip()) == 0:
        logger.error("❌ Address is empty after stripping whitespace")
        return False
    
    logger.debug(f"✅ Address validation passed: {address}")
    return True

def _safe_parse_json(text: str) -> dict:
    try:
        logger.debug("🔧 Attempting to parse model output as structured JSON")
        logger.debug(f"📝 Raw model output (first 500 chars): {text[:500]}...")

        # Strip any non-JSON hallucinated wrappers just in case
        cleaned = re.sub(r'(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)', '', text, flags=re.DOTALL | re.IGNORECASE).strip()

        # Parse the raw output directly
        parsed = json.loads(cleaned)
        logger.debug("✅ Parsed with json.loads")

        # Validate with FullReport schema
        try:
            validated = FullReport(**parsed)
            logger.debug("🎯 Validation with Pydantic successful")
            return validated.model_dump()
        except Exception as ve:
            logger.warning(f"⚠️ Validation failed: {ve}")
            logger.warning("📋 Returning unvalidated parsed JSON")
            return parsed

    except Exception as e:
        logger.error(f"🛑 Failed to parse structured JSON: {e}")
        logger.error(f"🧵 Traceback:\n{traceback.format_exc()}")
        raise ValueError("Failed to parse structured JSON from model output") from e

# -------------------- MAIN FUNCTION --------------------

def generate_report(address: str, filename: str) -> Dict:
    """Generate a comprehensive property report and upload PDF to S3"""
    task_id = str(uuid.uuid4())
    logger.info(f"📝 Starting report generation for address: {address}")
    logger.info(f"🆔 Task ID: {task_id}")
    try:
        # Validate address
        if not validate_address(address):
            logger.error("🚫 Address validation failed")
            raise ValueError("Invalid address format")

        payload = {
            "model": "sonar-deep-research",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"You are a comprehensive property research assistant. Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"

                        "CRITICAL REQUIREMENTS:\n"
                        "1. Follow all instrucions EXACTLY for ALL fields exactly as in the given guidance - if you don't know a value, research until you find one\n"
                        "2. Be  critical and honest - expose both good and bad aspects of locations\n"
                        "3. If no data exists for a field, provide your best educated estimate based on similar areas\n"
                        "4. All ratings should be out of 10 and realistic, do not be afraid to rate somewhere very low or high\n"
                        "5. You MUST respond with ONLY valid JSON (no markdown, no explanation). Do not wrap your response in ``` or any code fences.\n"
                        "6. Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"
                        "7. Do not include citations in the response\n"

                        "Formatting: if the name includes the phrase, must be formatted this way"
                        "_demographics: caption: percentage (total must add to 100%) e.g. Children (0–9 years): 14.2%"
                        "_rating: 1-10 score. Use the full scale. e.g. 4.3/10\n"
                        "STRICT GUIDANCE FOR EACH SECTION:\n"
                        
                         f"{give_guidance()}"
                    )
                }, {"role": "user", "content": address}
            ],
            "search_mode": "web",
            "reasoning_effort": "medium",
            "temperature": 0.1,
            "max_tokens": 10000,
            "stream": False,
            "return_images": False,
            "return_citations": False,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "schema": FullReport.model_json_schema()
                }
            }
        }

        logger.debug(f"📡 Sending request to Perplexity with payload: {json.dumps(payload)[:500]}...")

        session = requests.Session()
        retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
        session.mount("https://", HTTPAdapter(max_retries=retries))

        try:
            logger.info("📨 Sending request to Perplexity API...")
            start_time = time.perf_counter()
            response = session.post("https://api.perplexity.ai/chat/completions", headers=HEADERS, json=payload)
            duration = time.perf_counter() - start_time
            logger.info(f"✅ API request completed in {duration:.2f} seconds")

            if response.status_code != 200:
                logger.error(f"❌ Perplexity API returned error {response.status_code}")
                logger.error(f"📄 Full response: {response.text}")
                raise Exception(f"API request failed with status code {response.status_code}")

            content = response.json()
            logger.debug(f"📬 Raw response JSON: {json.dumps(content)}")

            if "choices" not in content or not content["choices"]:
                raise KeyError("Missing or empty 'choices' key in API response")

            raw_json_text = content["choices"][0]["message"]["content"]
            logger.debug(f"🧾 Raw model output:\n{raw_json_text}")

            report = _safe_parse_json(raw_json_text)

            logger.debug("🖨️ Calling PDF generation helper...")
            pdf_url = _create_pdf(report, address, filename)

            logger.info(f"✅ Report generation completed successfully for task {task_id}")
            return report

        except Exception as e:
            logger.error(f"❌ Unhandled error during API call or parsing: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")


            raise

    except Exception as e:
        logger.error(f"❌ Unhandled error in generate_report: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise