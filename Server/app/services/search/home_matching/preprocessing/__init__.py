"""
Preprocessing module for home matching system.

This module provides functions to retrieve and format user and home data
from various sources (database, API) for use in the home matching system.

Includes typed model classes for embeddings.
"""

from .home_input_data import (
    format_home_data_for_matching,
    format_home_data_from_api,
    format_homes_data_from_api,
    get_home_data,
    get_home_data_from_db,
    get_homes_data,
    get_homes_data_from_db,
)
from .models import BaseInputModel, EmbeddingHomeInput, EmbeddingUserInput
from .user_input_data import (
    format_user_data_for_matching,
    get_user_data,
    get_user_data_from_db,
    get_user_data_from_dict,
)

__all__ = [
    "get_home_data_from_db",
    "get_homes_data_from_db",
    "format_home_data_for_matching",
    "format_home_data_from_api",
    "format_homes_data_from_api",
    "get_home_data",
    "get_homes_data",
    "get_user_data_from_db",
    "format_user_data_for_matching",
    "get_user_data_from_dict",
    "get_user_data",
    "BaseInputModel",
    "EmbeddingUserInput",
    "EmbeddingHomeInput",
]
