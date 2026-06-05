"""
Property data section rendering for PDF reports.
"""

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, Spacer, Table, TableStyle

FLATTENED_FIELD_PATTERNS = {
    "preschool_": "Preschool",
    "elementary_": "Elementary School",
    "middle_": "Middle School",
    "high_": "High School",
    "restaurant_": "Restaurant",
    "activity_": "Activity",
    "park_": "Park",
    "grocery_store_": "Grocery Store",
    "utility_": "Utility Costs",
}


def add_property_data_section(elements, data, styles):
    """Add property data section with special aesthetic styling."""
    property_cards = []

    if "price" in data and data["price"] is not None:
        price_value = (
            f"${data['price']:,}" if isinstance(data["price"], int | float) else str(data["price"])
        )
        zillow_cell = ""
        if "zillow_url" in data and data["zillow_url"]:
            zillow_cell = (
                f'<link href="{data["zillow_url"]}" color="#6A7B52"><u>View on Zillow</u></link>'
            )
        price_table = Table(
            [
                [
                    Paragraph("<b>Price</b>", styles["SubHeader"]),
                    Paragraph(price_value, styles["Body"]),
                    Paragraph(zillow_cell, styles["Body"]),
                ]
            ],
            colWidths=[1.5 * inch, 3.0 * inch, 1.5 * inch],
        )
        price_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), "#f8f8f8"),
                    ("BORDER", (0, 0), (-1, -1), 1, "#D8CAB8"),
                    ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (1, 0), "LEFT"),
                    ("ALIGN", (2, 0), (2, 0), "RIGHT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        property_cards.append(price_table)
        property_cards.append(Spacer(1, 6))

    compact_fields = []
    if "bedrooms" in data and data["bedrooms"] is not None:
        compact_fields.append(f"{data['bedrooms']} bed")
    if "bathrooms" in data and data["bathrooms"] is not None:
        compact_fields.append(f"{data['bathrooms']} bath")
    if "living_area" in data and data["living_area"] is not None:
        area_value = (
            f"{data['living_area']:,} sq ft"
            if isinstance(data["living_area"], int | float)
            else str(data["living_area"])
        )
        compact_fields.append(area_value)
    if "property_type" in data and data["property_type"] is not None:
        compact_fields.append(str(data["property_type"]))

    if compact_fields:
        compact_text = " • ".join(compact_fields)
        compact_table = Table(
            [[Paragraph(compact_text, styles["Caption"])]], colWidths=[6.0 * inch]
        )
        compact_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), "#f8f8f8"),
                    ("BORDER", (0, 0), (-1, -1), 1, "#D8CAB8"),
                    ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        property_cards.append(compact_table)
        property_cards.append(Spacer(1, 6))

    remaining_fields = [
        ("lot_area", "Lot Area", lambda x: f"{x:,}" if isinstance(x, int | float) else str(x)),
        ("lot_unit", "Lot Unit", str),
        ("listing_status", "Status", str),
    ]
    for field_key, display_name, formatter in remaining_fields:
        if field_key in data and data[field_key] is not None:
            value = formatter(data[field_key])
            card_table = Table(
                [
                    [
                        Paragraph(f"<b>{display_name}</b>", styles["SubHeader"]),
                        Paragraph(value, styles["Body"]),
                    ]
                ],
                colWidths=[2.0 * inch, 4.0 * inch],
            )
            card_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), "#f8f8f8"),
                        ("BORDER", (0, 0), (-1, -1), 1, "#D8CAB8"),
                        ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 12),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            property_cards.append(card_table)
            property_cards.append(Spacer(1, 6))

    elements.extend(property_cards)

    if "commute_times" in data and data["commute_times"]:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Commute Times", styles["SectionSubHeader"]))
        elements.append(
            HRFlowable(width="50%", thickness=1, color=colors.HexColor("#D8CAB8"), hAlign="LEFT")
        )
        elements.append(Spacer(1, 6))
        for location in data["commute_times"]:
            commute_text = f"• {location.get('name') or location.get('address', 'Unknown')} – {location.get('travel_time', 'N/A')}"
            elements.append(Paragraph(commute_text, styles["Body"]))
        elements.append(Spacer(1, 8))
