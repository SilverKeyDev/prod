"""
Embedding input models for user and home data.

These models define the data structures passed to the embedding scorer.
"""

from typing import Any

from .base import BaseInputModel


class EmbeddingUserInput(BaseInputModel):
    """User data structure for embedding scorer."""

    _required_fields = ["user_id"]

    def __init__(
        self,
        user_id: str,
        preferences: dict[str, Any] | None = None,
        email: str | None = None,
        name: str | None = None,
        has_preferences: bool | None = None,
        has_agent_role: bool | None = None,
        **kwargs,
    ):
        """Initialize embedding user input."""
        self.user_id = user_id
        self.preferences = preferences or {}
        self.email = email
        self.name = name
        self.has_preferences = has_preferences
        self.has_agent_role = has_agent_role

        # Store any additional fields
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format expected by embedding encoder."""
        return {
            "user_id": self.user_id,
            "preferences": self.preferences,
            "email": self.email,
            "name": self.name,
            "has_preferences": self.has_preferences,
            "has_agent_role": self.has_agent_role,
        }

    def extract_text_features(self) -> str:
        """
        Extract and combine text features from user data for embedding.

        Returns:
            Combined text string for embedding
        """
        text_parts = []
        prefs = self.preferences or {}

        # Lifestyle and personal info
        if "lifestyle" in prefs:
            text_parts.append(f"Lifestyle: {prefs['lifestyle']}")

        if "work_style" in prefs:
            text_parts.append(f"Work style: {prefs['work_style']}")

        if "hobbies" in prefs:
            text_parts.append(f"Hobbies: {prefs['hobbies']}")

        if "family_status" in prefs:
            text_parts.append(f"Family: {prefs['family_status']}")

        # Housing preferences
        if "preferred_home_types" in prefs:
            types = (
                ", ".join(prefs["preferred_home_types"])
                if isinstance(prefs["preferred_home_types"], list)
                else str(prefs["preferred_home_types"])
            )
            text_parts.append(f"Preferred home types: {types}")

        if "preferred_neighborhoods" in prefs:
            neighborhoods = (
                ", ".join(prefs["preferred_neighborhoods"])
                if isinstance(prefs["preferred_neighborhoods"], list)
                else str(prefs["preferred_neighborhoods"])
            )
            text_parts.append(f"Preferred neighborhoods: {neighborhoods}")

        if "must_have_amenities" in prefs:
            amenities = (
                ", ".join(prefs["must_have_amenities"])
                if isinstance(prefs["must_have_amenities"], list)
                else str(prefs["must_have_amenities"])
            )
            text_parts.append(f"Must have amenities: {amenities}")

        if "nice_to_have_amenities" in prefs:
            amenities = (
                ", ".join(prefs["nice_to_have_amenities"])
                if isinstance(prefs["nice_to_have_amenities"], list)
                else str(prefs["nice_to_have_amenities"])
            )
            text_parts.append(f"Nice to have amenities: {amenities}")

        # Location preferences
        if "location_preference" in prefs:
            text_parts.append(f"Location preference: {prefs['location_preference']}")

        if "commute_preference" in prefs:
            text_parts.append(f"Commute preference: {prefs['commute_preference']}")

        # Additional notes
        if "notes" in prefs:
            text_parts.append(f"Additional notes: {prefs['notes']}")

        return " ".join(text_parts)

    def __repr__(self) -> str:
        """String representation."""
        return f"<EmbeddingUserInput user_id={self.user_id}>"


class EmbeddingHomeInput(BaseInputModel):
    """Home data structure for embedding scorer."""

    _required_fields = []

    def __init__(
        self,
        price: float | None = None,
        bedrooms: float | None = None,
        bathrooms: float | None = None,
        sqft: float | None = None,
        lot_size: float | None = None,
        home_type: str | None = None,
        property_type: str | None = None,
        year_built: float | None = None,
        description: str | None = None,
        features: Any | None = None,
        amenities: list[str] | None = None,
        neighborhood_info: Any | None = None,
        school_district: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        commute_minutes: float | None = None,
        city: str | None = None,
        state: str | None = None,
        zipcode: str | None = None,
        **kwargs,
    ):
        """Initialize embedding home input."""
        self.price = price
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.sqft = sqft
        self.lot_size = lot_size
        self.home_type = home_type
        self.property_type = property_type
        self.year_built = year_built
        self.description = description
        self.features = features
        self.amenities = amenities
        self.neighborhood_info = neighborhood_info
        self.school_district = school_district
        self.latitude = latitude
        self.longitude = longitude
        self.commute_minutes = commute_minutes
        self.city = city
        self.state = state
        self.zipcode = zipcode

        # Store any additional fields
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format expected by embedding encoder."""
        result = {
            "price": self.price,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "sqft": self.sqft,
            "lot_size": self.lot_size,
            "home_type": self.home_type,
            "property_type": self.property_type,
            "year_built": self.year_built,
            "description": self.description,
            "features": self.features,
            "amenities": self.amenities,
            "neighborhood_info": self.neighborhood_info,
            "school_district": self.school_district,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "commute_minutes": self.commute_minutes,
            "city": self.city,
            "state": self.state,
            "zipcode": self.zipcode,
        }

        # Add any additional fields
        for key in dir(self):
            if not key.startswith("_") and key not in result and not callable(getattr(self, key)):
                value = getattr(self, key)
                if value is not None:
                    result[key] = value

        return result

    def extract_text_features(self) -> str:
        """
        Extract and combine text features from home data for embedding.

        Returns:
            Combined text string for embedding
        """
        text_parts = []

        # Basic property info
        address = getattr(self, "address", None)
        if address:
            text_parts.append(f"Address: {address}")

        if self.description:
            text_parts.append(f"Description: {self.description}")

        # Property characteristics
        if self.home_type:
            text_parts.append(f"Home type: {self.home_type}")

        style = getattr(self, "style", None)
        if style:
            text_parts.append(f"Architectural style: {style}")

        condition = getattr(self, "condition", None)
        if condition:
            text_parts.append(f"Condition: {condition}")

        # Size and layout
        if self.bedrooms and self.bedrooms > 0:
            text_parts.append(f"{self.bedrooms} bedrooms")
        if self.bathrooms and self.bathrooms > 0:
            text_parts.append(f"{self.bathrooms} bathrooms")
        if self.sqft and self.sqft > 0:
            text_parts.append(f"{self.sqft} square feet")

        # Amenities and features
        if self.amenities:
            if isinstance(self.amenities, list):
                amenities = ", ".join(self.amenities)
            else:
                amenities = str(self.amenities)
            text_parts.append(f"Amenities: {amenities}")

        if self.features:
            if isinstance(self.features, list):
                features = ", ".join(self.features)
            else:
                features = str(self.features)
            text_parts.append(f"Features: {features}")

        # Neighborhood information
        neighborhood = getattr(self, "neighborhood", None)
        if neighborhood:
            text_parts.append(f"Neighborhood: {neighborhood}")

        if self.neighborhood_info:
            text_parts.append(f"Neighborhood info: {self.neighborhood_info}")

        if self.school_district:
            text_parts.append(f"School district: {self.school_district}")

        # Location characteristics
        walkability_score = getattr(self, "walkability_score", None)
        if walkability_score is not None:
            text_parts.append(f"Walkability score: {walkability_score}")

        transit_score = getattr(self, "transit_score", None)
        if transit_score is not None:
            text_parts.append(f"Transit score: {transit_score}")

        # Nearby amenities
        nearby_amenities = getattr(self, "nearby_amenities", None)
        if nearby_amenities:
            if isinstance(nearby_amenities, list):
                nearby = ", ".join(nearby_amenities)
            else:
                nearby = str(nearby_amenities)
            text_parts.append(f"Nearby: {nearby}")

        return " ".join(text_parts)

    def __repr__(self) -> str:
        """String representation."""
        return f"<EmbeddingHomeInput price={self.price} bedrooms={self.bedrooms}>"
