"""Commute map and travel-time blocks for research PDF reports."""

import os

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Indenter, Paragraph, Spacer

from logger import log

from ...graphs.graphic_generation import generate_commute_map
from ..images.image_utils import resize_image_to_fit


def append_commute_map_section(
    elements: list,
    *,
    address: str,
    section_data: dict,
    styles,
    user_preferences: dict | None,
) -> None:
    """Append commute map image and travel-time bullets when credentials and prefs exist."""
    del section_data  # section payload reserved for future commute-specific fields
    try:
        google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if google_maps_api_key and user_preferences:
            commute_map_result = generate_commute_map(
                address, user_preferences, google_maps_api_key
            )
            if commute_map_result:
                if isinstance(commute_map_result, dict):
                    map_buffer = commute_map_result.get("map_buffer")
                    travel_times = commute_map_result.get("travel_times", [])
                else:
                    map_buffer = commute_map_result
                    travel_times = []
                if map_buffer:
                    try:
                        map_image = resize_image_to_fit(
                            map_buffer,
                            target_width=5.0 * inch,
                            target_height=3.5 * inch,
                        )
                        if map_image:
                            elements.append(Spacer(1, 10))
                            elements.append(map_image)
                            elements.append(
                                Paragraph(
                                    "Commute Routes to Important Locations",
                                    styles["Caption"],
                                )
                            )
                            elements.append(Spacer(1, 6))
                    except Exception as resize_error:
                        log.error(
                            "ERRORS",
                            "Error resizing commute map:",
                            {"detail": str(resize_error)},
                        )
                if travel_times:
                    elements.append(Paragraph("Travel Times by Car", styles["SectionSubHeader"]))
                    elements.append(Spacer(1, 1))
                    elements.append(
                        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D8CAB8"))
                    )
                    elements.append(Spacer(1, 4))
                    elements.append(Indenter(left=20))
                    for location in travel_times:
                        travel_text = f"&bull; {location['name']} – {location['travel_time']}"
                        elements.append(Paragraph(travel_text, styles["Normal"]))
                    elements.append(Spacer(1, 10))
        elif not google_maps_api_key:
            log.warn(
                "PROPERTY_DETAILS",
                "GOOGLE_MAPS_API_KEY not found - skipping commute map generation",
            )
        elif not user_preferences:
            log.warn(
                "PROPERTY_DETAILS",
                "User preferences not provided - skipping commute map generation",
            )
    except Exception as map_error:
        log.error("ERRORS", "Error generating commute map:", {"detail": str(map_error)})
