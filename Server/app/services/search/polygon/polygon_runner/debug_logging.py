"""Debug logging helper for polygon search."""

import json
import time

from flask import current_app

_AGENT_DEBUG_LOG_PRIMARY = "/Users/jaycewalzer/Desktop/SilverKey/.cursor/debug-8adfea.log"
_AGENT_DEBUG_LOG_FALLBACK = "/tmp/silverkey-debug-8adfea.log"


def agent_debug_log(message: str, data: dict, hypothesis_id: str) -> None:
    """Append one NDJSON line for Cursor debug session (no PII); mirror to Flask log for Docker/HTTPS."""
    payload = {
        "sessionId": "8adfea",
        "timestamp": int(time.time() * 1000),
        "location": "polygon_search_runner.run_polygon_search",
        "message": message,
        "data": data,
        "hypothesisId": hypothesis_id,
    }
    line = json.dumps(payload, default=str) + "\n"
    try:
        current_app.logger.info("SILVERKEY_AGENT_DEBUG %s", line.strip())
    except RuntimeError:
        pass
    for path in (_AGENT_DEBUG_LOG_PRIMARY, _AGENT_DEBUG_LOG_FALLBACK):
        try:
            with open(path, "a", encoding="utf-8") as f:
                f.write(line)
            break
        except OSError:
            continue
