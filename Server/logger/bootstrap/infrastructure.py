"""Stdlib loggers for third-party libraries and retry hooks (not product LogPath logging)."""

from __future__ import annotations

import logging

# Re-export for tenacity/other hooks without stdlib `logging` in Server/app/.
INFRA_LOG_INFO = logging.INFO
INFRA_LOG_WARNING = logging.WARNING


def get_infrastructure_logger(name: str) -> logging.Logger:
    """Return a stdlib logger for libraries that require logging.Logger (e.g. tenacity)."""
    return logging.getLogger(name)
