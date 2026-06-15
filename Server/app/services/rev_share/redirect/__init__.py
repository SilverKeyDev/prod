"""Rev-share click redirect and device classification."""

from .core import RedirectClickContext, build_redirect_destination, record_click_and_get_destination
from .device import classify_device

__all__ = [
    "RedirectClickContext",
    "build_redirect_destination",
    "classify_device",
    "record_click_and_get_destination",
]
