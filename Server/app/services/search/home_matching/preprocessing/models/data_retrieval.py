"""
Data retrieval wrapper for home matching preprocessing models.

This module provides thin wrappers that delegate to the actual data retrieval
functions in user_input_data.py and home_input_data.py.
"""

from typing import Any, cast

from .embedding_input import EmbeddingHomeInput, EmbeddingUserInput


class UserDataRetriever:
    """Thin wrapper for user data retrieval functions."""

    @staticmethod
    def from_database(user_id: str) -> dict[str, Any] | None:
        """
        Retrieve user data from database.

        Delegates to user_input_data.get_user_data()

        Args:
            user_id: User ID to retrieve

        Returns:
            User data dictionary or None if not found
        """
        from ..user_input_data import get_user_data

        return get_user_data(user_id=user_id)

    @staticmethod
    def from_dict(user_data_dict: dict[str, Any]) -> dict[str, Any]:
        """
        Format user data from dictionary.

        Delegates to user_input_data.get_user_data()

        Args:
            user_data_dict: Dictionary containing user data

        Returns:
            Formatted user data dictionary
        """
        from ..user_input_data import get_user_data

        result = get_user_data(user_data_dict=user_data_dict)
        if result is None:
            raise ValueError("get_user_data returned None for user_data_dict input")
        return result

    @staticmethod
    def from_api(api_response: dict[str, Any]) -> dict[str, Any]:
        """
        Format user data from API response.

        Args:
            api_response: API response dictionary

        Returns:
            Formatted user data dictionary
        """
        return UserDataRetriever.from_dict(api_response)

    @staticmethod
    def to_embedding_input(user_data: dict[str, Any]) -> EmbeddingUserInput:
        """
        Convert user data dictionary to embedding input.

        Args:
            user_data: User data dictionary

        Returns:
            EmbeddingUserInput instance
        """
        return cast(EmbeddingUserInput, EmbeddingUserInput.from_dict(user_data))


class HomeDataRetriever:
    """Thin wrapper for home data retrieval functions."""

    @staticmethod
    def from_database(home_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        """
        Retrieve home data from database.

        Delegates to home_input_data.get_home_data()

        Args:
            home_id: Home ID to retrieve
            user_id: Optional user ID for filtering

        Returns:
            Home data dictionary or None if not found
        """
        from ..home_input_data import get_home_data

        return get_home_data(home_id=home_id, user_id=user_id)

    @staticmethod
    def from_dict(home_data_dict: dict[str, Any]) -> dict[str, Any]:
        """
        Format home data from dictionary.

        Delegates to home_input_data.get_home_data()

        Args:
            home_data_dict: Dictionary containing home data

        Returns:
            Formatted home data dictionary
        """
        from ..home_input_data import get_home_data

        result = get_home_data(home_data_dict=home_data_dict)
        if result is None:
            raise ValueError("get_home_data returned None for home_data_dict input")
        return result

    @staticmethod
    def from_api(api_response: dict[str, Any]) -> dict[str, Any]:
        """
        Format home data from API response.

        Delegates to home_input_data.get_home_data()

        Args:
            api_response: API response dictionary

        Returns:
            Formatted home data dictionary
        """
        from ..home_input_data import get_home_data

        result = get_home_data(home_data_dict=api_response)
        if result is None:
            raise ValueError("get_home_data returned None for api_response input")
        return result

    @staticmethod
    def enrich_with_scraping(
        home_data: dict[str, Any],
        google_maps_api_key: str | None = None,
        user_preferences: Any | None = None,
    ) -> dict[str, Any]:
        """
        Enrich home data with additional data from external APIs.

        Note: This function modifies the home_data dict in place and returns it.

        Args:
            home_data: Home data dictionary to enrich
            google_maps_api_key: Google Maps API key for commute data
            user_preferences: User preferences for commute calculation

        Returns:
            Enriched home data dictionary
        """
        return home_data

    @staticmethod
    def to_embedding_input(home_data: dict[str, Any]) -> EmbeddingHomeInput:
        """
        Convert home data dictionary to embedding input.

        Args:
            home_data: Home data dictionary

        Returns:
            EmbeddingHomeInput instance
        """
        return cast(EmbeddingHomeInput, EmbeddingHomeInput.from_dict(home_data))
