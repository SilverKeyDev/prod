from pydantic import BaseModel, Field, Extra, model_validator
from typing import List, Dict, Optional, Any, Union

class Demographics(BaseModel):
    neighborhood_distribution: Optional[Union[str, Dict[str, str]]] = None
    gender_distribution: Optional[Union[str, Dict[str, str]]] = None
    racial_distribution: Optional[Union[str, Dict[str, str]]] = None
    age_distribution: Optional[Union[str, Dict[str, str]]] = None
    lifestyle_dna: Optional[Union[str, Dict[str, str]]] = None
    # Handle alternative field names that AI might use
    gender: Optional[Union[str, Dict[str, str]]] = None
    race: Optional[Union[str, Dict[str, str]]] = None
    
    @model_validator(mode='before')
    @classmethod
    def map_alternative_fields(cls, values):
        """Map alternative field names to standard names if main fields are missing."""
        if isinstance(values, dict):
            # Map gender to gender_distribution if missing
            if not values.get('gender_distribution') and values.get('gender'):
                values['gender_distribution'] = values['gender']
            
            # Map race to racial_distribution if missing
            if not values.get('racial_distribution') and values.get('race'):
                values['racial_distribution'] = values['race']
        
        return values

class NeighborhoodOverview(BaseModel):
    local_culture: str
    vibe: str
    known_for: str
    community_events: str
    what_people_love: str
    things_to_watch_out_for: str
    population_total: str
    neighborhood_rating: str
    image_prompt: str
    LGBTQ_representation: str
    demographics: Demographics

class Safety(BaseModel):
    crime_rating: str
    places_to_watch_out_for: str
    police_presence: str
    safety_rating: str
    image_prompt: str

class CultureAndEvents(BaseModel):
    local_events: str
    seasonal_trends: str
    community_engagement: str
    culture_rating: str
    image_prompt: str

class Weather(BaseModel):
    spring: str
    summer: str
    fall: str
    winter: str
    image_prompt: str

class SocialCharacter(BaseModel):
    income_level: str
    political_leaning: str
    language_spoken: str
    religiosity: str
    cultural_tone: str
    social_rating: str
    image_prompt: str

class Restaurant(BaseModel):
    name: str
    vibe: Optional[str] = None
    what_to_try: Optional[str] = None

class Activity(BaseModel):
    name: str
    description: str

class Park(BaseModel):
    name: str
    features: str

class Amenity(BaseModel):
    name: str
    type: str
    vibe: Optional[str] = None

class LocalAmenities(BaseModel):
    restaurants: List[Restaurant]
    activities: List[Activity]
    parks: List[Park]
    thrift_store: Amenity
    grocery_store: Amenity
    late_night_restaurant: Amenity

class Commute(BaseModel):
    commute_times: str
    public_transport: str
    traffic: str
    walkability: str

class FamilyFriendly(BaseModel):
    lots_of_kids: str
    great_for_families: str
    family_rating: str

class NightlifeAndDating(BaseModel):
    nightlife_rating: str
    nightlife_score: float
    best_spots: str
    dating_scene: str
    average_attractiveness_rating: str
    apps_popularity: Dict[str, str]
    image_prompt: str

class Accessibility(BaseModel):
    wheelchair_friendly: str
    ada_compliance: str
    age_friendly: str
    accessibility_rating: str

class Development(BaseModel):
    upcoming_changes: str
    zoning_or_construction: str
    gentrification_signs: str
    vacancy_or_decay: str
    image_prompt: str

class EnvironmentUtilities(BaseModel):
    air_quality: str
    noise_pollution: str
    light_pollution: str
    water_quality: str
    avg_utility_costs: Dict[str, str]
    internet_speed: str
    environmental_rating: str

class FinancialInformation(BaseModel):
    monthly_payment: str
    property_taxes: str
    value_assessment: str
    investment_potential: str
    financial_rating: str
    seller_information: str
    purchase_strategy: str

class School(BaseModel):
    name: str
    level: str
    walking_distance: Optional[bool] = None
    school_rating: Optional[str] = None
    teacher_quality: str
    known_for: str
    gpa_avg: Optional[float] = None
    sat_avg: Optional[int] = None
    grad_rate: Optional[float] = None
    top_colleges: Optional[str] = None

class Schools(BaseModel):
    schools: List[School]

class ExtraTips(BaseModel):
    parking: str
    pet_friendly: str
    cell_service_quality: str
    other_notable_tips: str



class FullReport(BaseModel):
    # Address key and overview must be provided
    neighborhood_overview: NeighborhoodOverview

    # Optional sections
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

    class Config:
        extra = Extra.allow  # Still allow unknown fields just in case

    def __init__(self, **data):
        known_keys = {
            'safety', 'culture_and_events', 'weather', 'social_character',
            'local_amenities', 'commute', 'family_friendly', 'nightlife_and_dating',
            'accessibility', 'development', 'environment_utilities', 'financial_information',
            'schools', 'extra_tips', 'demographics'
        }

        dynamic_address_key = next((k for k in data if k not in known_keys), None)
        if not dynamic_address_key:
            raise ValueError("Missing dynamic address key (e.g., '123 Main St')")

        address_section = data.pop(dynamic_address_key)

        # Remove duplicate if present
        data.pop('demographics', None)

        data['address_key'] = dynamic_address_key
        data['neighborhood_overview'] = NeighborhoodOverview(**address_section)

        super().__init__(**data)
