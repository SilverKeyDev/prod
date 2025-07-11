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
from .prompt_generator import generate_prompt

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

# Store reports in memory (should use a database in production)
REPORTS = {}

# -------------------- UTILS --------------------

def validate_address(address: str) -> bool:
    """Validate that the address is provided and is a string"""
    if not address:
        logger.error("❌ Address is empty or None")
        return False
    
    if not isinstance(address, str):
        logger.error(f"❌ Address is not a string: {type(address)}")
        return False
    
    if len(address.strip()) == 0:
        logger.error("❌ Address is empty after stripping whitespace")
        return False
    
    logger.debug(f"✅ Address validation passed: {address}")
    return True

def _safe_parse_json(text: str):
    try:
        logger.debug("🔧 Cleaning and attempting to parse model output as JSON")
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
        cleaned = re.sub(r'&lt;think&gt;.*?&lt;/think&gt;', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
        cleaned = cleaned.strip()

        matches = re.findall(r'{[\s\S]*}', cleaned)
        logger.debug(f"🔍 Found {len(matches)} potential JSON blocks")

        for match in sorted(matches, key=len, reverse=True):
            try:
                logger.debug("🔑 Trying to parse JSON using `json.loads()`")
                return json.loads(match)
            except json.JSONDecodeError:
                logger.warning("⚠️ Failed with `json.loads`, trying `json5.loads`")
                try:
                    return json5.loads(match)
                except Exception as e:
                    logger.debug(f"⛔ `json5` parse also failed: {str(e)}")
                    continue

        logger.error("❌ Failed to parse any valid JSON from model output")
        raise ValueError("Could not parse any valid JSON block")

    except Exception as e:
        logger.error(f"🛑 Exception during JSON parsing: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise ValueError("Failed to parse JSON from model output") from e

# -------------------- MAIN FUNCTION --------------------

def generate_report(address: str) -> Dict:
    """Generate a comprehensive property report and upload PDF to S3"""
    task_id = str(uuid.uuid4())
    logger.info(f"📝 Starting report generation for address: {address}")
    logger.info(f"🆔 Task ID: {task_id}")

    REPORTS[task_id] = {
        "address": address,
        "status": "generating",
        "timestamp": time.time(),
    }

    try:
        # Validate address
        if not validate_address(address):
            logger.error("🚫 Address validation failed")
            REPORTS[task_id]["status"] = "failed"
            REPORTS[task_id]["error"] = "Invalid address format"
            raise ValueError("Invalid address format")

        logger.info("✅ Address validation passed, building prompt")

        prompt = generate_prompt(address)

        logger.debug("🧠 Prompt assembled successfully")

        payload = {
            "model": "sonar-deep-research",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a strict JSON-only generator. DO NOT include any think tags, markdown, or explanation. "
                        "You MUST respond with a valid JSON object only. Begin with '{' and end with '}'. No extra text. "
                        "You are generating a comprehensive lifestyle and culture report for a given address. "
                        "Use only verified online sources. Fill out ALL fields with accurate, up-to-date information."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "search_mode": "web",
            "reasoning_effort": "high", 
            "temperature": 0.1,
            "max_tokens": 20000,
            "stream": False,
            "return_images": True,
            "return_related_questions": True
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
            logger.debug(f"📬 Raw response JSON: {json.dumps(content)[:1000]}...")

            if "choices" not in content or not content["choices"]:
                raise KeyError("Missing or empty 'choices' key in API response")

            raw_json_text = content["choices"][0]["message"]["content"]
            logger.debug(f"🧾 Raw model output:\n{raw_json_text[:1000]}...")

            report = _safe_parse_json(raw_json_text)

            logger.debug("🖨️ Calling PDF generation helper...")
            pdf_url = _create_pdf(report, address)

            REPORTS[task_id] = {
                "address": address,
                "status": "completed",
                "report": report,
                "pdfUrl": pdf_url,
                "timestamp": time.time(),
            }

            logger.info(f"✅ Report generation completed successfully for task {task_id}")
            return report

        except Exception as e:
            logger.error(f"❌ Unhandled error during API call or parsing: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")

            REPORTS[task_id]["status"] = "failed"
            REPORTS[task_id]["error"] = str(e)
            raise

    except Exception as e:
        logger.error(f"❌ Unhandled error in generate_report: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        REPORTS[task_id]["status"] = "failed"
        REPORTS[task_id]["error"] = str(e)
        raise