from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)


class NeighborhoodOverview(BaseModel):
    local_culture: str = Field(...)
    vibe: str = Field(...)
    known_for: str = Field(...)
    community_events: str = Field(...)
    what_people_love: str = Field(...)
    things_to_watch_out_for: str = Field(...)
    population_total: str = Field(...)
    neighborhood_rating: str = Field(...)
    LGBTQ_representation: str = Field(...)
    image_prompt: str = Field(...)
    
    class Config:
        extra = "forbid"

    @model_validator(mode="before")
    @classmethod
    def delete_flat_demographics(cls, values):
        if not isinstance(values, dict):
            return values

        demographic_fields_to_delete = [
            "gender_distribution",
            "racial_distribution",
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
        
        return {
            "local_culture": f"Thriving {culture_focus} that perfectly balances urban convenience with neighborhood charm",
            "vibe": vibe_words,
            "known_for": "Award-winning local restaurants, beautiful tree-lined streets, and strong sense of community",
            "community_events": events_focus,
            "what_people_love": love_reasons,
            "things_to_watch_out_for": "Popular area means competitive parking during events, but well worth it for the lifestyle",
            "population_total": "12,500",
            "neighborhood_rating": "9.2/10",
            "LGBTQ_representation": "Proudly inclusive community with diverse businesses and annual Pride celebrations",
            "image_prompt": f"Inviting neighborhood scene showcasing {vibe_words.lower()} atmosphere with tree-lined streets and community gathering spaces"
        }

    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        # Personalize descriptions based on user priorities
        children_count = user_preferences.get("children_count", 0) if user_preferences else 0
        age = user_preferences.get("age", 35) if user_preferences else 35
        
        culture_focus = "family appeal and school quality" if children_count > 0 else "lifestyle and social opportunities" if age < 35 else "community character and amenities"
        
        return {
            "local_culture": f"Compelling neighborhood story that sells the lifestyle. Focus on {culture_focus}. Use emotional language that helps buyers envision their life here.",
            "vibe": "3-5 powerful adjectives that instantly communicate the neighborhood's personality. Perfect for marketing headlines and social media.",
            "known_for": "The neighborhood's 'claim to fame' - what makes it special and desirable. Lead with the most marketable features that drive buyer interest.",
            "community_events": "Highlight events that showcase the lifestyle buyers want. Focus on regular, appealing activities that demonstrate community engagement.",
            "what_people_love": "Emotional selling points that create desire. Use language that helps buyers imagine themselves enjoying these benefits.",
            "things_to_watch_out_for": "Address potential concerns honestly but positively. Frame challenges as minor trade-offs for the amazing lifestyle.",
            "population_total": "Right-sized community stat that suggests neither too crowded nor too isolated.",
            "neighborhood_rating": "Confidence-building score that validates the buyer's choice. Use reputable sources for credibility.",
            "LGBTQ_representation": "Inclusivity signal that appeals to diverse buyers and demonstrates progressive community values.",
            "image_prompt": "Visual that captures the aspirational lifestyle this neighborhood offers. Should make viewers want to live there."
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
        example="Well-lit residential street with sidewalks, street lamps, and visible security features"
    )
    
    class Config:
        extra = "forbid"
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        # Extract user preferences for safety personalization
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        age = user_preferences.get('age', 35) if user_preferences else 35
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        gender = user_preferences.get('gender', 'prefer_not_to_say') if user_preferences else 'prefer_not_to_say'
        
        # Customize safety messaging based on user profile
        if children_count > 0:
            crime_focus = "Exceptionally Safe for Families"
            watch_out = "This family-friendly area is remarkably safe - just standard precautions around school pickup times when traffic is heavier"
            police_focus = "Outstanding community policing with school resource officers, crossing guards, and family-focused safety programs"
            rating = "9.4/10"
            image_focus = "family-safe neighborhood with children playing and parents walking"
        elif age < 30 or 'urban' in lifestyle:
            crime_focus = "Very Safe for Young Professionals"
            watch_out = "Vibrant and secure area - just stay aware in entertainment districts late at night like any urban area"
            police_focus = "Responsive police presence with good coverage of nightlife areas and quick emergency response"
            rating = "8.9/10"
            image_focus = "well-lit urban streets with young professionals walking confidently"
        elif gender == 'female':
            crime_focus = "Excellent Personal Safety"
            watch_out = "Very safe community with good lighting and visibility - residents feel comfortable walking alone"
            police_focus = "Strong community policing with excellent response times and neighborhood watch programs"
            rating = "9.2/10"
            image_focus = "well-lit, safe streets where people feel secure walking alone"
        else:
            crime_focus = "Very Low Crime Area"
            watch_out = "Peaceful, low-crime neighborhood - just normal urban awareness during late evening hours"
            police_focus = "Professional police force with regular patrols and strong community relationships"
            rating = "9.1/10"
            image_focus = "safe, well-maintained residential streets with good lighting"
        
        return {
            "crime_rating": crime_focus,
            "places_to_watch_out_for": watch_out,
            "police_presence": police_focus,
            "safety_rating": rating,
            "image_prompt": f"Inviting, secure neighborhood scene showing {image_focus} that demonstrates the area's safety and livability"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Extract user context for personalized safety guidance
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        age = user_preferences.get('age', 35) if user_preferences else 35
        gender = user_preferences.get('gender', 'prefer_not_to_say') if user_preferences else 'prefer_not_to_say'
        
        # Determine safety priorities based on user profile
        if children_count > 0:
            safety_priorities = "school safety, playground security, family-friendly environment, and child pedestrian safety"
        elif age < 30:
            safety_priorities = "nightlife safety, walkability after dark, and urban security measures"
        elif gender == 'female':
            safety_priorities = "personal safety, lighting quality, and community watch programs"
        else:
            safety_priorities = "overall crime prevention, property security, and community safety measures"
        
        return {
            "crime_rating": f"Present crime levels in marketing-friendly terms (e.g., 'Exceptionally Safe', 'Very Secure'). Use data from Neighborhood Scout, AreaVibes, or local police statistics. Focus on {safety_priorities} that matter most to this buyer profile.",
            "places_to_watch_out_for": "Address any safety concerns honestly but reassuringly. Frame as 'normal precautions' rather than serious risks. Use local knowledge to provide specific, helpful guidance that shows neighborhood familiarity.",
            "police_presence": "Highlight positive aspects of law enforcement - community policing, response times, neighborhood programs. Emphasize protection and service rather than enforcement. Build confidence in local safety infrastructure.",
            "safety_rating": "Confidence-building safety score that validates the buyer's choice. Use reputable sources and weight factors based on buyer priorities. Format as 'X.X/10' with explanation of what drives the high score.",
            "image_prompt": "Visual that showcases the neighborhood's safety and security in an appealing way. Should make viewers feel this is a place where they and their loved ones would be safe and comfortable."
        }

class CultureAndEvents(BaseModel):
    local_events: str = Field(...)
    seasonal_trends: str = Field(...)
    community_engagement: str = Field(...)
    culture_rating: str = Field(...)
    image_prompt: str = Field(...)
    
    class Config:
        extra = "forbid"
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        # Extract user preferences for cultural personalization
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        age = user_preferences.get('age', 35) if user_preferences else 35
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        
        # Customize cultural content based on user profile
        if children_count > 0:
            events_focus = "Family-friendly festivals, outdoor movie nights, children's theater, school fundraisers, and community picnics"
            seasonal_focus = "Year-round family activities - summer outdoor festivals and winter holiday celebrations with kids' activities"
            engagement_focus = "Strong parent-teacher associations, youth sports leagues, and family volunteer opportunities"
            rating = "9.1/10"
            image_focus = "family-friendly community festival with children's activities and parents socializing"
        elif age < 30:
            events_focus = "Trendy food truck rallies, live music venues, art gallery openings, craft beer festivals, and networking mixers"
            seasonal_focus = "Vibrant summer concert series and cozy winter pop-up markets with year-round nightlife scene"
            engagement_focus = "Active young professional groups, startup meetups, and social impact volunteering"
            rating = "8.8/10"
            image_focus = "energetic street festival with young adults enjoying food, music, and social activities"
        elif 'arts' in str(hobbies).lower() or 'culture' in str(hobbies).lower():
            events_focus = "Monthly art walks, gallery openings, live theater performances, cultural festivals, and artist studio tours"
            seasonal_focus = "Rich cultural calendar - outdoor summer arts festivals and intimate winter gallery shows"
            engagement_focus = "Thriving arts council, community theater groups, and cultural preservation societies"
            rating = "9.3/10"
            image_focus = "sophisticated arts festival with galleries, live performances, and cultural enthusiasts"
        else:
            events_focus = "Diverse community events including farmers markets, seasonal festivals, local concerts, and neighborhood gatherings"
            seasonal_focus = "Something for everyone year-round - outdoor summer events and cozy indoor winter activities"
            engagement_focus = "Active community groups, volunteer opportunities, and strong civic participation"
            rating = "8.7/10"
            image_focus = "welcoming community event with diverse residents enjoying local culture and activities"
        
        return {
            "local_events": events_focus,
            "seasonal_trends": seasonal_focus,
            "community_engagement": engagement_focus,
            "culture_rating": rating,
            "image_prompt": f"Vibrant, inviting scene of a {image_focus} that showcases the community's cultural richness"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Extract user context for personalized cultural guidance
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        age = user_preferences.get('age', 35) if user_preferences else 35
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        # Determine cultural priorities based on user profile
        if children_count > 0:
            cultural_priorities = "family-friendly events, educational activities, and safe community gatherings"
        elif age < 30:
            cultural_priorities = "social events, nightlife, networking opportunities, and trendy cultural experiences"
        else:
            cultural_priorities = "diverse cultural offerings, community engagement opportunities, and quality entertainment"
        
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": f"Showcase the lifestyle buyers want to join. Highlight events that align with their interests ({hobbies_str}) and demonstrate community vibrancy. Focus on {cultural_priorities} that appeal to this buyer profile.",
            "seasonal_trends": "Paint a picture of year-round enjoyment and community life. Show how the area stays engaging across all seasons, emphasizing activities that match the buyer's lifestyle preferences.",
            "community_engagement": "Demonstrate the social fabric and involvement opportunities available. Highlight ways residents can connect and contribute, showing this is a place where buyers can build meaningful community connections.",
            "culture_rating": "Confidence-building score that validates the area's cultural richness. Weight factors based on what matters most to this buyer profile - entertainment, arts, community events, or family activities.",
            "image_prompt": "Visual that captures the cultural energy and community spirit buyers want to be part of. Should make viewers excited about the social and cultural opportunities available."
        }

class Weather(BaseModel):
    spring: str = Field(...)
    summer: str = Field(...)
    fall: str = Field(...)
    winter: str = Field(...)
    image_prompt: str = Field(...)
    
    class Config:
        extra = "forbid"
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        # Extract user preferences for weather personalization
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        age = user_preferences.get('age', 35) if user_preferences else 35
        
        # Customize weather messaging based on user profile
        if 'outdoor' in str(hobbies).lower() or 'fitness' in str(hobbies).lower():
            spring_focus = "Perfect for hiking and outdoor fitness - mild 65-75°F with blooming trails"
            summer_focus = "Ideal outdoor activity weather - sunny 75-85°F, perfect for all your favorite activities"
            fall_focus = "Beautiful hiking and cycling conditions - crisp 60-70°F with stunning foliage"
            winter_focus = "Great for winter sports and cozy outdoor activities - 45-55°F, mostly sunny"
            image_focus = "outdoor enthusiasts enjoying activities in beautiful weather"
        elif age < 30:
            spring_focus = "Festival season begins - perfect 70°F weather for outdoor events and socializing"
            summer_focus = "Prime social season - warm 80°F days ideal for rooftop bars and outdoor dining"
            fall_focus = "Cozy sweater weather - comfortable 65°F perfect for farmers markets and outdoor cafes"
            winter_focus = "Mild winter charm - 50°F days great for holiday markets and outdoor gatherings"
            image_focus = "young people enjoying seasonal outdoor social activities"
        else:
            spring_focus = "Delightful spring weather - comfortable 68-75°F perfect for gardening and walks"
            summer_focus = "Pleasant summer climate - warm but not oppressive 78-85°F with low humidity"
            fall_focus = "Gorgeous autumn conditions - mild 62-72°F ideal for outdoor activities"
            winter_focus = "Mild, enjoyable winters - 48-58°F allowing year-round outdoor enjoyment"
            image_focus = "residents comfortably enjoying all four seasons outdoors"
        
        return {
            "spring": spring_focus,
            "summer": summer_focus,
            "fall": fall_focus,
            "winter": winter_focus,
            "image_prompt": f"Beautiful seasonal scene showing {image_focus} in this desirable climate"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Extract user context for weather priorities
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        
        weather_priorities = "outdoor activity conditions" if 'outdoor' in str(hobbies).lower() else "comfortable living conditions"
        
        return {
            "spring": f"Highlight the appeal of spring weather for {weather_priorities}. Focus on temperature ranges, rainfall, and seasonal activities that buyers can enjoy.",
            "summer": f"Showcase summer climate advantages for {weather_priorities}. Emphasize comfort, outdoor opportunities, and lifestyle benefits.",
            "fall": f"Present autumn weather as an asset for {weather_priorities}. Highlight seasonal beauty, comfortable temperatures, and outdoor enjoyment.",
            "winter": f"Frame winter weather positively for {weather_priorities}. Show how mild conditions allow year-round outdoor activities and comfortable living.",
            "image_prompt": "Visual that showcases the area's appealing climate and how residents enjoy the weather year-round. Should make viewers want to experience this climate."
        }

class SocialCharacter(BaseModel):
    income_level: str = Field(...)
    religiosity: str = Field(...)
    cultural_tone: str = Field(...)
    social_rating: str = Field(...)
    image_prompt: str = Field(...)
    
    class Config:
        extra = "forbid"
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": "Middle-class professionals and young families, median household income $75,000",
            "religiosity": "Moderate - several churches and temples, but not overly conservative",
            "cultural_tone": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
            "social_rating": "8.2/10",
            "image_prompt": "Diverse group of neighbors chatting at a community gathering, showing friendly social interaction"
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
            "image_prompt": "Descriptive prompt for generating an image representing the social character that appeals to user's community preferences."
        }

class Commute(BaseModel):
    commute_times: str = Field(...)
    public_transport: str = Field(...)
    traffic: str = Field(...)
    walkability: str = Field(...)
    
    class Config:
        extra = "forbid"
    
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

class SchoolInfo(BaseModel):
    name: str = Field(..., description="Name of the school")
    level: str = Field(...)
    walking_distance: bool = Field(...)
    school_rating: str = Field(...)
    
    class Config:
        extra = "forbid"
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example SchoolInfo data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        income = user_preferences.get('income_range', 'middle')
        
        if children_count > 0 and income in ['high', 'very_high']:
            return {
                "name": "Prestigious Academy Elementary",
                "level": "Elementary",
                "walking_distance": True,
                "school_rating": "9.8/10",
            }
        elif children_count > 2:
            return {
                "name": "Family-Friendly Elementary",
                "level": "Elementary",
                "walking_distance": True,
                "school_rating": "9.4/10",
            }
        else:
            return {
                "name": "Seaside Elementary",
                "level": "Elementary",
                "walking_distance": True,
                "school_rating": "9.2/10",
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for SchoolInfo based on user preferences."""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "level": "Elementary, Middle, or High School designation. Use GreatSchools.org or Niche for school level information.",
            "walking_distance": "Whether school is within walking distance (typically under 0.5 miles). Use Google Maps to measure distance from property.",
            "school_rating": "GreatSchools rating out of 10 or similar metric. Use GreatSchools.org, Niche, or state education department ratings."
        }

class Schools(BaseModel):
    schools: List[SchoolInfo] = Field(..., description="List of schools in the area")
    
    class Config:
        extra = "forbid"
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Schools data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        income = user_preferences.get('income_range', 'middle')
        
        # Generate school example using SchoolInfo class method
        school_example = SchoolInfo.get_example(user_preferences)
        
        if children_count > 0:
            return {
                "schools": [
                    {
                        **school_example,
                        "name": "Prestigious Academy Elementary"
                    },
                    {
                        **school_example,
                        "name": "Excellence Prep Middle School",
                        "level": "Middle School",
                        "school_rating": "9.9/10",
                    }
                ]
            }
        elif children_count == 2:
            return {
                "schools": [
                    {
                        **school_example,
                        "name": "Family-Friendly Elementary"
                    },
                    {
                        **school_example,
                        "name": "Community Middle School",
                        "level": "Middle School",
                        "school_rating": "9.0/10",
                    }
                ]
            }
        else:
            return {
                "schools": [
                    {
                        "name": "Seaside Elementary",
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.2/10",
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

class MarketingReport(BaseModel):
    # === All your sections ===
    neighborhood_overview: Optional[NeighborhoodOverview] = None
    safety: Optional[Safety] = None
    culture_and_events: Optional[CultureAndEvents] = None
    social_character: Optional[SocialCharacter] = None
    commute: Optional[Commute] = None
    schools: Optional[Schools] = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: List[str] = PrivateAttr(default=[])

    class Config:
        extra = "forbid"

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
            print(f"  ✅ Including '{key}' (value: {'None' if base_dict[key] is None else 'populated'})")
            final_dict[key] = base_dict[key]

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
