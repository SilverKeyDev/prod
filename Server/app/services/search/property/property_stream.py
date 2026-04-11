"""Public SSE entrypoints for property streaming."""

from typing import Any

from .property_stream_internal import _generate_property_stream_internal


def generate_property_stream(
    params: dict,
    address: str | None = None,
    research_body: dict[str, Any] | None = None,
):
    """Generator that yields SSE-formatted property data chunks (full mode)."""
    yield from _generate_property_stream_internal(
        params, address, skip_pros_cons=False, research_body=research_body
    )


def generate_property_stream_compare(
    params: dict,
    address: str | None = None,
    research_body: dict[str, Any] | None = None,
):
    """Generator that yields SSE-formatted property data for comparison mode."""
    yield from _generate_property_stream_internal(
        params, address, skip_pros_cons=True, research_body=research_body
    )
