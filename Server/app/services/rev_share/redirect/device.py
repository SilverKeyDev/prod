"""Coarse user-agent device classification for analytics."""

from __future__ import annotations


def classify_device(user_agent: str | None) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if "ipad" in ua or "tablet" in ua:
        return "tablet"
    if "mobile" in ua or "iphone" in ua or "android" in ua:
        return "mobile"
    if "mozilla" in ua or "chrome" in ua or "safari" in ua or "firefox" in ua:
        return "desktop"
    return "unknown"
