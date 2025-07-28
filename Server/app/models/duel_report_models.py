from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union
from collections import OrderedDict


class ComparisonSummary(BaseModel):
    overall_recommendation: str = Field(...)
    priority_based_analysis: str = Field(...)
    lifestyle_match_score: str = Field(...)
    key_tradeoffs: str = Field(...)
    personalized_advice: str = Field(...)
    deal_breaker_analysis: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "overall_recommendation": {
                "location_a": "Dana Point - Coastal lifestyle with family amenities",
                "location_b": "Downtown LA - Urban professional environment",
                "winner": "location_a",
                "reason": f"Better matches user's lifestyle: {lifestyle} and family needs with {children_count} children"
            },
            "priority_based_analysis": {
                "top_priority": "family_friendly (user priority #1)",
                "location_a_score": "9.2/10 - Excellent schools, many families, safe streets",
                "location_b_score": "6.1/10 - Limited family amenities, busy urban environment",
                "winner": "location_a",
                "reason": f"Significantly better for families with {children_count} children"
            },
            "lifestyle_match_score": {
                "location_a": f"85% match - Aligns with {lifestyle} lifestyle, family needs, moderate income",
                "location_b": "62% match - Good for career growth but lacks family amenities",
                "winner": "location_a",
                "reason": f"Better overall alignment with user profile: {lifestyle}, income {income_range}, {children_count} children"
            },
            "key_tradeoffs": {
                "location_a_advantages": "Family-friendly, lower cost, outdoor activities, walkable",
                "location_a_disadvantages": "Limited career opportunities, fewer nightlife options",
                "location_b_advantages": "Career growth, nightlife, cultural events, transit access",
                "location_b_disadvantages": "Higher cost, less family-friendly, traffic congestion",
                "recommendation": "Choose A if family life is priority, B if career advancement is key"
            },
            "personalized_advice": {
                "user_situation": f"Young family with {children_count} children, income {income_range}",
                "advice": "Given your family priorities and moderate income, Location A offers better value and family amenities. Consider Location B only if career growth outweighs family considerations.",
                "timeline_consideration": "Location A's stable market gives you more flexibility",
                "financing_note": "Both locations work well with conventional financing"
            },
            "deal_breaker_analysis": {
                "user_deal_breakers": "Heavy traffic, high crime, poor schools",
                "location_a_issues": "None of your deal breakers present",
                "location_b_issues": "High traffic (matches your deal breaker: heavy commute)",
                "winner": "location_a",
                "reason": "Location B has deal breaker issues that conflict with your requirements"
            }
        }


    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "overall_recommendation": f"Overall comparison and recommendation between the two locations. Consider user's lifestyle ({lifestyle}), family situation ({children_count} children), and income ({income_range}) when making the recommendation.",
            "priority_based_analysis": "Analysis based on user's top priorities. Weight the comparison heavily toward the user's most important factors and life stage needs.",
            "lifestyle_match_score": f"Percentage match score for each location based on user's lifestyle preferences ({lifestyle}) and personal situation. Include reasoning for the scores.",
            "key_tradeoffs": "Clear comparison of advantages and disadvantages for each location. Help user understand what they gain and lose with each choice.",
            "personalized_advice": f"Specific advice tailored to user's situation: {lifestyle} lifestyle, {children_count} children, income {income_range}. Include practical considerations and timeline factors.",
            "deal_breaker_analysis": "Analysis of any factors that would be absolute deal breakers for the user. Identify if either location has issues that conflict with user's non-negotiable requirements."
        }


