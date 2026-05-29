"""Flask URL rule normalization for telemetry and route inventory."""

from __future__ import annotations

import re


def normalize_flask_route_rule(rule: str) -> str:
    """Rewrite Flask ``<converter:name>`` segments to OpenAPI-style ``{name}``."""
    return re.sub(
        r"<[^>]+>",
        lambda match: "{" + match.group(0)[1:-1].split(":")[-1] + "}",
        rule,
    )
