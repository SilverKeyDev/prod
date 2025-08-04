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
        income_range = user_preferences.get("income_range", "middle") if user_preferences else "middle"
        
        # Customize based on user profile
        if children_count > 0:
            culture_focus = "family-oriented community with excellent schools and safe neighborhoods"
            vibe_words = "Family-friendly, safe, welcoming"
            events_focus = "Family festivals, school events, youth sports leagues, community picnics"
            love_reasons = "Top-rated schools, safe playgrounds, family-oriented neighbors"
        elif age < 30:
            culture_focus = "vibrant young professional scene with trendy cafes and nightlife"
            vibe_words = "Energetic, trendy, social"
            events_focus = "Food truck festivals, live music venues, networking events, art walks"
            love_reasons = "Walkable nightlife, co-working spaces, young professional community"
        elif "outdoor" in str(hobbies).lower() or "fitness" in str(hobbies).lower():
            culture_focus = "active outdoor lifestyle with hiking trails and fitness-focused community"
            vibe_words = "Active, healthy, outdoorsy"
            events_focus = "Farmers markets, outdoor concerts, hiking groups, cycling events"
            love_reasons = "Miles of trails, outdoor fitness classes, health-conscious community"
        else:
            culture_focus = "welcoming community with diverse amenities and cultural offerings"
            vibe_words = "Relaxed, diverse, welcoming"
            events_focus = "Community festivals, cultural events, local markets"
            love_reasons = "Friendly neighbors, local charm, convenient amenities"
        
        # Generate personalized seasonal trends
        if children_count > 0:
            seasonal_focus = "Year-round family activities - summer outdoor festivals with kids' zones, fall harvest events, winter holiday celebrations with Santa visits, and spring youth sports leagues"
        elif age < 30:
            seasonal_focus = "Dynamic seasonal scene - summer rooftop parties and outdoor concerts, fall craft beer festivals, cozy winter pop-ups and holiday markets, spring food truck rallies"
        elif "outdoor" in str(hobbies).lower():
            seasonal_focus = "Outdoor enthusiast paradise - summer hiking and cycling events, fall foliage tours, winter fitness challenges, spring farmers markets and garden tours"
        else:
            seasonal_focus = "Something special every season - summer community concerts, fall arts festivals, winter cultural events, spring neighborhood clean-up and garden parties"
        
        return {
            "home_image_prompt": f"Professional exterior photo of the EXACT address, from zillow",
            "local_culture": f"Thriving {culture_focus} that perfectly balances urban convenience with neighborhood charm, where residents genuinely know their neighbors and take pride in their community",
            "vibe": vibe_words,
            "known_for": "Award-winning local restaurants, beautiful tree-lined streets, strong sense of community, and that perfect balance of convenience and charm that makes you never want to leave",
            "community_events": events_focus,
            "what_people_love": f"{love_reasons}, plus the genuine sense of belonging and community pride that's rare to find in today's world",
            "seasonal_trends": seasonal_focus,
            "community_image_1": f"Vibrant community gathering showing residents enjoying {events_focus.split(',')[0].strip().lower()}, capturing the {vibe_words.lower()} atmosphere and genuine community connections",
            "community_image_2": f"Scenic view of the neighborhood's most beloved local amenities and gathering spaces, showcasing the {culture_focus.split(' with ')[0]} that makes this area so special"
        }

    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        # Extract detailed user preferences for enhanced personalization
        children_count = user_preferences.get("children_count", 0) if user_preferences else 0
        age = user_preferences.get("age", 35) if user_preferences else 35
        income_range = user_preferences.get("income_range", "middle") if user_preferences else "middle"
        lifestyle = user_preferences.get("lifestyle_type", "balanced") if user_preferences else "balanced"
        hobbies = user_preferences.get("hobbies_interests", ["outdoor activities"]) if user_preferences else ["outdoor activities"]
        
        # Determine focus areas based on user profile
        if children_count > 0:
            culture_focus = "family safety, school quality, and child-friendly amenities"
            event_focus = "family-oriented activities and educational opportunities"
            lifestyle_focus = "family life and child development"
        elif age < 30:
            culture_focus = "social opportunities, career networking, and entertainment"
            event_focus = "social events, nightlife, and professional networking"
            lifestyle_focus = "career growth and social connections"
        elif "outdoor" in str(hobbies).lower() or "fitness" in str(hobbies).lower():
            culture_focus = "outdoor recreation, fitness facilities, and active lifestyle"
            event_focus = "outdoor activities, fitness events, and wellness programs"
            lifestyle_focus = "health, wellness, and outdoor adventure"
        else:
            culture_focus = "community character, convenience, and quality of life"
            event_focus = "cultural activities and community engagement"
            lifestyle_focus = "comfort, convenience, and community belonging"
        
        return {
            "home_image_prompt": f"Generate a compelling exterior photo of a representative home that appeals to {income_range}-income buyers. Showcase architectural style, landscaping, and curb appeal that demonstrates the quality and character of this neighborhood. Focus on features that resonate with buyers seeking {lifestyle_focus}.",
            "local_culture": f"Craft a compelling neighborhood narrative that sells the lifestyle. Emphasize {culture_focus} using emotional language that helps buyers envision their ideal life here. Make them feel like they belong and would thrive in this community.",
            "vibe": "Choose 3-5 powerful, marketable adjectives that instantly communicate the neighborhood's personality and appeal. These words should resonate with your target buyer and be perfect for marketing headlines, social media, and elevator pitches.",
            "known_for": "Highlight the neighborhood's unique selling propositions and 'claim to fame.' Lead with the most marketable features that create buyer excitement and differentiate this area from competitors. Focus on what makes people choose this neighborhood over others.",
            "community_events": f"Showcase events and activities that demonstrate the lifestyle buyers want. Emphasize {event_focus} that show community vibrancy and help buyers imagine their social life and engagement in this neighborhood.",
            "what_people_love": f"Create emotional selling points that generate desire and urgency. Use language that helps buyers imagine themselves enjoying these benefits and feeling like they've found their perfect community. Focus on {lifestyle_focus} benefits.",
            "seasonal_trends": f"Paint a picture of year-round enjoyment and community engagement. Show how the neighborhood stays vibrant across all seasons with activities that appeal to buyers interested in {lifestyle_focus}. Make every season sound exciting and fulfilling.",
            "community_image_1": f"Generate an engaging photo of community life that showcases {event_focus}. Capture the authentic neighborhood atmosphere and the type of social connections buyers can expect. Show real community engagement and belonging.",
            "community_image_2": f"Create a scenic image of the neighborhood's most beloved amenities and spaces. Highlight features that support {lifestyle_focus} and demonstrate why residents love living here. Show the quality of life this neighborhood offers."
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