class Demographics(BaseModel):
    gender_distribution: Dict[str, str] = Field(..., description="REQUIRED: Gender distribution as object with percentage values. Must use format: {'Male': 'X%', 'Female': 'Y%'} where percentages add to 100%")
    racial_distribution: Dict[str, str] = Field(..., description="REQUIRED: Racial/ethnic distribution as object with percentage values. Must use format: {'White': 'X%', 'Latino': 'Y%', 'Asian': 'Z%', 'Other': 'W%'} where percentages add to 100%")
    age_distribution: Dict[str, str] = Field(..., description="REQUIRED: Age distribution as object with percentage values. Must use EXACT format: {'18-24': 'X%', '25-34': 'Y%', '35-49': 'Z%', '50-64': 'W%', '65+': 'V%'} where percentages add to 100%. DO NOT use median_age or other formats.")
    lifestyle_dna: Dict[str, str] = Field(..., description="REQUIRED: Lifestyle characteristics as object with percentage values. Must use format: {'Lifestyle1': 'X%', 'Lifestyle2': 'Y%', 'Lifestyle3': 'Z%'} where percentages add to 100%. DO NOT use High/Moderate/Low - use actual percentages.")
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        gender = user_preferences.get("gender", "Female") if user_preferences else "Female"
        age = user_preferences.get('age', 30) if user_preferences else 30
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "gender_distribution": {
                "location_a": {"Male": "49%", "Female": "51%"},
                "location_b": {"Male": "52%", "Female": "48%"},
                "winner": "location_a",
                "reason": f"Better matches user gender identity: {gender}"
            },
            "racial_distribution": {
                "location_a": {"White": "70%", "Latino": "15%", "Asian": "10%", "Other": "5%"},
                "location_b": {"White": "60%", "Latino": "25%", "Asian": "12%", "Other": "3%"},
                "winner": "location_b",
                "reason": "More diverse community aligns with user values"
            },
            "age_distribution": {
                "location_a": {"18-24": "10%", "25-34": "30%", "35-49": "25%", "50-64": "20%", "65+": "15%"},
                "location_b": {"18-24": "15%", "25-34": "40%", "35-49": "30%", "50-64": "10%", "65+": "5%"},
                "winner": "location_b",
                "reason": f"Higher concentration of user's age group: {age} years old"
            },
            "lifestyle_dna": {
                "location_a": {"Artistic": "50%", "Surfer": "20%", "Tech Remote Workers": "30%"},
                "location_b": {"Corporate": "60%", "Young Families": "25%", "Retirees": "15%"},
                "winner": "location_a",
                "reason": f"Better matches user lifestyle type: {lifestyle}"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        gender = user_preferences.get("gender", "Female") if user_preferences else "Female"
        age = user_preferences.get('age', 30) if user_preferences else 30
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "gender_distribution": f"Gender distribution breakdown for each location. Consider how the gender balance aligns with user's identity ({gender}) and social preferences.",
            "racial_distribution": "Racial and ethnic diversity breakdown for each location. Assess community diversity and cultural representation that matches user values.",
            "age_distribution": f"Age demographic breakdown for each location. Focus on age groups that align with user's life stage (age {age}) and social connections.",
            "lifestyle_dna": f"Dominant lifestyle and occupational groups in each location. Emphasize communities that match user's lifestyle type ({lifestyle}) and professional interests."
        }


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
    demographics: Demographics = Field(...)

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
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        return {
            "local_culture": f"Artistic and laid-back coastal community with a focus on marine activities (aligns with user lifestyle: {lifestyle})",
            "vibe": "Creative, beachy, relaxed",
            "known_for": "Beautiful beaches, surfing, whale watching, and Dana Point Harbor",
            "community_events": "Weekly farmers market, summer concerts, Festival of Whales, harbor festivals",
            "what_people_love": "Walkability, coastal charm, friendly community, outdoor activities",
            "things_to_watch_out_for": "Tourist crowds in summer, parking challenges after 6pm, weekend traffic",
            "population_total": "12,500",
            "neighborhood_rating": "8.3/10",
            "LGBTQ_representation": "High representation (~15%) with several LGBTQ-friendly businesses and events",
            "image_prompt": "Aerial view of a lively beach neighborhood with colorful homes and palm trees",
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "local_culture": f"Cultural texture and personality of the neighborhood. Focus on aspects that align with user's {lifestyle} lifestyle preferences.",
            "vibe": "Concise summary of neighborhood atmosphere in 2-5 words. Capture the essence that would appeal to the user's personality.",
            "known_for": "Main attractions, industries, or distinctive features that define the area. Highlight elements relevant to user interests.",
            "community_events": "Regular events, festivals, or community gatherings. Emphasize events that match user's social preferences and family situation.",
            "what_people_love": "Positive aspects residents frequently mention. Focus on benefits that align with user's priorities and lifestyle.",
            "things_to_watch_out_for": "Potential drawbacks or concerns residents should know about. Include issues particularly relevant to user's situation.",
            "population_total": "Total population count for the neighborhood. Consider if the community size matches user's preferences.",
            "neighborhood_rating": "Overall livability rating out of 10. Weight factors based on user's priorities and life stage.",
            "LGBTQ_representation": "Estimate of LGBTQ population percentage and community friendliness. Include inclusivity indicators important to user.",
            "image_prompt": "Descriptive prompt for generating a representative image of the neighborhood that captures its appeal to the user.",
            "demographics": "Detailed demographic breakdown using the Demographics model. Ensure data aligns with user's community preferences."
        }

