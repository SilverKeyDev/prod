from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class FamilyFriendlySection(BaseModel):
    """Schools, parks, healthcare, kid-friendly amenities"""

    family_rating: str = Field(...)
    parks_and_recreation: str = Field(...)
    kid_friendly_amenities: str = Field(...)
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions - single source of truth for field descriptions"""
        
        return {
            "family_rating": "Overall family-friendliness score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's family needs.",
            "parks_and_recreation": "Parks, playgrounds, recreational facilities, and family activities available. Extremely brief.",
            "kid_friendly_amenities": "Kid-friendly amenities including libraries, museums, safe areas, and activities. Extremely brief."
        }
    
    @classmethod
    def get_comparison_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "family_rating": "Decimal rating (e.g., 8.5).",
            "parks_and_recreation": "Parks and recreation facilities summary.",
            "kid_friendly_amenities": "Kid-friendly amenities brief summary."
        }
