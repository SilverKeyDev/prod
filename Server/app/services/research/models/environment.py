from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class ClimateEnvironmentalSafety(BaseModel):
    """Climate preference, flood/fire/hurricane risk"""
    climate_rating: str = Field(..., description="Overall climate and environmental safety score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    climate: str = Field(..., description="Climate characteristics and weather patterns. Extremely brief.")
    flood_risk: str = Field(..., description="Flood risk assessment and flood zones. Extremely brief.")
    fire_risk: str = Field(..., description="Fire risk assessment and wildfire danger. Extremely brief.")
    hurricane_risk: str = Field(..., description="Hurricane/tornado risk assessment. Extremely brief.")
    environmental_safety: str = Field(..., description="Overall environmental safety and natural disaster risk. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        return {
            "climate_rating": "9.0",
            "climate": "Mediterranean climate: mild winters, warm summers, low humidity, 280 sunny days/year",
            "flood_risk": "Low flood risk: not in flood zone, good drainage, elevated above sea level",
            "fire_risk": "Moderate fire risk: some brush areas, but good fire department response, defensible space",
            "hurricane_risk": "Very low hurricane risk: outside hurricane zone, minimal severe weather",
            "environmental_safety": "Good air quality, low pollution, safe water supply, minimal environmental hazards"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        return {
            "climate_rating": "Overall climate and environmental safety score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's preferences.",
            "climate": "Climate characteristics including temperature, precipitation, and weather patterns. Extremely brief.",
            "flood_risk": "Flood risk assessment including flood zones, historical flooding, and mitigation measures. Extremely brief.",
            "fire_risk": "Fire risk assessment including wildfire danger, defensible space, and fire department response. Extremely brief.",
            "hurricane_risk": "Hurricane/tornado risk assessment and severe weather patterns. Extremely brief.",
            "environmental_safety": "Overall environmental safety including air quality, water quality, and natural disaster risk. Extremely brief."
        }
