"""
Preprocessing models for home matching system.

This module provides typed model classes for data structures passed to
embeddings and ensemble modules.
"""

from .base import BaseInputModel
from .embedding_input import EmbeddingHomeInput, EmbeddingUserInput

__all__ = [
    "BaseInputModel",
    "EmbeddingUserInput",
    "EmbeddingHomeInput",
]
