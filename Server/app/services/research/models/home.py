from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class Home(BaseModel):
    """Features, layout, condition, style, deal breakers"""
    home_match_rating: str = Field(..., description="Overall home match score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    desired_features_match: str = Field(..., description="How well the home matches user's preferred home features. Extremely brief.")
    deal_breakers_check: str = Field(..., description="Assessment of any deal breakers present or absent. Extremely brief.")
    layout_and_size: str = Field(..., description="Bedrooms, bathrooms, square footage, and layout match to preferences. Extremely brief.")
    condition_and_style: str = Field(..., description="Home age, architectural style, renovation needs, and overall condition. Extremely brief.")
    property_features: str = Field(..., description="Lot size, parking, outdoor space, and other property-specific features. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        preferred_features = user_preferences.get("preferred_home_features", []) if user_preferences else []
        deal_breakers = user_preferences.get("deal_breakers", []) if user_preferences else []
        bedrooms = user_preferences.get("preferred_bedrooms", 3) if user_preferences else 3
        bathrooms = user_preferences.get("preferred_bathrooms", 2) if user_preferences else 2
        
        features_match = "Matches most desired features" if preferred_features else "Standard features present"
        if preferred_features:
            features_match = f"Has {', '.join(preferred_features[:3])}" + (f" and more" if len(preferred_features) > 3 else "")
        
        deal_breaker_check = "No major deal breakers present" if not deal_breakers else f"Note: Check for {', '.join(deal_breakers[:2])}"
        
        return {
            "home_match_rating": "8.5",
            "desired_features_match": features_match,
            "deal_breakers_check": deal_breaker_check,
            "layout_and_size": f"{bedrooms} bedrooms, {bathrooms} bathrooms, layout matches preferences",
            "condition_and_style": "Well-maintained, modern updates, matches preferred architectural style",
            "property_features": "Good lot size, driveway parking, fenced yard, outdoor space"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        preferred_features = user_preferences.get("preferred_home_features", []) if user_preferences else []
        deal_breakers = user_preferences.get("deal_breakers", []) if user_preferences else []
        bedrooms = user_preferences.get("preferred_bedrooms") if user_preferences else None
        bathrooms = user_preferences.get("preferred_bathrooms") if user_preferences else None
        housing_type = user_preferences.get("preferred_housing_type", "") if user_preferences else ""
        home_age = user_preferences.get("preferred_home_age", "") if user_preferences else ""
        architectural_style = user_preferences.get("preferred_architectural_style", "") if user_preferences else ""
        renovation_preference = user_preferences.get("renovation_preference", "") if user_preferences else ""
        lot_size = user_preferences.get("preferred_lot_size", "") if user_preferences else ""
        
        features_text = f"User wants: {', '.join(preferred_features)}" if preferred_features else "No specific features requested"
        deal_breakers_text = f"User's deal breakers: {', '.join(deal_breakers)}" if deal_breakers else "No deal breakers specified"
        
        return {
            "home_match_rating": "Overall home match score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight based on how well home matches user's preferences.",
            "desired_features_match": f"How well the home matches user's preferred features. {features_text}. Extremely brief.",
            "deal_breakers_check": f"Assessment of any deal breakers present or absent. {deal_breakers_text}. Extremely brief.",
            "layout_and_size": f"Bedrooms, bathrooms, square footage, and layout match to preferences. User wants: {bedrooms} bedrooms, {bathrooms} bathrooms, {housing_type}. Extremely brief.",
            "condition_and_style": f"Home age, architectural style, renovation needs, and overall condition. User prefers: {home_age} age, {architectural_style} style, {renovation_preference} renovation level. Extremely brief.",
            "property_features": f"Lot size, parking, outdoor space, and other property-specific features. User prefers: {lot_size} lot size. Extremely brief."
        }
