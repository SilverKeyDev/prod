"""
Base model class for preprocessing input models.

Provides common functionality like to_dict(), validation, and type checking.
"""

from abc import ABC, abstractmethod
from typing import Any

from logger import log


class BaseInputModel(ABC):
    """Abstract base class for all preprocessing input models."""

    def __init__(self, **kwargs):
        """Initialize model with keyword arguments."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    @abstractmethod
    def to_dict(self) -> dict[str, Any]:
        """
        Convert model instance to dictionary.

        Returns:
            Dictionary representation of the model
        """
        pass

    @abstractmethod
    def extract_text_features(self) -> str:
        """
        Extract and combine text features for embedding.

        Returns:
            Combined text string for embedding
        """
        pass

    def validate(self) -> bool:
        """
        Validate model data.

        Returns:
            True if valid, False otherwise
        """
        try:
            # Basic validation - check required fields
            required_fields = getattr(self, "_required_fields", [])
            for field in required_fields:
                if not hasattr(self, field) or getattr(self, field) is None:
                    log.warn("SEARCH", f"Missing required field: {field}")
                    return False
            return True
        except Exception as e:
            log.error("ERRORS", f"Validation error: {e}")
            return False

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BaseInputModel":
        """
        Create model instance from dictionary.

        Args:
            data: Dictionary containing model data

        Returns:
            Model instance
        """
        return cls(**data)

    def _validate_type(self, value: Any, expected_type: type, field_name: str) -> bool:
        """
        Validate that a value matches expected type.

        Args:
            value: Value to validate
            expected_type: Expected type
            field_name: Name of the field for error messages

        Returns:
            True if valid, False otherwise
        """
        if value is None:
            return True  # None is allowed for optional fields

        # Handle type unions (e.g., Optional[int] -> Union[int, None])
        if hasattr(expected_type, "__origin__"):
            # Handle Optional types
            if expected_type.__origin__ is type(None) or hasattr(expected_type, "__args__"):
                args = getattr(expected_type, "__args__", [])
                if type(None) in args:
                    # Optional type - check if None or matches one of the other types
                    other_types = [t for t in args if t is not type(None)]
                    if not other_types:
                        return True  # Just None type
                    return any(isinstance(value, t) for t in other_types)

        return isinstance(value, expected_type)

    def __repr__(self) -> str:
        """String representation of the model."""
        class_name = self.__class__.__name__
        return f"<{class_name} {id(self)}>"
