from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union, TypedDict
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)


class LifestyleDNA(BaseModel):
    """
    The LifestyleDNA model scores how strongly a neighborhood supports or reflects various lifestyle archetypes.
    
    Each value is an **independent score from 0 to 100**, not a percentage or composition. 

    Use the **entire range**:
    - `100` = Extremely aligned with this lifestyle (this lifestyle defines the area)
    - `0` = Not at all aligned (the lifestyle is essentially absent)

    These scores should be bold and decisive — do **not** rate everything as “moderate.” 
    Most neighborhoods excel in some lifestyles and completely lack others. Reflect that contrast clearly.
    """

    Artistic: int = Field(
        ge=0, le=100,
        description="How emblematic the area is of an artistic or creative lifestyle. "
                    "Score high (80–100) for vibrant art, music, studios, and cultural events. "
                    "Score 0–20 if there's no visible creative or indie scene."
    )
    Professional: int = Field(
        ge=0, le=100,
        description="How aligned the area is with white-collar, business-focused lifestyles. "
                    "Score 100 for financial districts and business culture. "
                    "Score 0 if the area has no professional presence or appeal."
    )
    Family_Oriented: int = Field(
        ge=0, le=100,
        description="How well the area supports families. "
                    "Score high for schools, parks, low crime, and spacious homes. "
                    "Score 0 if it's nightlife-heavy, cramped, or transient."
    )
    Active_Outdoor: int = Field(
        ge=0, le=100,
        description="How well the area supports fitness and outdoor lifestyles. "
                    "Score 100 for hiking, biking, surfing, gym culture, and green space. "
                    "Score low if it's concrete, flat, or inactive."
    )
    Tech_Remote: int = Field(
        ge=0, le=100,
        description="How well-suited the area is for remote tech professionals. "
                    "Score high for coworking, startups, cafes, modern apartments, fast Wi-Fi. "
                    "Score 0 if it lacks digital infrastructure or a tech scene."
    )
    Retiree: int = Field(
        ge=0, le=100,
        description="How ideal the area is for retirees. "
                    "Score high for peace, slow pace, nature, and medical access. "
                    "Score low if it's noisy, chaotic, or youthful."
    )
    Student: int = Field(
        ge=0, le=100,
        description="How strong the student presence is. "
                    "Score high near colleges, dorms, bars, and cheap eats. "
                    "Score 0 if there's no academic or youth culture nearby."
    )
    Suburban: int = Field(
        ge=0, le=100,
        description="How suburban the layout and feel is. "
                    "Score 100 for detached homes, cul-de-sacs, big yards. "
                    "Score 0 for dense, walkable, or urban areas."
    )
    Urban: int = Field(
        ge=0, le=100,
        description="How urban the area feels. "
                    "Score high for density, walkability, transit, and city energy. "
                    "Score 0 if it's rural, spread out, or car-centric."
    )

    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    @classmethod
    def sanitize_and_validate(cls, data: dict[str, Any]) -> "LifestyleDNA":
        """
        Gracefully handle messy inputs:
        - Extracts the first number found in strings (e.g., "about 85%", "score: 110")
        - Clamps values between 0 and 100
        - Defaults to 0 if value is invalid or missing
        """
        cleaned = {}

        for field in cls.model_fields:
            raw = data.get(field)

            # Try to extract a number from a string
            if isinstance(raw, str):
                match = re.search(r"-?\d+(\.\d+)?", raw)
                raw = match.group() if match else None

            try:
                val = int(float(raw))
                val = max(0, min(val, 100))  # Clamp to [0, 100]
                cleaned[field] = val
            except (ValueError, TypeError):
                cleaned[field] = 0  # Fallback default

        return cls(**cleaned) 

    @classmethod
    def get_example(cls) -> dict:
        return {
            "Artistic": 85,
            "Professional": 95,
            "Family_Oriented": 20,
            "Active_Outdoor": 75,
            "Tech_Remote": 100,
            "Retiree": 5,
            "Student": 10,
            "Suburban": 15,
            "Urban": 95
        }


class NeighborhoodOverview(BaseModel):
    local_culture: str = Field(...)
    vibe: str = Field(...)
    known_for: str = Field(...)
    community_events: str = Field(...)
    what_people_love: str = Field(...)
    things_to_watch_out_for: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)

    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        return {
            "local_culture": f"Artistic and laid-back coastal community with a focus on marine activities. This aligns with the user lifestyle: {lifestyle}.",
            "vibe": "Creative, beachy, relaxed",
            "known_for": "Beaches, surfing, whale watching, and Dana Point Harbor",
            "community_events": "Weekly farmers market, summer concerts, Festival of Whales",
            "what_people_love": "Walkability, coastal charm, outdoor activities",
            "things_to_watch_out_for": "Crowds in summer, limited parking, weekend traffic",
            "image_prompt": "Aerial satellite view of the specific neighborhood around the address, showing the actual street layout, housing density, parks, and local landmarks that define this area",
            "image_prompt_2": "Street-level photo of the main residential streets and community character around the address, showing typical homes, sidewalks, landscaping, and neighborhood atmosphere",
        }

