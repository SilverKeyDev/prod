"""
Preprocessing models for home matching system.

This module provides typed model classes for data structures passed to
embeddings and ensemble modules.
"""

from .base import BaseInputModel
from .embedding_input import EmbeddingUserInput, EmbeddingHomeInput
from .data_retrieval import UserDataRetriever, HomeDataRetriever

__all__ = [
    # Base
    'BaseInputModel',
    # Embedding models
    'EmbeddingUserInput',
    'EmbeddingHomeInput',
    # Data retrieval
    'UserDataRetriever',
    'HomeDataRetriever',
]
