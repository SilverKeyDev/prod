"""
Data retrieval wrapper for home matching preprocessing models.

This module provides thin wrappers that delegate to the actual data retrieval
functions in user_input_data.py and home_input_data.py.
"""

from typing import Dict, Any, Optional

from .embedding_input import EmbeddingUserInput, EmbeddingHomeInput
from .llm_input import LLMUserInput, LLMHomeInput


class UserDataRetriever:
    """Thin wrapper for user data retrieval functions."""
    
    @staticmethod
    def from_database(user_id: str) -> Optional[Dict[str, Any]]:
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
    def from_dict(user_data_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format user data from dictionary.
        
        Delegates to user_input_data.get_user_data()
        
        Args:
            user_data_dict: Dictionary containing user data
        
        Returns:
            Formatted user data dictionary
        """
        from ..user_input_data import get_user_data
        return get_user_data(user_data_dict=user_data_dict)
    
    @staticmethod
    def from_api(api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format user data from API response.
        
        Args:
            api_response: API response dictionary
        
        Returns:
            Formatted user data dictionary
        """
        return UserDataRetriever.from_dict(api_response)
    
    @staticmethod
    def to_embedding_input(user_data: Dict[str, Any]) -> EmbeddingUserInput:
        """
        Convert user data dictionary to embedding input.
        
        Args:
            user_data: User data dictionary
        
        Returns:
            EmbeddingUserInput instance
        """
        return EmbeddingUserInput.from_dict(user_data)
    
    @staticmethod
    def to_llm_input(user_data: Dict[str, Any]) -> LLMUserInput:
        """
        Convert user data dictionary to LLM input.
        
        Args:
            user_data: User data dictionary
        
        Returns:
            LLMUserInput instance
        """
        return LLMUserInput.from_dict(user_data)


class HomeDataRetriever:
    """Thin wrapper for home data retrieval functions."""
    
    @staticmethod
    def from_database(home_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
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
    def from_dict(home_data_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format home data from dictionary.
        
        Delegates to home_input_data.get_home_data()
        
        Args:
            home_data_dict: Dictionary containing home data
        
        Returns:
            Formatted home data dictionary
        """
        from ..home_input_data import get_home_data
        return get_home_data(home_data_dict=home_data_dict)
    
    @staticmethod
    def from_api(api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format home data from API response.
        
        Delegates to home_input_data.get_home_data()
        
        Args:
            api_response: API response dictionary
        
        Returns:
            Formatted home data dictionary
        """
        from ..home_input_data import get_home_data
        return get_home_data(home_data_dict=api_response)
    
    @staticmethod
    def enrich_with_scraping(
        home_data: Dict[str, Any],
        rapidapi_key: Optional[str] = None,
        google_maps_api_key: Optional[str] = None,
        user_preferences: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Enrich home data with additional data from scraping helpers.
        
        Note: This function modifies the home_data dict in place and returns it.
        
        Args:
            home_data: Home data dictionary to enrich
            rapidapi_key: RapidAPI key for fetching images
            google_maps_api_key: Google Maps API key for commute data
            user_preferences: User preferences for commute calculation
        
        Returns:
            Enriched home data dictionary
        """
        # Enrichment can be done here if needed
        # For now, just return the data as-is
        return home_data
    
    @staticmethod
    def to_embedding_input(home_data: Dict[str, Any]) -> EmbeddingHomeInput:
        """
        Convert home data dictionary to embedding input.
        
        Args:
            home_data: Home data dictionary
        
        Returns:
            EmbeddingHomeInput instance
        """
        return EmbeddingHomeInput.from_dict(home_data)
    
    @staticmethod
    def to_llm_input(home_data: Dict[str, Any]) -> LLMHomeInput:
        """
        Convert home data dictionary to LLM input.
        
        Args:
            home_data: Home data dictionary
        
        Returns:
            LLMHomeInput instance
        """
        return LLMHomeInput.from_dict(home_data)
