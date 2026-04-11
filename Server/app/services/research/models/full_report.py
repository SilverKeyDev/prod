from typing import Any

from pydantic import BaseModel, PrivateAttr

from .commute import CommuteSection
from .convenience import ConvenienceWalkability
from .entertainment import Entertainment
from .environment import ClimateEnvironmentalSafety
from .family import FamilyFriendlySection
from .financial import Affordability
from .investment import Investment
from .neighborhood import Neighborhood

# Fixed section order (matches client DEFAULT_REPORT_SECTIONS)
DEFAULT_SECTION_ORDER = [
    "affordability",
    "neighborhood",
    "commute",
    "family_friendly",
    "entertainment",
    "investment",
    "climate_environmental_safety",
    "convenience_walkability",
]


class FullReport(BaseModel):
    # === 8 core sections ===
    affordability: Affordability | None = None
    neighborhood: Neighborhood | None = None
    commute: CommuteSection | None = None
    family_friendly: FamilyFriendlySection | None = None
    entertainment: Entertainment | None = None
    investment: Investment | None = None
    climate_environmental_safety: ClimateEnvironmentalSafety | None = None
    convenience_walkability: ConvenienceWalkability | None = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: list[str] = PrivateAttr(default=[])

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    def __init__(self, _legacy_priorities: dict[str, Any] | None = None, **data):
        super().__init__(**data)
        self._prioritized_fields = DEFAULT_SECTION_ORDER

    def dict(self, **kwargs) -> dict[str, Any]:
        base_dict = super().dict(**kwargs)
        final_dict = {}

        for key in self._prioritized_fields:
            if key not in base_dict:
                continue
            final_dict[key] = base_dict[key]

        return final_dict
