from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)


class Marketing(BaseModel):
    # Primary home image (displayed at top)
    home_image_prompt: str = Field(...)
    
    # Core neighborhood content
    local_culture: str = Field(...)
    vibe: str = Field(...)
    known_for: str = Field(...)
    community_events: str = Field(...)
    what_people_love: str = Field(...)
    seasonal_trends: str = Field(...)
    
    # Secondary community images
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
        "json_schema_extra": {
            "description": "Compare nightlife and social scene quality. Analyze nightlife vibrancy, identify best entertainment venues, and assess dating opportunities. Winner based on social activity richness and venue quality."
        }
    }


    @model_validator(mode="before")
    @classmethod
    def delete_flat_demographics(cls, values):
        if not isinstance(values, dict):
            return values

        demographic_fields_to_delete = [
            "age_distribution",
            "lifestyle_dna",
        ]

        for field in demographic_fields_to_delete:
            if field in values:
                del values[field]

        return values
            
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        # Extract user preferences for personalization
        lifestyle = user_preferences.get("lifestyle_type", "balanced") if user_preferences else "balanced"
        age = user_preferences.get("age", 35) if user_preferences else 35
        children_count = user_preferences.get("children_count", 0) if user_preferences else 0
        hobbies = user_preferences.get("hobbies_interests", ["outdoor activities"]) if user_preferences else ["outdoor activities"]
        
        # Customize based on user profile
        if children_count > 0:
            culture_focus = "family-oriented community"
            vibe_words = "Family-friendly, safe"
            events_focus = "Family festivals, school events"
            love_reasons = "Schools, playgrounds"
        elif age < 30:
            culture_focus = "young professional scene"
            vibe_words = "Energetic, trendy"
            events_focus = "Food trucks, live music"
            love_reasons = "Nightlife, co-working spaces"
        elif "outdoor" in str(hobbies).lower() or "fitness" in str(hobbies).lower():
            culture_focus = "active outdoor lifestyle"
            vibe_words = "Active, healthy"
            events_focus = "Farmers markets, hiking groups"
            love_reasons = "Trails, fitness classes"
        else:
            culture_focus = "welcoming community"
            vibe_words = "Relaxed, diverse"
            events_focus = "Community festivals, markets"
            love_reasons = "Friendly neighbors, amenities"
        
        # Generate personalized seasonal trends
        if children_count > 0:
            seasonal_focus = "Family activities year-round"
        elif age < 30:
            seasonal_focus = "Seasonal events for young professionals"
        elif "outdoor" in str(hobbies).lower():
            seasonal_focus = "Outdoor activities every season"
        else:
            seasonal_focus = "Community events throughout the year"
        
        return {
            "home_image_prompt": "Exterior photo of address",
            "image_prompt": "Community gathering near address",
            "image_prompt_2": "Local amenities near address",
            "local_culture": f"Thriving {culture_focus}",
            "vibe": vibe_words,
            "known_for": "Great restaurants, community feel",
            "community_events": events_focus,
            "what_people_love": love_reasons,
            "seasonal_trends": seasonal_focus,
        }

    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        # Extract detailed user preferences for enhanced personalization
        children_count = user_preferences.get("children_count", 0) if user_preferences else 0
        age = user_preferences.get("age", 35) if user_preferences else 35
        hobbies = user_preferences.get("hobbies_interests", ["outdoor activities"]) if user_preferences else ["outdoor activities"]
        
        # Determine focus areas based on user profile
        if children_count > 0:
            event_focus = "family activities"
            lifestyle_focus = "family life"
        elif age < 30:
            event_focus = "social events"
            lifestyle_focus = "career and social"
        elif "outdoor" in str(hobbies).lower() or "fitness" in str(hobbies).lower():
            event_focus = "outdoor activities"
            lifestyle_focus = "health and wellness"
        else:
            event_focus = "community events"
            lifestyle_focus = "community living"
        
        return {
            "home_image_prompt": "Exterior photo of address",
            "image_prompt": f"Community life showing {event_focus}",
            "image_prompt_2": f"Local amenities supporting {lifestyle_focus}",
            "vibe": "List 3-5 adjectives that describe the neighborhood's personality.",
            "known_for": "List key neighborhood features that attract buyers.",
            "community_events": f"List popular {event_focus} in the area.",
            "what_people_love": f"List top {lifestyle_focus} benefits residents enjoy.",
            "seasonal_trends": f"Briefly describe activities for each season related to {lifestyle_focus}.",
        }


class MarketingReport(BaseModel):
    # === Single marketing section ===
    marketing: Optional[Marketing] = None

    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

        
    def dict(self, **kwargs) -> Dict[str, Any]:
        """Return the marketing report data - simplified since we only have one section"""
        return super().dict(**kwargs)

    @classmethod
    def schema(cls, report_customization: Dict[str, Any] = None, **kwargs):
        """Generate schema for marketing report - simplified since we only have neighborhood_overview"""
        return super().schema(**kwargs)
