from typing import Any

from pydantic import BaseModel, Field


class Home(BaseModel):
    """Features, layout, condition, style, deal breakers"""

    home_match_rating: str = Field(...)
    desired_features_match: str = Field(...)
    deal_breakers_check: str = Field(...)
    layout_and_size: str = Field(...)
    condition_and_style: str = Field(...)
    property_features: str = Field(...)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @classmethod
    def get_description(cls, user_preferences: dict[str, Any] | None = None) -> dict[str, str]:
        """Generate personalized field descriptions"""
        preferred_features = (
            user_preferences.get("preferred_home_features", []) if user_preferences else []
        )
        deal_breakers = user_preferences.get("deal_breakers", []) if user_preferences else []
        bed_min = user_preferences.get("preferred_bedrooms_min") if user_preferences else None
        bed_max = user_preferences.get("preferred_bedrooms_max") if user_preferences else None
        bath_min = user_preferences.get("preferred_bathrooms_min") if user_preferences else None
        bath_max = user_preferences.get("preferred_bathrooms_max") if user_preferences else None
        if bed_min is not None or bed_max is not None:
            bedrooms = f"{bed_min or 'any'}–{bed_max or 'any'}"
        else:
            bedrooms = None
        if bath_min is not None or bath_max is not None:
            bathrooms = f"{bath_min or 'any'}–{bath_max or 'any'}"
        else:
            bathrooms = None
        housing_type = (
            user_preferences.get("preferred_housing_type", "") if user_preferences else ""
        )
        home_age = user_preferences.get("preferred_home_age", "") if user_preferences else ""
        home_age_min = user_preferences.get("preferred_home_age_min") if user_preferences else None
        home_age_max = user_preferences.get("preferred_home_age_max") if user_preferences else None
        home_age_range = ""
        if home_age_min is not None or home_age_max is not None:
            home_age_range = f"{home_age_min or 'any'}–{home_age_max or 'any'} years"
        elif home_age:
            home_age_range = home_age
        architectural_style = (
            user_preferences.get("preferred_architectural_style", "") if user_preferences else ""
        )
        renovation_preference = (
            user_preferences.get("renovation_preference", "") if user_preferences else ""
        )
        lot_size = user_preferences.get("preferred_lot_size", "") if user_preferences else ""
        lot_min = user_preferences.get("preferred_lot_size_min") if user_preferences else None
        lot_max = user_preferences.get("preferred_lot_size_max") if user_preferences else None
        lot_range = ""
        if lot_min is not None or lot_max is not None:
            lot_range = f"{lot_min or 'any'}–{lot_max or 'any'} acres"
        elif lot_size:
            lot_range = lot_size

        features_text = (
            f"User wants: {', '.join(preferred_features)}"
            if preferred_features
            else "No specific features requested"
        )
        deal_breakers_text = (
            f"User's deal breakers: {', '.join(deal_breakers)}"
            if deal_breakers
            else "No deal breakers specified"
        )

        return {
            "home_match_rating": "Overall home match score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight based on how well home matches user's preferences.",
            "desired_features_match": f"How well the home matches user's preferred features. {features_text}. Extremely brief.",
            "deal_breakers_check": f"Assessment of any deal breakers present or absent. {deal_breakers_text}. Extremely brief.",
            "layout_and_size": f"Bedrooms, bathrooms, square footage, and layout match to preferences. User wants: {bedrooms or 'any'} bedrooms, {bathrooms or 'any'} bathrooms, {housing_type}. Extremely brief.",
            "condition_and_style": f"Home age, architectural style, renovation needs, and overall condition. User prefers: {home_age_range or 'any'} age, {architectural_style} style, {renovation_preference} renovation level. Extremely brief.",
            "property_features": f"Lot size, parking, outdoor space, and other property-specific features. User prefers: {lot_range or 'any'} lot size. Extremely brief.",
        }

    @classmethod
    def get_comparison_description(
        cls, user_preferences: dict[str, Any] | None = None
    ) -> dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "home_match_rating": "Decimal rating (e.g., 8.5).",
            "layout_and_size": "Bedrooms, bathrooms, square footage summary.",
            "condition_and_style": "Age, style, condition brief summary.",
        }
