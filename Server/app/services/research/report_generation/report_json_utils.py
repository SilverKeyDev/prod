"""
JSON cleanup, placeholder PDF, and validation utilities for research report generation.
"""

import json
import re
import traceback
from io import BytesIO

from logger import log

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    _letter_pagesize = letter
except Exception:  # pragma: no cover
    canvas = None
    _letter_pagesize = None


def create_placeholder_pdf() -> bytes:
    if not canvas or _letter_pagesize is None:
        return b"%PDF-1.4\n% placeholder\n"
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=_letter_pagesize)
    c.drawString(72, 750, "Report is generating...")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


def validate_address(address: str) -> bool:
    if not address or not isinstance(address, str):
        log.error("PROPERTY_DETAILS", "Address is empty or not a string")
        return False
    if len(address.strip()) == 0:
        log.error("PROPERTY_DETAILS", "Address is empty after stripping whitespace")
        return False
    return True


def _remove_empty_fields(obj):
    """
    Recursively remove fields that are None, empty strings, empty lists, or empty dicts.
    """
    if isinstance(obj, dict):
        return {
            k: _remove_empty_fields(v)
            for k, v in obj.items()
            if v is not None and v != "" and v != [] and v != {}
        }
    elif isinstance(obj, list):
        return [
            _remove_empty_fields(item)
            for item in obj
            if item is not None and item != "" and item != [] and item != {}
        ]
    else:
        return obj


def _fix_object_placeholders(obj):
    """
    Recursively fix [object Object] placeholders and other problematic content.
    """
    if isinstance(obj, dict):
        return {k: _fix_object_placeholders(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        fixed_list = []
        for item in obj:
            if isinstance(item, str):
                if item == "[object Object]" or item.strip() == "[object Object]":
                    continue
                item = item.replace("[object Object]", "").strip()
                if item:
                    fixed_list.append(item)
            else:
                fixed_item = _fix_object_placeholders(item)
                if fixed_item:
                    fixed_list.append(fixed_item)
        return fixed_list
    elif isinstance(obj, str):
        if obj == "[object Object]" or obj.strip() == "[object Object]":
            return ""
        return obj.replace("[object Object]", "").strip()
    else:
        return obj


def _safe_parse_json(text: str, report_customization: dict | None = None) -> dict:
    try:
        cleaned = re.sub(
            r"(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)",
            "",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        ).strip()
        cleaned = cleaned.replace(""", '"').replace(""", '"').replace("'", "'")
        cleaned = re.sub(r",(\s*[}\]])", r"\1", cleaned)

        lines = cleaned.split("\n")
        fixed_lines = []
        for line in lines:
            if '"' in line and line.count('"') % 2 != 0:
                if (
                    line.strip().endswith(",")
                    or line.strip().endswith("{")
                    or line.strip().endswith("[")
                ):
                    line = re.sub(r'([^"]*"[^"]*)(,|\{|\[)\s*$', r'\1"\2', line)
                elif not line.strip().endswith('"'):
                    line = line.rstrip() + '"'
            fixed_lines.append(line)

        cleaned = "\n".join(fixed_lines)
        cleaned = re.sub(r'"\s*"\s*:', '"":', cleaned)
        cleaned = re.sub(r':\s*"\s*"\s*,', ': "",', cleaned)
        cleaned = re.sub(r'("buy",\s*"sell",\s*){3,}("buy",?\s*)', r'"buy", "sell"', cleaned)
        cleaned = re.sub(r'("sell",\s*"buy",\s*){3,}("sell",?\s*)', r'"sell", "buy"', cleaned)
        cleaned = re.sub(r',\s*("buy",\s*"sell",?\s*)+\]', "]", cleaned)
        cleaned = re.sub(r',\s*("sell",\s*"buy",?\s*)+\]', "]", cleaned)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            start = max(0, e.pos - 100)
            end = min(len(cleaned), e.pos + 100)
            log.error(
                "ERRORS",
                "Failed to parse structured JSON",
                {
                    "error": str(e),
                    "position": e.pos,
                    "context": cleaned[start:end],
                    "traceback": traceback.format_exc(),
                },
            )
            try:
                truncated = cleaned[: e.pos]
                open_braces = truncated.count("{") - truncated.count("}")
                open_brackets = truncated.count("[") - truncated.count("]")
                truncated = re.sub(r',\s*"[^"]*"?\s*$', "", truncated)
                truncated = re.sub(r",\s*$", "", truncated)
                for _ in range(open_brackets):
                    truncated += "]"
                for _ in range(open_braces):
                    truncated += "}"
                parsed = json.loads(truncated)
            except Exception:
                raise ValueError("Failed to parse structured JSON from model output") from e

        parsed = _remove_empty_fields(parsed)
        parsed = _fix_object_placeholders(parsed)
        return parsed if isinstance(parsed, dict) else {}

    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to parse structured JSON",
            {"error": str(e), "traceback": traceback.format_exc()},
        )
        raise ValueError("Failed to parse structured JSON from model output") from e
