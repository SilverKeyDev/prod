from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class FamilyFriendlySection(BaseModel):
    """Schools, parks, healthcare, kid-friendly amenities"""
    family_rating: str = Field(..., description="Overall family-friendliness score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    parks_and_recreation: str = Field(..., description="Parks, playgrounds, and recreational facilities. Extremely brief.")
    kid_friendly_amenities: str = Field(..., description="Kid-friendly amenities and activities. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        pets = user_preferences.get("pets", 0) if user_preferences else 0
        
        return {
            "family_rating": "9.2",
            "parks_and_recreation": "3 parks within 1 mile, playgrounds, sports fields, community center with programs",
            "kid_friendly_amenities": "Libraries, museums, family events, safe pedestrian areas, bike paths"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        pets = user_preferences.get("pets", 0) if user_preferences else 0
        
        return {
            "family_rating": "Overall family-friendliness score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's family needs.",
            "schools_rating": "Overall school quality rating as decimal to tenths place (e.g., 8.5, 7.2). Extremely brief. Based on test scores, programs, and reputation.",
            "school_details": "Details about nearby schools including ratings, special programs, and standout features. Extremely brief.",
            "parks_and_recreation": "Parks, playgrounds, recreational facilities, and family activities available. Extremely brief.",
            "healthcare_access": "Healthcare facilities including hospitals, clinics, pediatric care, and urgent care. Extremely brief.",
            "kid_friendly_amenities": "Kid-friendly amenities including libraries, museums, safe areas, and activities. Extremely brief."
        }