class Safety(BaseModel):
    crime_rating: str = Field(
        ...,
        example="Low"
    )
    places_to_watch_out_for: str = Field(
        ...,
        example="Main St after 10pm, parking lots near the train station, avoid the alley behind 5th Ave"
    )
    police_presence: str = Field(
        ...,
        example="Regular patrol cars, community policing program, quick response times"
    )
    safety_rating: str = Field(
        ...,
        example="7.8/10"
    )
    image_prompt: str = Field(
        ...,
        example="Crime map of the city showing safety statistics and incident reports for this specific neighborhood around the address"
    )
    image_prompt_2: str = Field(
        ...,
        example="Street-level photo of safety infrastructure in this neighborhood: well-lit streets, security cameras, police patrol presence, and neighborhood watch signs around {address}"
    )
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family-friendly areas with good lighting and school zones" if children_count > 0 else "well-lit streets and secure areas"
        
        return {
            "crime_rating": "Low",
            "places_to_watch_out_for": "Main St after 10pm, parking lots near the train station, avoid the alley behind 5th Ave",
            "police_presence": "Regular patrol cars, community policing program, quick response times",
            "safety_rating": "7.8/10",
            "image_prompt": "Well-lit residential streets around the address showing sidewalks, street lamps, and visible security features in this specific neighborhood",
            "image_prompt_2": "Safety infrastructure around the address: security cameras, emergency call boxes, neighborhood watch signs, and police patrol presence in this specific area"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Consider user's safety concerns if they have children
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        return {
            "crime_rating": "Crime level assessment using categories: Nonexistent, Low, Moderate, High, Very High. Base on local crime statistics, police reports, and community safety data. Use sources like local police department crime maps, Neighborhood Scout, or AreaVibes crime data. Focus on safety factors most relevant to user's situation.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk or safety concerns. Include times of day when relevant. Use local knowledge from City-Data forums, Nextdoor, or police reports. Be specific with street names and locations. Prioritize areas relevant to user's daily routines and family needs.",
            "police_presence": "Describe frequency and visibility of police patrols, community policing programs, and response times. Source from local police department websites, community meetings, or resident feedback on Nextdoor/City-Data. Emphasize community policing and response times.",
            "safety_rating": "Overall safety score out of 10 based on crime data, community perception, and safety infrastructure. Use data from AreaVibes, Neighborhood Scout, or local crime statistics. Format as 'X.X/10'. Weight factors based on user's safety priorities.",
            "image_prompt": f"Crime map of the city showing safety statistics, incident reports, and crime density for this specific neighborhood around the address (emphasizing {safety_focus} safety concerns).",
            "image_prompt_2": f"Street-level photo of safety infrastructure in this neighborhood: well-lit streets, security cameras, police patrol presence, and neighborhood watch signs around the address (focusing on {safety_focus} safety features)."
        }

class CultureAndEvents(BaseModel):
    local_events: str = Field(...)
    seasonal_trends: str = Field(...)
    community_engagement: str = Field(...)
    culture_rating: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": "Art walks, food truck festivals, outdoor movie nights, farmers markets",
            "seasonal_trends": "Busy summers with beach events, quieter winters with indoor cultural activities",
            "community_engagement": "Active neighborhood watch, volunteer cleanup days, high voter turnout",
            "culture_rating": "8.5/10",
            "image_prompt": "Photo of actual cultural events and festivals happening in the city near the address, showing local community gatherings, street fairs, or seasonal celebrations specific to this neighborhood",
            "image_prompt_2": "Photo of cultural venues and event spaces in the city around the address: local theaters, art galleries, community centers, or performance venues that serve this neighborhood"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": f"Events people attend — use names or examples. Search Eventbrite, Meetup, City-Data Forums for specific events. Focus on events that align with user's interests: {hobbies_str}. Include real event names and venues when possible.",
            "seasonal_trends": "How activity changes throughout the year, e.g., 'Busy in summer, quieter winters'. Check Nomad List or blog search results for seasonal patterns. Consider how seasons affect the user's preferred activities and lifestyle.",
            "community_engagement": "Civic participation level (e.g., cleanup days, local watch groups). Mention if visible on Meetup or community forums. Assess opportunities for user involvement based on their community involvement preferences.",
            "culture_rating": "Score should reflect vibrancy and access. Weigh frequency and diversity of events, Eventbrite density is a clue for cultural activity. Rate based on cultural factors that matter most to the user's interests and lifestyle.",
            "image_prompt": "Photo of actual cultural venues, event spaces, or community gathering places in the city around the address, showing the specific locations where local events and activities take place.",
            "image_prompt_2": "Photo of local cultural infrastructure in the city near the address: art galleries, theaters, community centers, libraries, or performance venues that serve this neighborhood."
        }

class SocialCharacter(BaseModel):
    income_level: str = Field(...)
    religiosity: str = Field(...)
    cultural_tone: str = Field(...)
    social_rating: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": "Middle-class professionals and young families, median household income $75,000",
            "religiosity": "Moderate - several churches and temples, but not overly conservative",
            "cultural_tone": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
            "social_rating": "8.2/10",
            "image_prompt": "Photo of local community spaces and social gathering areas in the city around the address, showing where residents interact and socialize in this specific neighborhood",
            "image_prompt_2": "Photo of religious buildings, community centers, local coffee shops, or social venues in the city near the address that reflect the neighborhood's social and cultural character"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": f"E.g., 'Middle-class professionals'. Use Niche or AreaVibes income distribution. Consider how the income levels align with user's financial situation ({income_range}) and social comfort.",
            "political_leaning": "State clearly. Use Niche political maps or Redfin voting overlays if accessible.",
            "language_spoken": "Include major spoken languages beyond English. Niche + City-Data often break this down.",
            "religiosity": "Low / Moderate / High — explain the tone. Use BestPlaces religion % or Niche. Assess compatibility with user's spiritual preferences and tolerance for religious influence.",
            "cultural_tone": "Summary of vibe ('laid-back but proud'). Pull from Google Maps reviews or Niche user feedback. Focus on cultural aspects that match user's social preferences and values.",
            "social_rating": "Reflects inclusivity, education, worldview. Niche 'diversity' and 'community' scores are good proxies. Weight factors based on user's social priorities and community involvement preferences.",
            "image_prompt": "Photo of community spaces, local businesses, and neighborhood gathering areas in the city around the address that reflect the social character and daily life of this specific area.",
            "image_prompt_2": "Photo of religious institutions, community centers, local cafes, or social venues in the city near the address that demonstrate the neighborhood's cultural and social diversity."
        }

