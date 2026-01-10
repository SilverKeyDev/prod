"""
Preprocessing models for home matching system.

This module provides typed model classes for data structures passed to
embeddings, ensemble, and llm_scorer modules.
"""

from .base import BaseInputModel
from .embedding_input import EmbeddingUserInput, EmbeddingHomeInput
from .llm_input import LLMUserInput, LLMHomeInput
from .data_retrieval import UserDataRetriever, HomeDataRetriever

__all__ = [
    # Base
    'BaseInputModel',
    # Embedding models
    'EmbeddingUserInput',
    'EmbeddingHomeInput',
    # LLM models
    'LLMUserInput',
    'LLMHomeInput',
    # Data retrieval
    'UserDataRetriever',
    'HomeDataRetriever',
]
