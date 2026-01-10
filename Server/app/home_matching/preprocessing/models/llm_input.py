"""
LLM input models for user and home data.

These models define the data structures passed to the LLM scorer,
optimized for prompt building.
"""

from typing import Dict, Any, Optional, List
import logging

from .base import BaseInputModel

logger = logging.getLogger(__name__)


class LLMUserInput(BaseInputModel):
    """User data structure for LLM scorer, optimized for prompt building."""
    
    _required_fields = ['user_id']
    
    def __init__(
        self,
        user_id: str,
        preferences: Optional[Dict[str, Any]] = None,
        email: Optional[str] = None,
        name: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize LLM user input.
        
        Args:
            user_id: User identifier
            preferences: User preferences dictionary
            email: User email
            name: User name
        """
        self.user_id = user_id
        self.preferences = preferences or {}
        self.email = email
        self.name = name
        
        # Store any additional fields
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format expected by LLM prompt builder."""
        return {
            'user_id': self.user_id,
            'preferences': self.preferences,
            'email': self.email,
            'name': self.name,
        }
    
    def format_for_prompt(self) -> str:
        """
        Format user data for LLM prompt generation.
        
        Returns:
            Formatted string for prompt
        """
        sections = [f"USER PROFILE (ID: {self.user_id})"]
        prefs = self.preferences or {}
        
        # ESSENTIAL REQUIREMENTS - Always include these key factors
        essential_reqs = []
        
        # Budget information - Always show
        budget_min = prefs.get('budget_min', 0) or prefs.get('home_budget_min', 0)
        budget_max = prefs.get('budget_max', 0) or prefs.get('home_budget_max', 0)
        if budget_max > 0:
            if budget_min > 0 and budget_min != budget_max:
                essential_reqs.append(f"Budget: ${budget_min:,} - ${budget_max:,}")
            else:
                essential_reqs.append(f"Budget: Up to ${budget_max:,}")
        else:
            essential_reqs.append("Budget: Not specified")
        
        # Bedroom requirements - Always show
        preferred_bedrooms = prefs.get('preferred_bedrooms', 0)
        if preferred_bedrooms > 0:
            essential_reqs.append(f"Bedrooms needed: {preferred_bedrooms}")
        else:
            essential_reqs.append("Bedrooms needed: Not specified")
        
        # Bathroom requirements - Always show
        preferred_bathrooms = prefs.get('preferred_bathrooms', 0)
        if preferred_bathrooms > 0:
            essential_reqs.append(f"Bathrooms needed: {preferred_bathrooms}")
        else:
            essential_reqs.append("Bathrooms needed: Not specified")
        
        # Lot size preferences
        if prefs.get('preferred_lot_size'):
            essential_reqs.append(f"Lot size preference: {prefs['preferred_lot_size']}")
        
        # Square footage
        if prefs.get('min_sqft'):
            essential_reqs.append(f"Minimum square feet: {prefs['min_sqft']:,}")
        
        sections.extend(essential_reqs)
        
        # Home type preferences
        if prefs.get('preferred_home_types'):
            types = ', '.join(prefs['preferred_home_types']) if isinstance(prefs['preferred_home_types'], list) else str(prefs['preferred_home_types'])
            sections.append(f"Preferred home types: {types}")
        
        # Location preferences
        location_prefs = []
        if prefs.get('preferred_neighborhoods'):
            neighborhoods = ', '.join(prefs['preferred_neighborhoods']) if isinstance(prefs['preferred_neighborhoods'], list) else str(prefs['preferred_neighborhoods'])
            location_prefs.append(f"Preferred neighborhoods: {neighborhoods}")
        if prefs.get('max_commute_minutes'):
            location_prefs.append(f"Max commute: {prefs['max_commute_minutes']} minutes")
        if prefs.get('location_preference'):
            location_prefs.append(f"Location style: {prefs['location_preference']}")
        
        if location_prefs:
            sections.append("Location preferences: " + '; '.join(location_prefs))
        
        # Lifestyle and personal info
        lifestyle_info = []
        if prefs.get('lifestyle'):
            lifestyle_info.append(f"Lifestyle: {prefs['lifestyle']}")
        if prefs.get('family_status'):
            lifestyle_info.append(f"Family: {prefs['family_status']}")
        if prefs.get('work_style'):
            lifestyle_info.append(f"Work style: {prefs['work_style']}")
        if prefs.get('hobbies'):
            lifestyle_info.append(f"Hobbies: {prefs['hobbies']}")
        
        if lifestyle_info:
            sections.append("Personal info: " + '; '.join(lifestyle_info))
        
        # Must-have amenities
        if prefs.get('must_have_amenities'):
            amenities = ', '.join(prefs['must_have_amenities']) if isinstance(prefs['must_have_amenities'], list) else str(prefs['must_have_amenities'])
            sections.append(f"Must-have amenities: {amenities}")
        
        # Nice-to-have amenities
        if prefs.get('nice_to_have_amenities'):
            amenities = ', '.join(prefs['nice_to_have_amenities']) if isinstance(prefs['nice_to_have_amenities'], list) else str(prefs['nice_to_have_amenities'])
            sections.append(f"Nice-to-have amenities: {amenities}")
        
        # Special requirements
        requirements = []
        if prefs.get('pet_friendly'):
            requirements.append("Pet-friendly required")
        if prefs.get('parking_required'):
            requirements.append("Parking required")
        if prefs.get('outdoor_space_required'):
            requirements.append("Outdoor space required")
        
        if requirements:
            sections.append(f"Special requirements: {', '.join(requirements)}")
        
        # Additional notes
        if prefs.get('notes'):
            sections.append(f"Additional notes: {prefs['notes']}")
        
        return '\n'.join(sections)
    
    def __repr__(self) -> str:
        """String representation."""
        return f"<LLMUserInput user_id={self.user_id}>"


class LLMHomeInput(BaseInputModel):
    """Home data structure for LLM scorer, optimized for prompt building."""
    
    _required_fields = []
    
    def __init__(
        self,
        home_id: Optional[str] = None,
        price: Optional[float] = None,
        bedrooms: Optional[float] = None,
        bathrooms: Optional[float] = None,
        sqft: Optional[float] = None,
        lot_size: Optional[float] = None,
        property_type: Optional[str] = None,
        home_type: Optional[str] = None,
        year_built: Optional[float] = None,
        description: Optional[str] = None,
        features: Optional[Any] = None,
        amenities: Optional[List[str]] = None,
        neighborhood: Optional[str] = None,
        neighborhood_info: Optional[Any] = None,
        school_district: Optional[str] = None,
        commute_minutes: Optional[float] = None,
        address: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        zipcode: Optional[str] = None,
        has_garage: Optional[bool] = None,
        has_yard: Optional[bool] = None,
        has_pool: Optional[bool] = None,
        pet_friendly: Optional[bool] = None,
        recently_renovated: Optional[bool] = None,
        nearby_amenities: Optional[Any] = None,
        walkability_score: Optional[float] = None,
        transit_score: Optional[float] = None,
        **kwargs
    ):
        """Initialize LLM home input."""
        self.home_id = home_id
        self.price = price
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.sqft = sqft
        self.lot_size = lot_size
        self.property_type = property_type
        self.home_type = home_type
        self.year_built = year_built
        self.description = description
        self.features = features
        self.amenities = amenities
        self.neighborhood = neighborhood
        self.neighborhood_info = neighborhood_info
        self.school_district = school_district
        self.commute_minutes = commute_minutes
        self.address = address
        self.city = city
        self.state = state
        self.zipcode = zipcode
        self.has_garage = has_garage
        self.has_yard = has_yard
        self.has_pool = has_pool
        self.pet_friendly = pet_friendly
        self.recently_renovated = recently_renovated
        self.nearby_amenities = nearby_amenities
        self.walkability_score = walkability_score
        self.transit_score = transit_score
        
        # Store any additional fields
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format expected by LLM prompt builder."""
        result = {
            'home_id': self.home_id,
            'price': self.price,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'sqft': self.sqft,
            'lot_size': self.lot_size,
            'property_type': self.property_type,
            'home_type': self.home_type,
            'year_built': self.year_built,
            'description': self.description,
            'features': self.features,
            'amenities': self.amenities,
            'neighborhood': self.neighborhood,
            'neighborhood_info': self.neighborhood_info,
            'school_district': self.school_district,
            'commute_minutes': self.commute_minutes,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zipcode': self.zipcode,
            'has_garage': self.has_garage,
            'has_yard': self.has_yard,
            'has_pool': self.has_pool,
            'pet_friendly': self.pet_friendly,
            'recently_renovated': self.recently_renovated,
            'nearby_amenities': self.nearby_amenities,
            'walkability_score': self.walkability_score,
            'transit_score': self.transit_score,
        }
        
        # Add any additional fields
        for key in dir(self):
            if not key.startswith('_') and key not in result and not callable(getattr(self, key)):
                value = getattr(self, key)
                if value is not None:
                    result[key] = value
        
        return result
    
    def format_for_prompt(self) -> str:
        """
        Format home data for LLM prompt generation.
        
        Returns:
            Formatted string for prompt
        """
        home_id = self.home_id or 'Unknown'
        sections = [f"HOME LISTING (ID: {home_id})"]
        
        # Address
        if self.address:
            sections.append(f"Address: {self.address}")
        
        # ESSENTIAL DETAILS - Always include these key factors
        essential_details = []
        
        # Price - Always show
        price = self.price or 0
        if price > 0:
            essential_details.append(f"Price: ${price:,}")
        else:
            essential_details.append("Price: Not specified")
        
        # Bedrooms - Always show
        bedrooms = self.bedrooms or 0
        essential_details.append(f"Bedrooms: {bedrooms}")
        
        # Bathrooms - Always show
        bathrooms = self.bathrooms or 0
        essential_details.append(f"Bathrooms: {bathrooms}")
        
        # Lot size - Always show if available
        lot_size = self.lot_size or getattr(self, 'lotSize', None) or getattr(self, 'lot_area', None)
        if lot_size:
            essential_details.append(f"Lot size: {lot_size}")
        else:
            essential_details.append("Lot size: Not specified")
        
        # Square footage
        sqft = self.sqft or getattr(self, 'living_area', None) or getattr(self, 'square_feet', None)
        if sqft:
            essential_details.append(f"Square feet: {sqft:,}")
        
        sections.extend(essential_details)
        
        # Additional property details
        if self.property_type:
            sections.append(f"Property type: {self.property_type}")
        if self.year_built:
            sections.append(f"Year built: {self.year_built}")
        
        # Location context
        if self.neighborhood:
            sections.append(f"Neighborhood: {self.neighborhood}")
        if self.commute_minutes:
            sections.append(f"Commute time: {self.commute_minutes} minutes")
        
        # Features and amenities
        if self.amenities:
            if isinstance(self.amenities, list):
                amenities = ', '.join(self.amenities)
            else:
                amenities = str(self.amenities)
            sections.append(f"Amenities: {amenities}")
        
        if self.features:
            if isinstance(self.features, list):
                features = ', '.join(self.features)
            else:
                features = str(self.features)
            sections.append(f"Features: {features}")
        
        # Special characteristics
        special_features = []
        if self.has_garage:
            special_features.append("Garage")
        if self.has_yard:
            special_features.append("Yard")
        if self.has_pool:
            special_features.append("Pool")
        if self.pet_friendly:
            special_features.append("Pet-friendly")
        if self.recently_renovated:
            special_features.append("Recently renovated")
        
        if special_features:
            sections.append(f"Special features: {', '.join(special_features)}")
        
        # Description
        if self.description:
            sections.append(f"Description: {self.description}")
        
        # Neighborhood info
        if self.neighborhood_info:
            sections.append(f"Neighborhood info: {self.neighborhood_info}")
        
        # Nearby amenities
        if self.nearby_amenities:
            if isinstance(self.nearby_amenities, list):
                nearby = ', '.join(self.nearby_amenities)
            else:
                nearby = str(self.nearby_amenities)
            sections.append(f"Nearby: {nearby}")
        
        return '\n'.join(sections)
    
    def __repr__(self) -> str:
        """String representation."""
        return f"<LLMHomeInput price={self.price} bedrooms={self.bedrooms}>"
