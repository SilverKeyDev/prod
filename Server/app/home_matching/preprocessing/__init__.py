"""
Preprocessing module for home matching system.

This module provides functions to retrieve and format user and home data
from various sources (database, API) for use in the home matching system.

Includes typed model classes for embeddings and LLM scorers.
"""

# Import existing functions for backward compatibility
from .home_input_data import (
    get_home_data_from_db,
    get_homes_data_from_db,
    format_home_data_for_matching,
    format_home_data_from_api,
    format_homes_data_from_api,
    get_home_data,
    get_homes_data,
)

from .user_input_data import (
    get_user_data_from_db,
    format_user_data_for_matching,
    get_user_data_from_dict,
    get_user_data,
)

# Import model classes
from .models import (
    # Base
    BaseInputModel,
    # Embedding models
    EmbeddingUserInput,
    EmbeddingHomeInput,
    # LLM models
    LLMUserInput,
    LLMHomeInput,
    # Data retrieval
    UserDataRetriever,
    HomeDataRetriever,
)

__all__ = [
    # Home data functions (backward compatible)
    'get_home_data_from_db',
    'get_homes_data_from_db',
    'format_home_data_for_matching',
    'format_home_data_from_api',
    'format_homes_data_from_api',
    'get_home_data',
    'get_homes_data',
    # User data functions (backward compatible)
    'get_user_data_from_db',
    'format_user_data_for_matching',
    'get_user_data_from_dict',
    'get_user_data',
    # Model classes
    'BaseInputModel',
    'EmbeddingUserInput',
    'EmbeddingHomeInput',
    'LLMUserInput',
    'LLMHomeInput',
    # Data retrieval
    'UserDataRetriever',
    'HomeDataRetriever',
]
