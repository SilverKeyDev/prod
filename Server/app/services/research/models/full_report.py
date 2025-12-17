from pydantic import BaseModel, Field, PrivateAttr
from typing import Dict, Optional, Any, List

# Import only the 9 core model classes
from .commute import CommuteSection
from .neighborhood import Neighborhood
from .financial import Affordability
from .family import FamilyFriendlySection
from .entertainment import Entertainment
from .investment import Investment
from .environment import ClimateEnvironmentalSafety
from .convenience import ConvenienceWalkability
from .home import Home

class FullReport(BaseModel):
    # === 9 core sections ===
    affordability: Optional[Affordability] = None
    neighborhood: Optional[Neighborhood] = None
    commute: Optional[CommuteSection] = None
    family_friendly: Optional[FamilyFriendlySection] = None
    entertainment: Optional[Entertainment] = None
    investment: Optional[Investment] = None
    climate_environmental_safety: Optional[ClimateEnvironmentalSafety] = None
    convenience_walkability: Optional[ConvenienceWalkability] = None
    home: Optional[Home] = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: List[str] = PrivateAttr(default=[])

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    def __init__(self, report_section_priorities: Dict[str, Any], **data):
        super().__init__(**data)
        self._prioritized_fields = report_section_priorities.get("report_section_priorities", [])

    def dict(self, **kwargs) -> Dict[str, Any]:
        base_dict = super().dict(**kwargs)
        final_dict = {}

        for key in self._prioritized_fields:
            if key not in base_dict:
                continue
            final_dict[key] = base_dict[key]

        return final_dict
