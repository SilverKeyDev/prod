from pydantic import BaseModel, Field, Extra, model_validator
from typing import List, Dict, Optional, Any, Union

class Demographics(BaseModel):
    gender_distribution: Optional[Union[str, Dict[str, str]]] = None
    racial_distribution: Optional[Union[str, Dict[str, str]]] = None
    age_distribution: Optional[Union[str, Dict[str, str]]] = None
    lifestyle_dna: Optional[Union[str, Dict[str, str]]] = None

class NeighborhoodOverview(BaseModel):
    local_culture: str
    vibe: str
    known_for: str
    community_events: str
    what_people_love: str
    things_to_watch_out_for: str
    population_total: str
    neighborhood_rating: str
    LGBTQ_representation: str
    image_prompt: str
    demographics: Demographics

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

class SchoolInfo(BaseModel):
    level: str
    walking_distance: bool
    school_rating: str
    teacher_quality: str
    known_for: str
    gpa_avg: Optional[float] = None
    sat_avg: Optional[int] = None
    grad_rate: Optional[float] = None
    top_colleges: Optional[str] = None

class Schools(BaseModel):
    schools: Dict[str, SchoolInfo]

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

    def __init__(self, report_customization=None, **data):
        # Extract report customization preferences
        if report_customization is None:
            report_customization = {}
        
        # Map preference keys to data keys
        preference_mapping = {
            'include_neighborhood_overview': 'neighborhood_overview',
            'include_safety': 'safety',
            'include_culture_and_events': 'culture_and_events', 
            'include_weather': 'weather',
            'include_social_character': 'social_character',
            'include_local_amenities': 'local_amenities',
            'include_commute': 'commute',
            'include_family_friendly': 'family_friendly',
            'include_nightlife_and_dating': 'nightlife_and_dating',
            'include_accessibility': 'accessibility',
            'include_development': 'development',
            'include_environment': 'environment_utilities',
            'include_money': 'financial_information',
            'include_schools': 'schools',
            'include_extra_tips': 'extra_tips'
        }
        
        # Filter out sections based on user preferences
        for pref_key, data_key in preference_mapping.items():
            if not report_customization.get(pref_key, True):  # Default to True if not specified
                data.pop(data_key, None)  # Remove the section if preference is False
        
        known_keys = {
            'neighborhood_overview', 'safety', 'culture_and_events', 'weather', 'social_character',
            'local_amenities', 'commute', 'family_friendly', 'nightlife_and_dating',
            'accessibility', 'development', 'environment_utilities', 'financial_information',
            'schools', 'extra_tips', 'demographics'  # include for cleanup
        }

        # Remove top-level demographics if it exists (cleanup)
        data.pop("demographics", None)

        super().__init__(**data)
