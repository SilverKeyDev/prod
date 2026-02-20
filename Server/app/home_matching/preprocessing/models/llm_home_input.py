"""
LLM home input model for scorer prompt building.

Defines the home data structure passed to the LLM scorer.
"""

from typing import Any

from .base import BaseInputModel


class LLMHomeInput(BaseInputModel):
    """Home data structure for LLM scorer, optimized for prompt building."""

    _required_fields = []

    def __init__(
        self,
        home_id: str | None = None,
        price: float | None = None,
        bedrooms: float | None = None,
        bathrooms: float | None = None,
        sqft: float | None = None,
        lot_size: float | None = None,
        property_type: str | None = None,
        home_type: str | None = None,
        year_built: float | None = None,
        description: str | None = None,
        features: Any | None = None,
        amenities: list[str] | None = None,
        neighborhood: str | None = None,
        neighborhood_info: Any | None = None,
        school_district: str | None = None,
        commute_minutes: float | None = None,
        address: str | None = None,
        city: str | None = None,
        state: str | None = None,
        zipcode: str | None = None,
        has_garage: bool | None = None,
        has_yard: bool | None = None,
        has_pool: bool | None = None,
        pet_friendly: bool | None = None,
        recently_renovated: bool | None = None,
        nearby_amenities: Any | None = None,
        walkability_score: float | None = None,
        transit_score: float | None = None,
        **kwargs,
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

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format expected by LLM prompt builder."""
        result = {
            "home_id": self.home_id,
            "price": self.price,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "sqft": self.sqft,
            "lot_size": self.lot_size,
            "property_type": self.property_type,
            "home_type": self.home_type,
            "year_built": self.year_built,
            "description": self.description,
            "features": self.features,
            "amenities": self.amenities,
            "neighborhood": self.neighborhood,
            "neighborhood_info": self.neighborhood_info,
            "school_district": self.school_district,
            "commute_minutes": self.commute_minutes,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zipcode": self.zipcode,
            "has_garage": self.has_garage,
            "has_yard": self.has_yard,
            "has_pool": self.has_pool,
            "pet_friendly": self.pet_friendly,
            "recently_renovated": self.recently_renovated,
            "nearby_amenities": self.nearby_amenities,
            "walkability_score": self.walkability_score,
            "transit_score": self.transit_score,
        }

        # Add any additional fields
        for key in dir(self):
            if not key.startswith("_") and key not in result and not callable(getattr(self, key)):
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
        home_id = self.home_id or "Unknown"
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
        lot_size = (
            self.lot_size or getattr(self, "lotSize", None) or getattr(self, "lot_area", None)
        )
        if lot_size:
            essential_details.append(f"Lot size: {lot_size}")
        else:
            essential_details.append("Lot size: Not specified")

        # Square footage
        sqft = self.sqft or getattr(self, "living_area", None) or getattr(self, "square_feet", None)
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
                amenities = ", ".join(self.amenities)
            else:
                amenities = str(self.amenities)
            sections.append(f"Amenities: {amenities}")

        if self.features:
            if isinstance(self.features, list):
                features = ", ".join(self.features)
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
                nearby = ", ".join(self.nearby_amenities)
            else:
                nearby = str(self.nearby_amenities)
            sections.append(f"Nearby: {nearby}")

        return "\n".join(sections)

    def __repr__(self) -> str:
        """String representation."""
        return f"<LLMHomeInput price={self.price} bedrooms={self.bedrooms}>"