class Restaurant(BaseModel):
    name: str = Field(...)
    vibe: Optional[str] = Field(None)
    what_to_try: Optional[str] = Field(None)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Restaurant data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        
        if lifestyle == 'nightlife' and income in ['high', 'very_high']:
            return {
                "name": "The Rooftop Lounge",
                "vibe": "Upscale cocktail bar with city skyline views and live DJ sets",
                "what_to_try": "Craft cocktails, wagyu sliders, truffle fries"
            }
        elif lifestyle == 'family' or user_preferences.get('children_count', 0) > 0:
            return {
                "name": "Family Garden Bistro",
                "vibe": "Kid-friendly restaurant with outdoor seating and play area",
                "what_to_try": "Wood-fired pizza, fresh salads, homemade ice cream"
            }
        else:
            return {
                "name": "The Coastal Kitchen",
                "vibe": "Casual beachside dining with ocean views",
                "what_to_try": "Fish tacos, clam chowder, sunset cocktails"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Restaurant based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        dining_prefs = user_preferences.get('dining_preferences', []) if user_preferences else []
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        
        if lifestyle == 'nightlife':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on trendy spots, late-night dining, and social venues that align with an active nightlife lifestyle. Consider user's dining preferences: {dining_str}."
        elif lifestyle == 'family':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on family-friendly restaurants with kid-friendly menus, accommodating atmospheres, and convenient locations for families. Consider user's dining preferences: {dining_str}."
        else:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Showcase the local culinary scene and dining options available to residents. Consider user's dining preferences: {dining_str}."

class Activity(BaseModel):
    name: str = Field(...)
    description: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Activity data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        children = user_preferences.get('children_count', 0)
        
        if lifestyle == 'active' or age < 35:
            return {
                "name": "Morning Beach Volleyball League",
                "description": "Competitive and recreational volleyball games every weekend morning, welcoming players of all skill levels with organized tournaments"
            }
        elif children > 0:
            return {
                "name": "Family Adventure Park",
                "description": "Interactive outdoor adventure course with zip lines, climbing walls, and nature trails designed for families with children of all ages"
            }
        else:
            return {
                "name": "Sunset Beach Volleyball",
                "description": "Popular evening volleyball games on the main beach, welcoming to all skill levels"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Activity based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        children = user_preferences.get('children_count', 0) if user_preferences else 0
        hobbies = user_preferences.get('hobbies_interests', []) if user_preferences else []
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        if lifestyle == 'active':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on activities that promote an active lifestyle, including sports, fitness activities, and outdoor adventures. Consider user's interests: {hobbies_str}."
        elif children > 0:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on family-oriented activities and attractions suitable for families with children. Consider user's interests: {hobbies_str}."
        else:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Highlight recreational opportunities and community engagement options. Consider user's interests: {hobbies_str}."

class Park(BaseModel):
    name: str = Field(...)
    features: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Park data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        children = user_preferences.get('children_count', 0)
        
        if lifestyle == 'active':
            return {
                "name": "Riverside Athletic Complex",
                "features": "Running trails, outdoor gym equipment, basketball courts, tennis courts, bike rental station, and scenic river views"
            }
        elif children > 0:
            return {
                "name": "Family Fun Community Park",
                "features": "Large playground with modern equipment, splash pad, picnic pavilions, walking paths, and dedicated toddler play area"
            }
        else:
            return {
                "name": "Seaside Community Park",
                "features": "Playground, walking trails, picnic areas, dog park, ocean views"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Park based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        children = user_preferences.get('children_count', 0) if user_preferences else 0
        fitness_activities = user_preferences.get('fitness_activities', []) if user_preferences else []
        fitness_str = ', '.join(fitness_activities) if isinstance(fitness_activities, list) else str(fitness_activities)
        
        if lifestyle == 'active':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on parks with recreational facilities, fitness amenities, and outdoor activity options that support an active lifestyle. Consider user's fitness interests: {fitness_str}."
        elif children > 0:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on family-friendly amenities, playgrounds, and facilities designed for children and family activities. Consider user's fitness interests: {fitness_str}."
        else:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Highlight key amenities and recreational features for residents. Consider user's fitness interests: {fitness_str}."

class Amenity(BaseModel):
    name: str = Field(...)
    vibe: Optional[str] = Field(None)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Amenity data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        
        if income in ['high', 'very_high']:
            return {
                "name": "Whole Foods Market",
                "vibe": "Upscale organic grocery with prepared foods, wine bar, and artisanal products"
            }
        elif lifestyle == 'family':
            return {
                "name": "Target Supercenter",
                "vibe": "Family-friendly one-stop shopping with groceries, clothing, and household essentials"
            }
        else:
            return {
                "name": "Corner Market & Deli",
                "vibe": "Local neighborhood market with fresh sandwiches and daily essentials"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Amenity based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        income = user_preferences.get('income_range', 'middle') if user_preferences else 'middle'
        
        if income in ['high', 'very_high']:
            return "Include types and unique value. Use Walk Score or Google Maps search with review snippets. Focus on upscale shopping, premium services, and high-quality retail options that match your lifestyle preferences."
        elif lifestyle == 'family':
            return "Include types and unique value. Use Walk Score or Google Maps search with review snippets. Focus on family-friendly establishments, convenient shopping options, and services that cater to household and family needs."
        else:
            return "Local amenities and establishments available in the neighborhood, including shopping, services, and convenience options for daily needs."



class LocalAmenities(BaseModel):
    restaurants: Restaurant = Field(...)
    activities: Activity = Field(...)
    parks: Park = Field(...)
    grocery_store: Amenity = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example LocalAmenities data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        children = user_preferences.get('children_count', 0)
        
        # Generate examples using nested class methods
        restaurant_example = Restaurant.get_example(user_preferences)
        activity_example = Activity.get_example(user_preferences)
        park_example = Park.get_example(user_preferences)
        
        # Customize amenity examples based on preferences
        if income in ['high', 'very_high']:
            grocery_example = {
                "name": "Whole Foods Market",
                "vibe": "Upscale organic grocery with prepared foods and wine bar"
            }
        else:
            grocery_example = {
                "name": "Neighborhood Market",
                "vibe": "Local grocery with fresh produce and competitive prices"
            }
        
        if lifestyle == 'nightlife':
            late_night_example = {
                "name": "Midnight Kitchen",
                "vibe": "Trendy late-night spot with craft cocktails and small plates"
            }
        else:
            late_night_example = {
                "name": "24/7 Diner",
                "vibe": "Classic American diner with comfort food"
            }
        
        return {
            "restaurants": restaurant_example,
            "activities": activity_example,
            "parks": park_example,
            "grocery_store": grocery_example,
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        dining_prefs = user_preferences.get('dining_preferences', ['casual dining']) if user_preferences else ['casual dining']
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        
        # Format preferences for display
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "restaurants": f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on restaurants that match user's dining preferences: {dining_str}.",
            "activities": f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Emphasize activities that align with user's hobbies and interests: {hobbies_str}.",
            "parks": "Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Highlight features that match user's outdoor activity preferences.",
            "thrift_store": "Include types and unique value. Use Walk Score or Google Maps search with review snippets. Include unique character and shopping experience details.",
            "grocery_store": "Include types and unique value. Use Walk Score or Google Maps search with review snippets. Focus on quality, selection, and convenience factors.",
            "late_night_restaurant": "Include types and unique value. Use Walk Score or Google Maps search with review snippets. Consider user's lifestyle and dining schedule preferences."
        }

class Commute(BaseModel):
    commute_times: str = Field(...)
    public_transport: str = Field(...)
    traffic: str = Field(...)
    walkability: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Commute data based on user preferences."""
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
        if commute_tolerance == 'under_15':
            return {
                "commute_times": "Downtown: 12 min, Business District: 8 min, Airport: 25 min by car",
                "public_transport": "Express bus routes every 10 min, subway station 2 blocks away, extensive bike lanes",
                "traffic": "Minimal congestion, well-designed traffic flow with smart signals",
                "walkability": "Walk Score 92/100 - Daily errands easily accomplished on foot, pedestrian-priority streets"
            }
        elif commute_tolerance == 'over_45':
            return {
                "commute_times": "Downtown: 55 min, Airport: 75 min, Business District: 50 min by car",
                "public_transport": "Limited bus service, nearest rail station 3 miles away, car-dependent area",
                "traffic": "Heavy rush hour congestion, plan extra time during peak hours",
                "walkability": "Walk Score 45/100 - Car needed for most errands, suburban layout"
            }
        else:
            return {
                "commute_times": "Downtown: 25 min, Airport: 45 min, Business District: 30 min by car",
                "public_transport": "Metro bus routes every 15 min, light rail station 0.5 miles away, bike share program",
                "traffic": "Moderate rush hour congestion 7-9am and 5-7pm, generally light traffic otherwise",
                "walkability": "Walk Score 85/100 - Most errands can be accomplished on foot, bike-friendly streets"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30') if user_preferences else 'under_30'
        walkability_importance = user_preferences.get('walkability_importance', 'somewhat_important') if user_preferences else 'somewhat_important'
        
        return {
            "commute_times": f"Include time by car and public transit. Redfin and Realtor.com neighborhood pages sometimes show this. Emphasize routes and times relevant to user's commute tolerance ({commute_tolerance}).",
            "public_transport": "Mention system quality. Walk Score's Transit Score or local public agency blog results. Focus on transit options that align with user's transportation preferences.",
            "traffic": "Describe congestion windows. City-Data forums often contain commuting complaints or hacks. Highlight peak times and alternative routes based on user's schedule flexibility.",
            "walkability": f"Score should reflect actual pedestrian accessibility. Use Walk Score directly. Weight walkability factors based on user's walkability importance ({walkability_importance})."
        }

class FamilyFriendly(BaseModel):
    lots_of_kids: str = Field(...)
    great_for_families: str = Field(...)
    family_rating: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example FamilyFriendly data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
        if children_count > 2:
            return {
                "lots_of_kids": "Very High - Abundant families with multiple children, active school community, kid-friendly events weekly",
                "great_for_families": "Outstanding schools, safe pedestrian areas, multiple playgrounds, family recreation center, after-school programs",
                "family_rating": "9.5/10"
            }
        elif children_count > 0:
            return {
                "lots_of_kids": "High - Many families with young children, playgrounds always busy, school pickup lines",
                "great_for_families": "Excellent schools, safe streets, family events, parks within walking distance",
                "family_rating": "9.2/10"
            }
        else:
            return {
                "lots_of_kids": "Moderate - Some families present, quiet residential feel, occasional children's activities",
                "great_for_families": "Good schools nearby, safe neighborhood, some family amenities available",
                "family_rating": "7.8/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "lots_of_kids": f"'Yes / Some / Few' with reasoning. Use Niche family scores + Livability.com insights. Focus on family density and child-friendly atmosphere (user has {children_count} children).",
            "great_for_families": "Emphasize parks, schools, safety. Search '[neighborhood] with kids' or use Niche. Emphasize amenities and safety features most relevant to families with children.",
            "family_rating": "Honest reflection. Niche 'family grade' is a strong proxy. Weight factors based on user's family situation and child-related needs."
        }

class NightlifeAndDating(BaseModel):
    nightlife_rating: str = Field(...)
    best_spots: str = Field(...)
    dating_scene: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example NightlifeAndDating data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        marital_status = user_preferences.get('marital_status', 'single')
        
        if lifestyle == 'nightlife' and age < 35:
            return {
                "nightlife_rating": "9.2/10",
                "best_spots": "Sky Lounge rooftop bar, Underground dance club, Craft cocktail speakeasy, Late-night food trucks",
                "dating_scene": "Vibrant young professional scene, trendy bar meetups, rooftop parties, active social media presence",
                "image_prompt": "Photo of nightlife and entertainment venues in the city around the address, showing actual bars, clubs, and late-night spots where young professionals gather",
                "image_prompt_2": "Photo of dating-friendly venues in the city near the address: trendy restaurants, wine bars, coffee shops, or social spaces where singles meet and socialize"
            }
        elif marital_status in ['married', 'partnered'] or age > 40:
            return {
                "nightlife_rating": "6.8/10",
                "best_spots": "Wine bars, upscale restaurants with live music, theater district, cultural events",
                "dating_scene": "Mature social scene, wine tastings, cultural events, established professional networks",
                "image_prompt": "Photo of upscale evening entertainment venues in the city around the address, showing sophisticated restaurants, wine bars, and cultural spaces for mature professionals",
                "image_prompt_2": "Photo of date-night venues in the city near the address: fine dining restaurants, wine lounges, theater venues, or cultural spaces that cater to established couples"
            }
        else:
            return {
                "nightlife_rating": "7.5/10",
                "best_spots": "The Rooftop Lounge, Coastal Brewery, Live music at The Pier, wine bars on Main St",
                "dating_scene": "Active young professional scene, beach volleyball meetups, wine tastings, farmers market socializing",
                "image_prompt": "Photo of evening dining and entertainment venues in the city around the address, showing local restaurants, bars, and social spaces for casual dining and nightlife",
                "image_prompt_2": "Photo of casual social venues in the city near the address: local bars, breweries, coffee shops, or community spaces where residents socialize and meet"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": "Rate vibrancy of bars, music, and scenes. Use Yelp, Google Maps, or City-Data forum nightlife threads. Consider what appeals to the user's demographic and lifestyle.",
            "best_spots": "Popular bars, clubs, and entertainment venues. Use Yelp, Google Maps, or City-Data forum nightlife threads. Focus on venues that match the user's social style and interests.",
            "dating_scene": f"Describe energy and dating pool. Search 'dating in [city] Reddit' or Nomad List for vibe. Tailor to user's marital status ({marital_status}) and age ({age}) - focus on relevant social opportunities.",
            "average_attractiveness_rating": "Be playful but grounded. Use cultural tone and tongue-in-cheek phrasing.",
            "image_prompt": "Photo of nightlife and entertainment venues in the city around the address that reflect the local social atmosphere and evening entertainment options.",
            "image_prompt_2": "Photo of dating-friendly venues in the city near the address: cafes, wine bars, restaurants, or social spaces where people meet and socialize in this neighborhood."
        }


class Development(BaseModel):
    upcoming_changes: str = Field(...)
    zoning_or_construction: str = Field(...)
    gentrification_signs: str = Field(...)
    vacancy_or_decay: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Development data based on user preferences."""
        income = user_preferences.get('income_range', 'middle')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        
        if income in ['high', 'very_high'] and lifestyle == 'urban':
            return {
                "upcoming_changes": "Luxury high-rise development planned, new upscale shopping district, premium transit connections",
                "zoning_or_construction": "High-end mixed-use towers under construction, zoning allows luxury residential, architectural design standards enforced",
                "gentrification_signs": "Rapid property value increases, artisanal coffee shops and boutiques opening, longtime businesses being replaced",
                "vacancy_or_decay": "Very low vacancy rates, premium property maintenance, no signs of urban decay",
                "image_prompt": "Photo of development and construction activity in the city around the address, showing actual building sites, new developments, and infrastructure projects in this specific neighborhood",
                "image_prompt_2": "Photo of luxury developments and upscale construction projects in the city near the address, showing premium architectural features and high-end residential or commercial developments"
            }
        elif age < 30 and lifestyle in ['nightlife', 'urban']:
            return {
                "upcoming_changes": "New entertainment district planned, co-working spaces expanding, bike lane infrastructure improvements",
                "zoning_or_construction": "Mixed-use development with ground-floor retail, zoning allows live-work spaces, height restrictions relaxed",
                "gentrification_signs": "Young professionals moving in, trendy restaurants opening, rent increases in older buildings",
                "vacancy_or_decay": "Low vacancy rates, building renovations common, minimal decay",
                "image_prompt": "Photo of construction sites and new development projects in the city around the address, showing active building sites and modern developments in this specific neighborhood",
                "image_prompt_2": "Photo of trendy new developments in the city near the address: co-working spaces, modern residential projects, or contemporary commercial buildings that attract young professionals"
            }
        else:
            return {
                "upcoming_changes": "New transit line planned for 2026, waterfront redevelopment project, park expansion",
                "zoning_or_construction": "Mixed-use development under construction, residential zoning allows ADUs, height limits preserved",
                "gentrification_signs": "Rising property values, new upscale businesses, longtime residents being displaced",
                "vacancy_or_decay": "Low vacancy rates, well-maintained properties, minimal urban decay",
                "image_prompt": "Photo of development activity and neighborhood character around the specific address, showing current construction, infrastructure improvements, and community development projects in this area",
                "image_prompt_2": "Photo of neighborhood infrastructure near the address: transit developments, road improvements, utility upgrades, or community projects that impact this specific area"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for Development based on user preferences."""
        income = user_preferences.get('income_range', 'middle') if user_preferences else 'middle'
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        
        return {
            "upcoming_changes": "Search city planning sites, '[city] development projects', or local news. Look for major infrastructure, transit, or commercial projects.",
            "zoning_or_construction": "Check city zoning maps, building permits, or construction notices. Use Google Maps satellite view to spot active construction sites.",
            "gentrification_signs": "Look for rising rents, new upscale businesses, demographic shifts. Search '[neighborhood] gentrification' or check local forums for resident discussions.",
            "vacancy_or_decay": "Use Google Street View to assess building conditions, vacant lots, or boarded storefronts. Check local crime or economic indicators.",
            "image_prompt": "Photo of development activity, construction sites, and neighborhood character in the city around the address, showing current building projects and infrastructure changes in this specific area.",
            "image_prompt_2": "Photo of future development sites and planned construction areas in the city near the address, showing infrastructure improvements, zoning changes, or major projects that will impact this neighborhood."
        }



class UtilityCosts(BaseModel):
    electricity: str = Field(..., description="Average monthly electricity cost")
    gas: str = Field(..., description="Average monthly gas cost")
    water: str = Field(..., description="Average monthly water cost")
    internet: str = Field(..., description="Average monthly internet cost")
    trash: Optional[str] = Field(None, description="Average monthly trash/recycling cost")
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}


class EnvironmentUtilities(BaseModel):
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

        
    air_quality: str = Field(...)
    noise_pollution: str = Field(...)
    light_pollution: str = Field(...)
    water_quality: str = Field(...)
    avg_utility_costs: UtilityCosts = Field(..., description="Average monthly utility costs breakdown")
    internet_speed: str = Field(...)
    environmental_rating: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example EnvironmentUtilities data based on user preferences."""
        income = user_preferences.get('income_range', 'middle')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        work_from_home = user_preferences.get('work_from_home', False)
        
        if income in ['high', 'very_high']:
            return {
                "air_quality": "Excellent - AQI typically 25-40, minimal pollution, clean ocean air",
                "noise_pollution": "Low - Quiet residential area, minimal traffic, sound barriers on major roads",
                "light_pollution": "Low - Excellent night sky visibility, thoughtful lighting design",
                "water_quality": "Premium - Exceeds EPA standards, filtered municipal supply, excellent taste",
                "avg_utility_costs": {"electricity": "$180", "gas": "$65", "water": "$45", "internet": "$95", "trash": "$25"},
                "internet_speed": "Fiber available up to 2Gbps, premium service providers, 99.9% uptime",
                "environmental_rating": "9.2/10"
            }
        elif work_from_home or lifestyle == 'remote':
            return {
                "air_quality": "Good - AQI typically 35-50, clean air with minimal industrial pollution",
                "noise_pollution": "Low to moderate - Quiet during work hours, some evening activity",
                "light_pollution": "Moderate - Some night sky visibility, residential lighting",
                "water_quality": "Excellent - Meets all EPA standards, good taste, reliable supply",
                "avg_utility_costs": {"electricity": "$140", "gas": "$50", "water": "$40", "internet": "$85", "trash": "$25"},
                "internet_speed": "Fiber available up to 1Gbps, multiple high-speed options, reliable for remote work",
                "environmental_rating": "8.8/10"
            }
        else:
            return {
                "air_quality": "Good - AQI typically 45-65, minimal smog, ocean breeze helps circulation",
                "noise_pollution": "Moderate - Some traffic noise on main roads, generally quiet residential streets",
                "light_pollution": "Low to moderate - Can see some stars, street lighting present but not excessive",
                "water_quality": "Excellent - Meets all EPA standards, tastes good, no boil advisories in recent years",
                "avg_utility_costs": {"electricity": "$120", "gas": "$45", "water": "$35", "internet": "$65", "trash": "$20"},
                "internet_speed": "Fiber available up to 1Gbps, cable up to 500Mbps, multiple provider options",
                "environmental_rating": "8.4/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for EnvironmentUtilities based on user preferences."""
        work_from_home = user_preferences.get('work_from_home', False) if user_preferences else False
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        
        return {
            "air_quality": "Check EPA AirNow or IQAir for AQI data. Look for industrial sources, traffic patterns, or natural factors affecting air quality.",
            "noise_pollution": "Use Google Street View to assess traffic volume, proximity to airports/highways. Check local noise ordinances or community complaints.",
            "light_pollution": "Use Dark Site Finder or Light Pollution Map. Consider street lighting, commercial areas, and night sky visibility.",
            "water_quality": "Check EPA Safe Drinking Water database or local water utility reports. Look for recent violations or boil advisories.",
            "avg_utility_costs": "Search '[city] average utility costs' or check local utility company websites. Include electricity, gas, water, internet costs.",
            "internet_speed": "Use Speedtest.net coverage maps or check ISP availability. Important for remote work and modern connectivity needs.",
            "environmental_rating": "Overall environmental quality score out of 10. Weight factors based on user's work-from-home needs and lifestyle preferences."
        }

class FinancialInformation(BaseModel):
    monthly_payment: str = Field(...)
    property_taxes: str = Field(...)
    value_assessment: str = Field(...)
    investment_potential: str = Field(...)
    financial_rating: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example FinancialInformation data based on user preferences."""
        income = user_preferences.get('income_range', 'middle')
        price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000')
        
        if income in ['high', 'very_high']:
            return {
                "monthly_payment": "$5,800/month for luxury home price with 20% down, 30-year fixed at 6.5%",
                "property_taxes": "1.4% effective rate, approximately $14,000/year for high-value properties",
                "value_assessment": "Premium market with 12% annual growth, exclusive inventory, well above city average",
                "investment_potential": "Excellent - Luxury market resilience, high-end development pipeline, rental yields 3-4%",
                "financial_rating": "9.3/10"
            }
        elif income in ['low', 'very_low']:
            return {
                "monthly_payment": "$1,800/month for starter home with FHA loan, 3.5% down, 30-year fixed at 6.8%",
                "property_taxes": "0.9% effective rate, approximately $3,600/year for modest home value",
                "value_assessment": "Steady growth at 5% annually, affordable housing options, entry-level market",
                "investment_potential": "Moderate - Stable appreciation, first-time buyer programs, rental yields 6-7%",
                "financial_rating": "7.2/10"
            }
        else:
            return {
                "monthly_payment": "$3,200/month for median home price with 20% down, 30-year fixed at 6.5%",
                "property_taxes": "1.2% effective rate, approximately $7,200/year for median home value",
                "value_assessment": "Values increased 8% last year, strong market with low inventory, above city average",
                "investment_potential": "High - Growing tech sector, planned transit improvements, rental yields 4-5%",
                "financial_rating": "8.7/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        preferred_price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000') if user_preferences else '$300,000-$500,000'
        
        return {
            "monthly_payment": f"Estimated monthly mortgage payment for typical home in the area. Consider user's income range ({income_range}) and preferred price range ({preferred_price_range}) when providing context.",
            "property_taxes": "Annual property tax rates and typical amounts. Relate to user's financial capacity and budget expectations.",
            "value_assessment": "Property value trends and market assessment. Frame in context of user's investment timeline and financial goals.",
            "investment_potential": "Long-term investment outlook and rental potential. Consider user's investment experience and risk tolerance.",
            "financial_rating": "Overall financial attractiveness score out of 10. Weight factors based on user's financial priorities and constraints."
        }

class SchoolInfo(BaseModel):
    name: str = Field(..., description="Name of the school")
    known_for: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example SchoolInfo data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        income = user_preferences.get('income_range', 'middle')
        
        if children_count > 0 and income in ['high', 'very_high']:
            return {
                "known_for": "**Specialized Programs:** Advanced STEM curriculum, Mandarin immersion program, gifted and talented tracks, award-winning arts program with dedicated music and art studios",
            }
        elif children_count > 2:
            return {
                "known_for": "**Community Focus:** Strong reading intervention programs, inclusive special education, extensive after-school activities, high family engagement with active PTA",
            }
        else:
            return {
                "known_for": "**Community Focus:** Strong reading intervention programs, inclusive special education, extensive after-school activities, high family engagement with active PTA",
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for SchoolInfo based on user preferences."""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "known_for": "Special programs, academic strengths, or unique offerings. Research school websites, awards, and community reputation.",
        }

class Schools(BaseModel):
    schools: List[SchoolInfo] = Field(..., description="List of schools in the area")
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Schools data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        income = user_preferences.get('income_range', 'middle')
        
        # Generate school example using SchoolInfo class method
        school_example = SchoolInfo.get_example(user_preferences)
        
        if children_count > 0 and income in ['high', 'very_high']:
            return {
                "schools": [
                    {
                        "name": "## Prestigious Academy Elementary\n\n**Level:** Elementary School\n**Walking Distance:** Yes (0.3 miles)\n**Overall Rating:** 9.8/10",
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.8/10",
                        "known_for": "**Specialized Programs:** Advanced STEM curriculum, Mandarin immersion program, gifted and talented tracks, award-winning arts program"
                    },
                    {
                        "name": "## Excellence Prep Middle School\n\n**Level:** Middle School\n**Walking Distance:** No (0.8 miles)\n**Overall Rating:** 9.9/10",
                        "level": "Middle School",
                        "walking_distance": False,
                        "school_rating": "9.9/10",
                        "known_for": "**Advanced Programs:** Pre-AP courses, competitive robotics team, championship debate program, leadership academy"
                    }
                ]
            }
        elif children_count > 2:
            return {
                "schools": [
                    {
                        "name": "## Family-Friendly Elementary\n\n**Level:** Elementary School\n**Walking Distance:** Yes (0.4 miles)\n**Overall Rating:** 9.4/10",
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.4/10",
                        "known_for": "**Community Focus:** Strong reading intervention programs, inclusive special education, extensive after-school activities, high family engagement with active PTA"
                    },
                    {
                        "name": "## Community Middle School\n\n**Level:** Middle School\n**Walking Distance:** No (0.7 miles)\n**Overall Rating:** 9.0/10",
                        "level": "Middle School",
                        "walking_distance": False,
                        "school_rating": "9.0/10",
                        "known_for": "**Inclusive Excellence:** Strong community involvement, diverse academic programs, inclusive environment with support for all learners"
                    }
                ]
            }
        else:
            return {
                "schools": [
                    {
                        "name": "## Seaside Elementary\n\n**Level:** Elementary School\n**Walking Distance:** Yes (0.5 miles)\n**Overall Rating:** 9.2/10",
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.2/10",
                        "known_for": "**STEM Excellence:** Strong STEM programs with hands-on learning, technology integration, science fair champions"
                    }
                ]
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for Schools based on user preferences."""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "schools": "Dictionary of local schools with comprehensive information. Use GreatSchools.org, Niche, or state education department data for accurate school ratings, programs, and performance metrics. Focus on schools within reasonable distance of the property."
        }

class ExtraTips(BaseModel):
    parking: str = Field(...)
    pet_friendly: str = Field(...)
    cell_service_quality: str = Field(...)
    other_notable_tips: str = Field(...)
    
    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example ExtraTips data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        has_pets = user_preferences.get('has_pets', False)
        work_from_home = user_preferences.get('work_from_home', False)
        
        if has_pets:
            pet_info = "Extremely pet-friendly - 5 dog parks within walking distance, off-leash beach area, pet grooming services, dog-friendly cafes and breweries"
        else:
            pet_info = "Pet-friendly neighborhood - dog parks available, many residents have pets, vet clinic nearby"
        
        if work_from_home:
            cell_info = "Outstanding connectivity - 5G coverage from all carriers, fiber internet backup options, co-working spaces with reliable WiFi"
            tips = "Best coffee for remote work at Quiet Corner Cafe, library has excellent WiFi, avoid construction noise on Oak St 9-11am"
        elif lifestyle == 'nightlife':
            tips = "Best late-night eats at 24/7 Diner, Uber/Lyft readily available, street lighting excellent for safety, noise ordinance until 2am"
        elif lifestyle == 'family':
            tips = "Best family coffee at Corner Cafe, avoid Main St during school pickup 3-4pm, farmers market Saturdays 8am-2pm, library story time Wednesdays"
        else:
            tips = "Best coffee at Corner Cafe, avoid Main St during school pickup, farmers market Saturdays 8am-2pm"
        
        return {
            "parking": "Street parking mostly free, 2-hour limits near shops, resident permits available for $50/year",
            "pet_friendly": pet_info,
            "cell_service_quality": "Excellent coverage for all major carriers, 5G available, minimal dead zones" if not work_from_home else cell_info,
            "other_notable_tips": tips
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for ExtraTips based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        has_pets = user_preferences.get('has_pets', False) if user_preferences else False
        
        return {
            "parking": "Street parking rules, permit requirements, garage availability. Use Google Street View to assess parking density and local parking signs.",
            "pet_friendly": "Dog parks, pet stores, veterinarians, pet policies. Search '[neighborhood] dog park' or use Google Maps to find pet amenities.",
            "cell_service_quality": "Coverage quality for major carriers. Check carrier coverage maps or local forums for dead zone reports.",
            "other_notable_tips": "Local insider knowledge, best times to visit places, hidden gems, traffic patterns. Use local forums, Reddit, or Nextdoor for community insights."
        }

class FullReport(BaseModel):
    # === Main sections ===
    neighborhood_overview: Optional[NeighborhoodOverview] = None
    
    # === Demographic data (appears directly after neighborhood_overview without section titles) ===
    # age_distribution: Now injected directly from Census API - no model field needed
    lifestyle_dna: Optional[LifestyleDNA] = None
    
    # === Other report sections ===
    safety: Optional[Safety] = None
    culture_and_events: Optional[CultureAndEvents] = None
    social_character: Optional[SocialCharacter] = None
    local_amenities: Optional[LocalAmenities] = None
    commute: Optional[Commute] = None
    family_friendly: Optional[FamilyFriendly] = None
    nightlife_and_dating: Optional[NightlifeAndDating] = None
    development: Optional[Development] = None
    environment_utilities: Optional[EnvironmentUtilities] = None
    financial_information: Optional[FinancialInformation] = None
    schools: Optional[Schools] = None
    extra_tips: Optional[ExtraTips] = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: List[str] = PrivateAttr(default=[])

    model_config = {
    "title": "SectionName",  # optional, improves clarity in schema
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
    "json_schema_extra": {
        "$id": "section_name",  # optional but helpful for tracing
        "description": "Structured output for the SectionName of the real estate report."
    }
}


    # ✅ Modern init with PrivateAttr
    def __init__(self, report_customization: Dict[str, Any], **data):
        super().__init__(**data)
        self._prioritized_fields = report_customization.get("report_section_priorities", [])

    # ✅ Dict override to only return prioritized sections
    def dict(self, **kwargs) -> Dict[str, Any]:
        base_dict = super().dict(**kwargs)

        print("\n🔍 DEBUG: base_dict keys and values:")
        for k, v in base_dict.items():
            print(f"  - {k}: {'✅ has value' if v is not None else '❌ None'}")

        print("\n📌 DEBUG: prioritized fields from report customization:")
        print(f"  {self._prioritized_fields}")

        final_dict = {}
        print("\n📦 DEBUG: Filtering prioritized fields...")

        for key in self._prioritized_fields:
            if key not in base_dict:
                print(f"  ⛔ '{key}' not found in base_dict — skipping")
                continue
            
            # Include the key regardless of whether it's None or has a value
            final_dict[key] = base_dict[key]
        
        # Auto-include demographic sections if they have values (even if not in prioritized fields)
        demographic_sections = ['lifestyle_dna']  # age_distribution now injected directly from Census API
        for demo_key in demographic_sections:
            if demo_key in base_dict and base_dict[demo_key] is not None and demo_key not in final_dict:
                print(f"  🧬 Auto-including demographic section '{demo_key}' (has value)")
                final_dict[demo_key] = base_dict[demo_key]

        print("\n✅ Final filtered dict keys:")
        print(f"  {list(final_dict.keys())}\n")

        return final_dict

    @classmethod
    def schema(cls, report_customization: Dict[str, Any] = None, **kwargs):
        base = super().schema(**kwargs)
        
        # Get the prioritized fields from report customization
        prioritized_fields = []
        if report_customization:
            prioritized_fields = report_customization.get("report_section_priorities", [])
            logger.info(f"🎯 Filtering schema for prioritized fields: {prioritized_fields}")
        
        # If no prioritized fields specified, include all fields (backward compatibility)
        if not prioritized_fields:
            prioritized_fields = list(cls.__fields__.keys())
            logger.info(f"📋 No prioritized fields specified, including all: {prioritized_fields}")
        
        # Filter properties to only include prioritized fields and remove nullable anyOf patterns
        if "properties" in base:
            filtered_properties = {}
            for field_name in prioritized_fields:
                if field_name in base["properties"]:
                    prop = base["properties"][field_name]
                    
                    # Remove nullable anyOf patterns to make fields required
                    if isinstance(prop, dict) and "anyOf" in prop:
                        # Find the non-null reference
                        non_null_refs = [item for item in prop["anyOf"] if item.get("type") != "null"]
                        if len(non_null_refs) == 1 and "$ref" in non_null_refs[0]:
                            # Replace anyOf with direct $ref to make field required
                            filtered_properties[field_name] = non_null_refs[0]
                            logger.info(f"🔧 Removed nullable anyOf for {field_name}, now required")
                        else:
                            filtered_properties[field_name] = prop
                    else:
                        filtered_properties[field_name] = prop
            base["properties"] = filtered_properties
            logger.info(f"✂️ Filtered properties to: {list(filtered_properties.keys())}")
        
        # Collect model classes that are actually used (including nested dependencies)
        used_model_classes = set()
        
        def collect_model_dependencies(model_name, visited=None):
            """Recursively collect all model dependencies from $defs"""
            if visited is None:
                visited = set()
            
            if model_name in visited or model_name not in base.get("$defs", {}):
                return
            
            visited.add(model_name)
            used_model_classes.add(model_name)
            
            # Check for $ref dependencies in this model's properties
            model_def = base["$defs"][model_name]
            if "properties" in model_def:
                for prop_name, prop_def in model_def["properties"].items():
                    # Look for direct $ref
                    if isinstance(prop_def, dict) and "$ref" in prop_def:
                        ref_model = prop_def["$ref"].split("/")[-1]
                        collect_model_dependencies(ref_model, visited)
                    # Look for $ref in anyOf (for Optional fields)
                    elif isinstance(prop_def, dict) and "anyOf" in prop_def:
                        for any_of_item in prop_def["anyOf"]:
                            if isinstance(any_of_item, dict) and "$ref" in any_of_item:
                                ref_model = any_of_item["$ref"].split("/")[-1]
                                collect_model_dependencies(ref_model, visited)
        
        # Start with direct field models
        for field_name in prioritized_fields:
            if field_name in cls.__fields__:
                field = cls.__fields__[field_name]
                model = field.annotation
                if hasattr(model, '__args__'):  # Handle Optional[Model]
                    model = next((arg for arg in model.__args__ if arg is not type(None)), model)
                if hasattr(model, '__name__'):
                    collect_model_dependencies(model.__name__)
        
        # Filter $defs to only include used model classes and their dependencies
        if "$defs" in base:
            filtered_defs = {}
            for def_name in used_model_classes:
                if def_name in base["$defs"]:
                    filtered_defs[def_name] = base["$defs"][def_name]
            base["$defs"] = filtered_defs
            logger.info(f"✂️ Filtered $defs to: {list(filtered_defs.keys())}")
            
            # Remove nullable anyOf patterns from $defs properties
            for def_name, def_content in base["$defs"].items():
                if "properties" in def_content:
                    for prop_name, prop_def in def_content["properties"].items():
                        if isinstance(prop_def, dict) and "anyOf" in prop_def:
                            # Find the non-null references
                            non_null_refs = [item for item in prop_def["anyOf"] if item.get("type") != "null"]
                            if len(non_null_refs) >= 1:
                                if len(non_null_refs) == 1:
                                    # Single non-null type: replace with direct reference
                                    base["$defs"][def_name]["properties"][prop_name] = non_null_refs[0]
                                    logger.info(f"🔧 Removed nullable anyOf for {def_name}.{prop_name}, now required (single type)")
                                else:
                                    # Multiple non-null types: keep anyOf but remove null option
                                    base["$defs"][def_name]["properties"][prop_name] = {"anyOf": non_null_refs}
                                    logger.info(f"🔧 Removed null option from anyOf for {def_name}.{prop_name}, now required (multiple types)")

        # Inject personalized examples and descriptions for used fields only
        for field_name in prioritized_fields:
            if field_name not in cls.__fields__:
                continue
                
            field = cls.__fields__[field_name]
            model = field.annotation
            if hasattr(model, '__args__'):  # Handle Optional[Model]
                model = next((arg for arg in model.__args__ if arg is not type(None)), model)

            if hasattr(model, 'get_example'):
                try:
                    logger.info(f"🔧 Injecting example for {field_name}")
                    example = model.get_example({})
                    if "properties" in base and field_name in base["properties"]:
                        base["properties"][field_name]["example"] = example
                except Exception as e:
                    logger.warning(f"⚠️ Failed to inject example for {field_name}: {e}")

            if hasattr(model, 'get_description'):
                try:
                    logger.info(f"📝 Injecting field descriptions for {field_name}")
                    field_descriptions = model.get_description({})

                    # Handle both string or dict return types
                    if isinstance(field_descriptions, str):
                        # Apply string to the overall model description
                        if model.__name__ in base.get("$defs", {}):
                            base["$defs"][model.__name__]["description"] = field_descriptions

                    elif isinstance(field_descriptions, dict):
                        if "properties" in base.get("$defs", {}).get(model.__name__, {}):
                            for sub_field, desc in field_descriptions.items():
                                if sub_field in base["$defs"][model.__name__]["properties"]:
                                    base["$defs"][model.__name__]["properties"][sub_field]["description"] = desc

                except Exception as e:
                    logger.warning(f"⚠️ Failed to inject descriptions for {field_name}: {e}")

        return base