class Safety(BaseModel):
    crime_rating: str = Field(...)
    places_to_watch_out_for: str = Field(...)
    police_presence: str = Field(...)
    safety_rating: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        return {
            "crime_rating": {
                "location_a": "Low - Minimal property crime, rare violent incidents",
                "location_b": "Moderate - Some break-ins, occasional street crime",
                "winner": "location_a",
                "reason": "Significantly lower crime rates provide better security"
            },
            "places_to_watch_out_for": {
                "location_a": "Main St after 10pm, parking lots near train station",
                "location_b": "Multiple areas: downtown core, several intersections, park after dark",
                "winner": "location_a",
                "reason": "Fewer problematic areas, easier to avoid risk zones"
            },
            "police_presence": {
                "location_a": "Regular patrol cars, community policing, quick response",
                "location_b": "Limited patrols, slower response times, understaffed",
                "winner": "location_a",
                "reason": "Superior police presence and community engagement"
            },
            "safety_rating": {
                "location_a": "7.8/10",
                "location_b": "5.2/10",
                "winner": "location_a",
                "reason": "Significantly higher safety rating"
            },
            "image_prompt": f"Well-lit residential street with sidewalks, street lamps, and visible security features (emphasizing {safety_focus})"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        return {
            "crime_rating": "Crime level assessment (Nonexistent, Low, Moderate, High, Very High). Focus on safety factors most relevant to user's situation.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk. Prioritize areas relevant to user's daily routines and family needs.",
            "police_presence": "Frequency and visibility of police patrols in the area. Emphasize community policing and response times.",
            "safety_rating": "Overall safety score out of 10 based on crime data and community perception. Weight factors based on user's safety priorities.",
            "image_prompt": f"Descriptive prompt for generating an image representing neighborhood safety (emphasizing {safety_focus})."
        }

class CultureAndEvents(BaseModel):
    local_events: str = Field(...)
    seasonal_trends: str = Field(...)
    community_engagement: str = Field(...)
    culture_rating: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "local_events": {
                "location_a": "Art walks, harbor festivals, surf competitions, farmers markets",
                "location_b": "Business conferences, rooftop parties, cultural events, food festivals",
                "winner": "location_a",
                "reason": f"Events better match user's {lifestyle} lifestyle preferences"
            },
            "seasonal_trends": {
                "location_a": "Busy summers with beach events, quieter winters with indoor cultural activities",
                "location_b": "Year-round business events, peak activity during conference seasons",
                "winner": "location_a",
                "reason": "Seasonal variety provides better work-life balance"
            },
            "community_engagement": {
                "location_a": "Active neighborhood watch, volunteer cleanup days, high voter turnout",
                "location_b": "Professional networking groups, limited community involvement",
                "winner": "location_a",
                "reason": "Stronger community bonds and civic participation"
            },
            "culture_rating": {
                "location_a": "8.5/10",
                "location_b": "6.2/10",
                "winner": "location_a",
                "reason": "Higher cultural vibrancy and community activities"
            },
            "image_prompt": {
                "location_a": "Vibrant street festival with food vendors, live music, and families enjoying community activities",
                "location_b": "Business district with corporate events and professional networking gatherings",
                "winner": "location_a",
                "reason": "More appealing and inclusive community atmosphere"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "local_events": f"Regular events, festivals, and activities that residents attend. Focus on events that align with user's {lifestyle} lifestyle and social preferences.",
            "seasonal_trends": "How activity and atmosphere change throughout the year. Consider user's preferences for seasonal variety and activity levels.",
            "community_engagement": "Level of civic participation and community involvement. Emphasize engagement opportunities that match user's social interests.",
            "culture_rating": "Cultural vibrancy score out of 10 based on events and community activities. Weight factors based on user's cultural priorities.",
            "image_prompt": "Descriptive prompt for generating an image of local culture and events that captures the community spirit appealing to the user."
        }

class Weather(BaseModel):
    spring: str = Field(...)
    summer: str = Field(...)
    fall: str = Field(...)
    winter: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        return {
            "spring": {
                "location_a": "Mild and pleasant, 60-75°F, occasional rain, perfect for outdoor activities",
                "location_b": "Cool and wet, 50-65°F, frequent rain, limited outdoor time",
                "winner": "location_a",
                "reason": "Better spring weather for outdoor lifestyle"
            },
            "summer": {
                "location_a": "Warm and dry, 75-85°F, coastal breeze, ideal beach weather",
                "location_b": "Hot and humid, 85-95°F, oppressive heat, high energy costs",
                "winner": "location_a",
                "reason": "More comfortable summer temperatures"
            },
            "fall": {
                "location_a": "Cool and crisp, 55-70°F, beautiful foliage, comfortable for hiking",
                "location_b": "Mild but rainy, 60-70°F, overcast skies, limited outdoor activities",
                "winner": "location_a",
                "reason": "Better fall weather for outdoor activities"
            },
            "winter": {
                "location_a": "Mild winters, 45-60°F, some rain, rarely freezing",
                "location_b": "Cold winters, 25-40°F, snow and ice, high heating costs",
                "winner": "location_a",
                "reason": "Milder winter climate reduces costs and discomfort"
            },
            "image_prompt": {
                "location_a": "Four-season collage showing pleasant coastal weather year-round",
                "location_b": "Four-season collage showing more extreme weather variations",
                "winner": "location_a",
                "reason": "More appealing year-round climate"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        return {
            "spring": "Spring weather conditions, temperatures, and comfort level. Consider user's outdoor activity preferences and seasonal comfort needs.",
            "summer": "Summer weather patterns, heat levels, and seasonal characteristics. Factor in user's heat tolerance and cooling costs.",
            "fall": "Autumn weather conditions and seasonal transitions. Consider user's preferences for fall activities and seasonal changes.",
            "winter": "Winter weather patterns, cold levels, and seasonal activities. Factor in user's cold tolerance and heating costs.",
            "image_prompt": "Descriptive prompt for generating an image representing the area's climate that appeals to user's weather preferences."
        }

class SocialCharacter(BaseModel):
    income_level: str = Field(...)
    religiosity: str = Field(...)
    cultural_tone: str = Field(...)
    social_rating: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": {
                "location_a": "Middle-class professionals and young families, median household income $75,000",
                "location_b": "Upper-middle class executives and entrepreneurs, median household income $120,000",
                "winner": "location_a",
                "reason": f"Better matches user's income range: {income_range}"
            },
            "religiosity": {
                "location_a": "Moderate - several churches and temples, but not overly conservative",
                "location_b": "High - strong religious influence, many faith-based community activities",
                "winner": "location_a",
                "reason": "More balanced approach to religious community involvement"
            },
            "cultural_tone": {
                "location_a": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
                "location_b": "Competitive and status-conscious, focused on achievement and networking",
                "winner": "location_a",
                "reason": "More relaxed and inclusive community atmosphere"
            },
            "social_rating": {
                "location_a": "8.2/10",
                "location_b": "6.8/10",
                "winner": "location_a",
                "reason": "Higher community inclusivity and social cohesion"
            },
            "image_prompt": {
                "location_a": "Diverse group of neighbors chatting at a community gathering, showing friendly social interaction",
                "location_b": "Well-dressed professionals at an upscale networking event with formal atmosphere",
                "winner": "location_a",
                "reason": "More welcoming and accessible community vibe"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": f"Economic demographic of residents. Consider how the income levels align with user's financial situation ({income_range}) and social comfort.",
            "religiosity": "Level of religious activity and influence in the community. Assess compatibility with user's spiritual preferences and tolerance for religious influence.",
            "cultural_tone": "Overall social atmosphere and community personality. Focus on cultural aspects that match user's social preferences and values.",
            "social_rating": "Community inclusivity and social cohesion score out of 10. Weight factors based on user's social priorities and community involvement preferences.",
            "image_prompt": "Descriptive prompt for generating an image representing the social character that appeals to user's community preferences."
        }

class Restaurant(BaseModel):
    name: str = Field(...)
    vibe: Optional[str] = Field(None)
    what_to_try: Optional[str] = Field(None)

class Activity(BaseModel):
    name: str = Field(...)
    description: str = Field(...)

class Park(BaseModel):
    name: str = Field(...)
    features: str = Field(...)

class Amenity(BaseModel):
    name: str = Field(...)
    type: str = Field(...)
    vibe: Optional[str] = Field(None)

class LocalAmenities(BaseModel):
    restaurants: List[Restaurant] = Field(...)
    activities: List[Activity] = Field(...)
    parks: List[Park] = Field(...)
    thrift_store: Amenity = Field(...)
    grocery_store: Amenity = Field(...)
    late_night_restaurant: Amenity = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        dining_prefs = user_preferences.get('dining_preferences', ['casual dining']) if user_preferences else ['casual dining']
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        
        # Format preferences for display
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "restaurants": {
                "location_a": [{
                    "name": "The Coastal Kitchen",
                    "vibe": "Casual beachside dining with ocean views",
                    "what_to_try": f"Fish tacos, clam chowder, sunset cocktails (matches user dining preferences: {dining_str})"
                }],
                "location_b": [{
                    "name": "Urban Bistro",
                    "vibe": "Upscale downtown dining with city views",
                    "what_to_try": "Craft cocktails, artisan pizza, weekend brunch"
                }],
                "winner": "location_a",
                "reason": f"Better matches user's dining preferences: {dining_str}"
            },
            "activities": {
                "location_a": [{
                    "name": "Sunset Beach Volleyball",
                    "description": f"Popular evening volleyball games on the main beach (aligns with user interests: {hobbies_str})"
                }],
                "location_b": [{
                    "name": "Downtown Art Walk",
                    "description": "Monthly art gallery tours and street performances"
                }],
                "winner": "location_a",
                "reason": f"Activities better match user's hobbies: {hobbies_str}"
            },
            "parks": {
                "location_a": [{
                    "name": "Seaside Community Park",
                    "features": "Playground, walking trails, picnic areas, dog park, ocean views"
                }],
                "location_b": [{
                    "name": "Central City Park",
                    "features": "Urban green space, fitness equipment, food trucks"
                }],
                "winner": "location_a",
                "reason": "More family-friendly features and natural setting"
            },
            "thrift_store": {
                "location_a": {
                    "name": "Coastal Treasures",
                    "type": "Thrift Store",
                    "vibe": "Eclectic vintage finds with local character"
                },
                "location_b": {
                    "name": "City Consignment",
                    "type": "Thrift Store",
                    "vibe": "Designer consignment with curated selection"
                },
                "winner": "location_a",
                "reason": "More unique and affordable vintage options"
            },
            "grocery_store": {
                "location_a": {
                    "name": "Whole Foods Market",
                    "type": "Grocery Store",
                    "vibe": "Upscale organic grocery with prepared foods and wine bar"
                },
                "location_b": {
                    "name": "Metro Market",
                    "type": "Grocery Store",
                    "vibe": "Large chain supermarket with competitive prices"
                },
                "winner": "location_a",
                "reason": "Higher quality organic options and prepared foods"
            },
            "late_night_restaurant": {
                "location_a": {
                    "name": "24/7 Diner",
                    "type": "Late Night Dining",
                    "vibe": "Classic American diner with comfort food"
                },
                "location_b": {
                    "name": "Night Owl Cafe",
                    "type": "Late Night Dining",
                    "vibe": "Modern cafe with late-night coffee and light bites"
                },
                "winner": "location_a",
                "reason": "Full menu available 24/7 vs limited late-night options"
            }
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
            "restaurants": f"List of local dining establishments. Focus on options that match user's dining preferences: {dining_str}.",
            "activities": f"Local recreational activities and attractions. Prioritize activities that align with user's interests: {hobbies_str}.",
            "parks": "Green spaces and recreational areas. Consider accessibility, safety, and amenities that matter to the user.",
            "thrift_store": "Local thrift or second-hand shopping options. Assess quality, selection, and community character.",
            "grocery_store": "Primary grocery shopping options. Consider quality, price range, and specialty offerings that match user preferences.",
            "late_night_restaurant": "Late-night dining options for convenience and lifestyle needs."
        }


class Commute(BaseModel):
    commute_times: str = Field(...)
    public_transport: str = Field(...)
    traffic: str = Field(...)
    walkability: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30') if user_preferences else 'under_30'
        walkability_importance = user_preferences.get('walkability_importance', 'somewhat_important') if user_preferences else 'somewhat_important'
        
        return {
            "commute_times": {
                "location_a": "Downtown: 25 min, Airport: 45 min, Business District: 30 min",
                "location_b": "Downtown: 45 min, Airport: 20 min, Business District: 50 min",
                "winner": "location_a",
                "reason": f"Better overall commute times within user tolerance: {commute_tolerance} minutes"
            },
            "public_transport": {
                "location_a": "Metro bus every 15 min, light rail 0.5 miles, bike share",
                "location_b": "Limited bus service, no rail access, car-dependent",
                "winner": "location_a",
                "reason": "Superior transit options reduce car dependency"
            },
            "traffic": {
                "location_a": "Moderate rush hour congestion, generally light traffic",
                "location_b": "Heavy congestion most hours, frequent gridlock",
                "winner": "location_a",
                "reason": "Less stressful driving conditions"
            },
            "walkability": {
                "location_a": "Walk Score 85/100 - Most errands on foot, bike-friendly",
                "location_b": "Walk Score 45/100 - Car required for most errands",
                "winner": "location_a",
                "reason": f"High walkability matches user importance level: {walkability_importance}"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30') if user_preferences else 'under_30'
        walkability_importance = user_preferences.get('walkability_importance', 'somewhat_important') if user_preferences else 'somewhat_important'
        
        return {
            "commute_times": f"Typical commute times to major employment centers and downtown areas. Emphasize routes and times relevant to user's commute tolerance ({commute_tolerance}).",
            "public_transport": "Available public transportation options and their quality. Focus on transit options that align with user's transportation preferences.",
            "traffic": "Traffic patterns and congestion levels throughout the day. Highlight peak times and alternative routes based on user's schedule flexibility.",
            "walkability": f"How pedestrian-friendly the area is with Walk Score details. Weight walkability factors based on user's walkability importance ({walkability_importance})."
        }

class FamilyFriendly(BaseModel):
    lots_of_kids: str = Field(...)
    great_for_families: str = Field(...)
    family_rating: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "lots_of_kids": {
                "location_a": "High - Many families, playgrounds busy, school pickup lines",
                "location_b": "Low - Mostly young professionals, few children visible",
                "winner": "location_a" if children_count > 0 else "location_b",
                "reason": f"Better match for user with {children_count} children" if children_count > 0 else "Quieter environment suits childless lifestyle"
            },
            "great_for_families": {
                "location_a": "Excellent schools, safe streets, family events, parks nearby",
                "location_b": "Average schools, busy roads, limited family activities",
                "winner": "location_a",
                "reason": "Superior family amenities match user's family needs"
            },
            "family_rating": {
                "location_a": "9.2/10",
                "location_b": "6.8/10",
                "winner": "location_a",
                "reason": "Significantly higher family rating"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "lots_of_kids": f"Presence and visibility of children in the neighborhood. Focus on family density and child-friendly atmosphere (user has {children_count} children).",
            "great_for_families": "Family-oriented features and why families choose this area. Emphasize amenities and safety features most relevant to families with children.",
            "family_rating": "Overall family-friendliness score out of 10. Weight factors based on user's family situation and child-related needs."
        }

class NightlifeAndDating(BaseModel):
    nightlife_rating: str = Field(...)
    nightlife_score: float = Field(...)
    best_spots: str = Field(...)
    dating_scene: str = Field(...)
    apps_popularity: Dict[str, str] = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": {
                "location_a": "7.5/10",
                "location_b": "9.2/10",
                "winner": "location_b",
                "reason": "Higher nightlife rating for active social life"
            },
            "nightlife_score": {
                "location_a": 7.5,
                "location_b": 9.2,
                "winner": "location_b",
                "reason": "Significantly higher nightlife score"
            },
            "best_spots": {
                "location_a": "Rooftop Lounge, Coastal Brewery, live music at The Pier",
                "location_b": "Trendy nightclubs, rooftop bars, late-night dining scene",
                "winner": "location_b",
                "reason": "More diverse and vibrant nightlife options"
            },
            "dating_scene": {
                "location_a": "Laid-back beach volleyball meetups, wine tastings, farmers market",
                "location_b": "Active young professional scene, networking events, upscale venues",
                "winner": "location_b",
                "reason": f"Better matches user profile: {marital_status}, age {age}, active lifestyle"
            },
            "apps_popularity": {
                "location_a": {"Bumble": "Popular", "Hinge": "Moderate", "Tinder": "Low"},
                "location_b": {"Bumble": "Very Popular", "Hinge": "Very Popular", "Tinder": "Popular"},
                "winner": "location_b",
                "reason": "Higher dating app activity indicates more active dating scene"
            },
            "image_prompt": "Vibrant evening scene with people enjoying rooftop dining and coastal nightlife"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": "Overall nightlife quality and variety rating out of 10. Consider what appeals to the user's demographic and lifestyle.",
            "nightlife_score": "Numerical nightlife score for data analysis. Weight based on user's social preferences and age group.",
            "best_spots": "Popular bars, clubs, and entertainment venues. Focus on venues that match the user's social style and interests.",
            "dating_scene": f"Local dating culture and opportunities for meeting people. Tailor to user's marital status ({marital_status}) and age ({age}) - focus on relevant social opportunities.",
            "apps_popularity": "Dating app usage and popularity in the area. Emphasize apps most relevant to user's age group and relationship goals.",
            "image_prompt": "Descriptive prompt for generating an image of local nightlife that reflects the user's preferred social atmosphere."
        }

class Accessibility(BaseModel):
    wheelchair_friendly: str = Field(...)
    ada_compliance: str = Field(...)
    age_friendly: str = Field(...)
    accessibility_rating: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "wheelchair_friendly": {
                "location_a": "Good - Most sidewalks have curb cuts, accessible parking available, ramps at major buildings",
                "location_b": "Limited - Some older sidewalks lack curb cuts, limited accessible parking",
                "winner": "location_a",
                "reason": "Better wheelchair accessibility infrastructure"
            },
            "ada_compliance": {
                "location_a": "High compliance - New construction follows ADA standards, accessible public transportation",
                "location_b": "Moderate compliance - Older buildings may lack full accessibility features",
                "winner": "location_a",
                "reason": "Better ADA compliance across buildings and services"
            },
            "age_friendly": {
                "location_a": "Senior center nearby, medical facilities within walking distance, flat terrain, good lighting",
                "location_b": "Limited senior services, hilly terrain, some areas poorly lit at night",
                "winner": "location_a",
                "reason": f"More age-friendly features (user age: {age})"
            },
            "accessibility_rating": {
                "location_a": "8.1/10",
                "location_b": "6.3/10",
                "winner": "location_a",
                "reason": "Higher overall accessibility score for people with disabilities"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "wheelchair_friendly": "Wheelchair accessibility of sidewalks, buildings, and public spaces. Focus on infrastructure that supports mobility needs.",
            "ada_compliance": "Americans with Disabilities Act compliance level in the area. Assess how well the area accommodates people with disabilities.",
            "age_friendly": f"Features that support aging in place and senior-friendly amenities. Consider relevance to user's age ({age}) and future needs.",
            "accessibility_rating": "Overall accessibility score out of 10 for people with disabilities. Weight factors based on user's accessibility needs and priorities."
        }

class Development(BaseModel):
    upcoming_changes: str = Field(...)
    zoning_or_construction: str = Field(...)
    gentrification_signs: str = Field(...)
    vacancy_or_decay: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        return {
            "upcoming_changes": {
                "location_a": "New transit line planned for 2026, waterfront redevelopment project, park expansion",
                "location_b": "Highway widening project, strip mall development, limited infrastructure investment",
                "winner": "location_a",
                "reason": "More positive development with transit and green space improvements"
            },
            "zoning_or_construction": {
                "location_a": "Mixed-use development under construction, residential zoning allows ADUs, height limits preserved",
                "location_b": "Heavy industrial zoning nearby, high-density towers approved, limited construction controls",
                "winner": "location_a",
                "reason": "Better balanced zoning that preserves neighborhood character"
            },
            "gentrification_signs": {
                "location_a": "Moderate - Some rising property values, new businesses, but longtime residents staying",
                "location_b": "High - Rapid property value increases, longtime residents being displaced, chain stores replacing local businesses",
                "winner": "location_a",
                "reason": "More balanced development without excessive displacement"
            },
            "vacancy_or_decay": {
                "location_a": "Low vacancy rates, well-maintained properties, minimal urban decay",
                "location_b": "Some vacant storefronts, deferred maintenance visible, signs of economic stress",
                "winner": "location_a",
                "reason": "Better maintained neighborhood with economic stability"
            },
            "image_prompt": {
                "location_a": "Construction cranes and new development alongside established neighborhood character",
                "location_b": "Mix of vacant lots and overdevelopment creating inconsistent neighborhood feel",
                "winner": "location_a",
                "reason": "More thoughtful development that respects existing community"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        return {
            "upcoming_changes": "Planned developments, infrastructure projects, and future changes. Focus on how these changes will impact the user's lifestyle and property values.",
            "zoning_or_construction": "Current construction activity and zoning changes. Assess how ongoing development affects livability and future neighborhood character.",
            "gentrification_signs": "Indicators of neighborhood change and gentrification trends. Consider both positive improvements and potential displacement concerns.",
            "vacancy_or_decay": "Signs of economic decline or property neglect. Evaluate neighborhood stability and maintenance standards.",
            "image_prompt": "Descriptive prompt for generating an image of neighborhood development that reflects the area's growth trajectory."
        }

class EnvironmentUtilities(BaseModel):
    air_quality: str = Field(...)
    noise_pollution: str = Field(...)
    light_pollution: str = Field(...)
    water_quality: str = Field(...)
    avg_utility_costs: Dict[str, str] = Field(...)
    internet_speed: str = Field(...)
    environmental_rating: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "air_quality": {
                "location_a": "Good - AQI typically 45-65, minimal smog, ocean breeze helps circulation",
                "location_b": "Moderate - AQI 66-85, some smog during summer, limited air circulation",
                "winner": "location_a",
                "reason": "Better air quality for health and outdoor activities"
            },
            "noise_pollution": {
                "location_a": "Moderate - Some traffic noise on main roads, generally quiet residential streets",
                "location_b": "High - Heavy traffic noise, airport flight path, construction activity",
                "winner": "location_a",
                "reason": "Quieter environment for better quality of life"
            },
            "light_pollution": {
                "location_a": "Low to moderate - Can see some stars, street lighting present but not excessive",
                "location_b": "High - Bright city lights, minimal star visibility, excessive commercial lighting",
                "winner": "location_a",
                "reason": "Better night sky visibility and more natural lighting"
            },
            "water_quality": {
                "location_a": "Excellent - Meets all EPA standards, tastes good, no boil advisories in recent years",
                "location_b": "Good - Meets EPA standards but occasional taste/odor issues, rare advisories",
                "winner": "location_a",
                "reason": "Superior water quality and reliability"
            },
            "avg_utility_costs": {
                "location_a": {"Electricity": "$120", "Gas": "$45", "Water": "$35", "Internet": "$65"},
                "location_b": {"Electricity": "$180", "Gas": "$65", "Water": "$55", "Internet": "$85"},
                "winner": "location_a",
                "reason": f"Lower utility costs better fit user's income range: {income_range}"
            },
            "internet_speed": {
                "location_a": "Fiber available up to 1Gbps, cable up to 500Mbps, multiple provider options",
                "location_b": "Cable up to 200Mbps, limited fiber, fewer provider choices",
                "winner": "location_a",
                "reason": "Faster internet speeds and more provider competition"
            },
            "environmental_rating": {
                "location_a": "8.4/10",
                "location_b": "6.1/10",
                "winner": "location_a",
                "reason": "Higher overall environmental quality score"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "air_quality": "Air quality index and pollution levels in the area. Focus on health impacts and outdoor activity suitability.",
            "noise_pollution": "Noise levels from traffic, construction, and urban activity. Consider impact on sleep quality and daily comfort.",
            "light_pollution": "Light pollution levels and night sky visibility. Assess impact on sleep and natural environment enjoyment.",
            "water_quality": "Municipal water quality and safety ratings. Evaluate taste, safety, and reliability of water supply.",
            "avg_utility_costs": f"Average monthly utility costs for the area. Compare against user's income range ({income_range}) and budget expectations.",
            "internet_speed": "Available internet speeds and service providers. Consider work-from-home needs and entertainment requirements.",
            "environmental_rating": "Overall environmental quality score out of 10. Weight factors based on user's environmental priorities and health concerns."
        }

class FinancialInformation(BaseModel):
    monthly_payment: str = Field(...)
    property_taxes: str = Field(...)
    value_assessment: str = Field(...)
    investment_potential: str = Field(...)
    financial_rating: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        preferred_price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000') if user_preferences else '$300,000-$500,000'
        
        return {
            "monthly_payment": {
                "location_a": "$3,200/month for median home (20% down, 6.5% rate)",
                "location_b": "$4,800/month for median home (20% down, 6.5% rate)",
                "winner": "location_a",
                "reason": f"Better fits user income range: {income_range} and preferred price: {preferred_price_range}"
            },
            "property_taxes": {
                "location_a": "1.2% rate, ~$7,200/year for median home",
                "location_b": "2.1% rate, ~$15,000/year for median home",
                "winner": "location_a",
                "reason": "Significantly lower tax burden"
            },
            "value_assessment": {
                "location_a": "Values up 8% last year, strong market, low inventory",
                "location_b": "Values down 2% last year, oversupply, market cooling",
                "winner": "location_a",
                "reason": "Better investment appreciation potential"
            },
            "investment_potential": {
                "location_a": "High - Growing tech sector, transit improvements, 4-5% rental yields",
                "location_b": "Moderate - Stable but slow growth, 2-3% rental yields",
                "winner": "location_a",
                "reason": "Superior growth drivers and rental income potential"
            },
            "financial_rating": {
                "location_a": "8.7/10",
                "location_b": "6.2/10",
                "winner": "location_a",
                "reason": "Higher overall financial score"
            }
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
    level: str = Field(...)
    walking_distance: bool = Field(...)
    school_rating: str = Field(...)
    teacher_quality: str = Field(...)
    known_for: str = Field(...)
    gpa_avg: Optional[float] = Field(None)
    sat_avg: Optional[int] = Field(None)
    grad_rate: Optional[float] = Field(None)
    top_colleges: Optional[str] = Field(None)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "level": "Elementary",
            "walking_distance": True if children_count > 0 else False,
            "school_rating": "9.2/10",
            "teacher_quality": "Excellent - 85% have advanced degrees, low turnover, award-winning programs",
            "known_for": "STEM programs, arts integration, dual language immersion",
            "gpa_avg": 3.7,
            "sat_avg": 1340,
            "grad_rate": 96.5,
            "top_colleges": "UC Berkeley, Stanford, UCLA, USC, Cal Poly"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "level": "Educational level of the school (Elementary, Middle, High School). Focus on levels relevant to user's children.",
            "walking_distance": f"Whether the school is within walking distance. Important for families with {children_count} children for safety and convenience.",
            "school_rating": "Overall school rating out of 10. Weight academic performance and factors most important to the user's educational priorities.",
            "teacher_quality": "Quality and experience of teaching staff. Assess teacher credentials, retention, and program excellence.",
            "known_for": "Special programs or areas of excellence. Highlight programs that align with user's educational values and children's interests.",
            "gpa_avg": "Average GPA for high school students. Relevant for families with older children planning for college.",
            "sat_avg": "Average SAT score for high school students. Important for college preparation and academic achievement assessment.",
            "grad_rate": "Graduation rate as a percentage. Indicates school success in supporting students through completion.",
            "top_colleges": "Top colleges that graduates typically attend. Shows school's track record for college preparation and placement."
        }

class Schools(BaseModel):
    schools: Dict[str, SchoolInfo] = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "schools": {
                "location_a": {
                    "Seaside Elementary": {
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.2/10",
                        "teacher_quality": "Excellent - 85% have advanced degrees, low turnover",
                        "known_for": "STEM programs, arts integration",
                        "gpa_avg": None,
                        "sat_avg": None,
                        "grad_rate": None,
                        "top_colleges": None
                    },
                    "Coastal High School": {
                        "level": "High School",
                        "walking_distance": False,
                        "school_rating": "8.7/10",
                        "teacher_quality": "Very Good - Strong AP program, experienced staff",
                        "known_for": "College prep, marine science program",
                        "gpa_avg": 3.7,
                        "sat_avg": 1340,
                        "grad_rate": 96.5,
                        "top_colleges": "UC Berkeley, Stanford, UCLA, USC"
                    }
                },
                "location_b": {
                    "Metro Elementary": {
                        "level": "Elementary",
                        "walking_distance": False,
                        "school_rating": "7.1/10",
                        "teacher_quality": "Good - Some turnover, mixed experience levels",
                        "known_for": "Basic curriculum, limited special programs",
                        "gpa_avg": None,
                        "sat_avg": None,
                        "grad_rate": None,
                        "top_colleges": None
                    }
                },
                "winner": "location_a",
                "reason": f"Better school quality and options for families with {children_count} children"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "schools": f"Dictionary of schools in the area by name with detailed information. Focus on school quality, programs, and accessibility for families with {children_count} children. Compare educational opportunities between locations."
        }

class ExtraTips(BaseModel):
    parking: str = Field(...)
    pet_friendly: str = Field(...)
    cell_service_quality: str = Field(...)
    other_notable_tips: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        return {
            "parking": {
                "location_a": "Street parking mostly free, 2-hour limits near shops, resident permits available for $50/year",
                "location_b": "Paid parking meters $2/hour, limited street parking, monthly garage passes $150",
                "winner": "location_a",
                "reason": "More affordable and accessible parking options"
            },
            "pet_friendly": {
                "location_a": "Very pet-friendly - 3 dog parks within 1 mile, many restaurants allow dogs, vet clinic nearby",
                "location_b": "Moderately pet-friendly - 1 dog park, some pet restrictions, vet clinic 3 miles away",
                "winner": "location_a",
                "reason": "Better pet amenities and services"
            },
            "cell_service_quality": {
                "location_a": "Excellent coverage for all major carriers, 5G available, minimal dead zones",
                "location_b": "Good coverage but some dead spots, limited 5G, carrier-dependent quality",
                "winner": "location_a",
                "reason": "Superior cellular coverage and connectivity"
            },
            "other_notable_tips": {
                "location_a": "Best coffee at Corner Cafe, avoid Main St during school pickup, farmers market Saturdays 8am-2pm",
                "location_b": "Traffic heavy 7-9am and 5-7pm, limited local businesses, chain restaurants dominate",
                "winner": "location_a",
                "reason": "More local character and insider knowledge available"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        return {
            "parking": "Parking availability, costs, and regulations in the area. Consider user's vehicle needs and budget for parking expenses.",
            "pet_friendly": "Pet amenities, dog parks, and pet-friendly establishments. Focus on features relevant to user's pet ownership and animal preferences.",
            "cell_service_quality": "Mobile phone coverage and data speeds across carriers. Assess connectivity needs for work, communication, and entertainment.",
            "other_notable_tips": "Additional insider tips and local knowledge for residents. Provide practical advice that helps users navigate daily life in each location."
        }

class CompareReport(BaseModel):
    # === All your sections ===
    neighborhood_overview: Optional[NeighborhoodOverview] = None
    safety: Optional[Safety] = None
    culture_and_events: Optional[CultureAndEvents] = None
    weather: Optional[Weather] = None
    social_character: Optional[SocialCharacter] = None
    local_amenities: Optional[LocalAmenities] = None
    commute: Optional[Commute] = None
    family_friendly: Optional[FamilyFriendly] = None
    nightlife_and_dating: Optional[NightlifeAndDating] = None
    accessibility: Optional[Accessibility] = None
    development: Optional[Development] = None
    environment_utilities: Optional[EnvironmentUtilities] = None
    financial_information: Optional[FinancialInformation] = None
    schools: Optional[Schools] = None
    extra_tips: Optional[ExtraTips] = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: List[str] = PrivateAttr(default=[])

    class Config:
        extra = "allow"

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
        
        # Filter properties to only include prioritized fields and make them required (non-nullable)
        if "properties" in base:
            filtered_properties = {}
            for field_name in prioritized_fields:
                if field_name in base["properties"]:
                    prop_def = base["properties"][field_name]
                    
                    # Remove nullable option - convert from anyOf to direct $ref
                    if isinstance(prop_def, dict) and "anyOf" in prop_def:
                        # Find the $ref option (non-null)
                        for option in prop_def["anyOf"]:
                            if isinstance(option, dict) and "$ref" in option:
                                # Replace anyOf with direct $ref (making it required)
                                filtered_properties[field_name] = {
                                    "$ref": option["$ref"]
                                }
                                # Preserve example if it exists
                                if "example" in prop_def:
                                    filtered_properties[field_name]["example"] = prop_def["example"]
                                break
                    else:
                        # Keep as-is if not using anyOf pattern
                        filtered_properties[field_name] = prop_def
            
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