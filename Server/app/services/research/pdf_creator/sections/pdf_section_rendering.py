"""Section rendering for research PDFs: property data section and recursive _add_section."""

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, Spacer, Table, TableStyle

from .pdf_section_blocks import (
    try_add_chart_block,
    try_add_community_images_block,
    try_add_home_image_block,
    try_add_property_images_block,
)

FLATTENED_FIELD_PATTERNS = {
    # Schools fields
    "preschool_": "Preschool",
    "elementary_": "Elementary School",
    "middle_": "Middle School",
    "high_": "High School",
    # LocalAmenities fields
    "restaurant_": "Restaurant",
    "activity_": "Activity",
    "park_": "Park",
    "grocery_store_": "Grocery Store",
    # UtilityCosts fields (now in EnvironmentUtilities)
    "utility_": "Utility Costs",
}


def _add_property_data_section(elements, data, styles):
    """
    Add property data section with special aesthetic styling for enhanced visual appeal.
    """
    # Create elegant property data cards with enhanced styling
    property_cards = []

    # Add price card with Zillow link in same row
    if "price" in data and data["price"] is not None:
        price_value = (
            f"${data['price']:,}" if isinstance(data["price"], int | float) else str(data["price"])
        )

        # Create Zillow link if available
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
                    ("ALIGN", (0, 0), (1, 0), "LEFT"),  # Left align price label and value
                    ("ALIGN", (2, 0), (2, 0), "RIGHT"),  # Right align Zillow link
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )

        property_cards.append(price_table)
        property_cards.append(Spacer(1, 6))

    # Create compact row for bedrooms, bathrooms, living area, and property type
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
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),  # Left align compact details
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        property_cards.append(compact_table)
        property_cards.append(Spacer(1, 6))

    # Add remaining fields (lot area, lot unit, status)
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

    # Add all property cards
    elements.extend(property_cards)

    # Add commute times if available
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

    # Zillow link is now handled in the price row, so remove this section


def _add_section(elements, data, styles, level=0):
    # Group flattened fields by their pattern prefix
    flattened_groups = {}
    regular_fields = {}

    # First pass: identify and group flattened fields
    for k, v in data.items():
        is_flattened = False
        for pattern, title in FLATTENED_FIELD_PATTERNS.items():
            if k.startswith(pattern):
                if pattern not in flattened_groups:
                    flattened_groups[pattern] = {"title": title, "fields": {}}
                flattened_groups[pattern]["fields"][k] = v
                is_flattened = True
                break

        if not is_flattened:
            regular_fields[k] = v

    # Process flattened field groups first
    for pattern, group in flattened_groups.items():
        # Special handling for school fields vs other fields
        is_school_field = pattern in ["preschool_", "elementary_", "middle_", "high_"]

        # For non-school fields, add a group header
        if not is_school_field:
            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{group['title']}:</b>", styles["SectionSubHeader"]))
                elements.append(
                    HRFlowable(
                        width="30%", thickness=1, color=colors.HexColor("#AAAAAA"), hAlign="LEFT"
                    )
                )
            elif level == 1:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{group['title']}:</b>", styles["SubHeader"]))

        # Process fields within this group
        for k, v in group["fields"].items():
            # Format the field name without the prefix
            field_name = k.replace(pattern, "").replace("_", " ").title()

            # For school fields, if it's a name field, make it a subheader
            if is_school_field and field_name.lower() == "name" and v is not None:
                if level == 0:
                    elements.append(Spacer(1, 12))
                    elements.append(Paragraph(f"<b>{v}:</b>", styles["SectionSubHeader"]))
                    elements.append(
                        HRFlowable(
                            width="30%",
                            thickness=1,
                            color=colors.HexColor("#AAAAAA"),
                            hAlign="LEFT",
                        )
                    )
                elif level == 1:
                    elements.append(Spacer(1, 6))
                    elements.append(Paragraph(f"<b>{v}:</b>", styles["SubHeader"]))
                continue  # Skip the normal field processing for school names

            # Process the field value
            if isinstance(v, dict):
                elements.append(Paragraph(f"<b>{field_name}:</b>", styles["Body"]))
                _add_section(elements, v, styles, level + 2)
            elif isinstance(v, list):
                elements.append(Paragraph(f"<b>{field_name}:</b>", styles["Body"]))
                for item in v:
                    if isinstance(item, dict):
                        _add_section(elements, item, styles, level + 2)
                    else:
                        elements.append(Paragraph(f"- {item}", styles["Body"]))
            elif v is not None:  # Skip None values
                value = Paragraph(str(v), styles["Body"])
                table = Table(
                    [[Paragraph(f"<b>{field_name}:</b>", styles["Body"]), value]],
                    colWidths=[1.5 * inch, 4.5 * inch],
                )
                table.setStyle(
                    TableStyle(
                        [
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 0),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                        ]
                    )
                )
                elements.append(table)

    # Now process regular fields
    for k, v in regular_fields.items():
        key = k.replace("_", " ").title()

        if try_add_chart_block(elements, k, v, key, styles):
            continue
        if try_add_home_image_block(elements, k, v, styles):
            continue
        if try_add_community_images_block(elements, k, v, data, styles):
            continue
        if try_add_property_images_block(elements, k, v, data, styles):
            continue

        # NESTED DICTS
        if isinstance(v, dict):
            # Check if dict has any content (primitive or nested)
            has_nested = any(isinstance(subv, dict | list | str) for subv in v.values())

            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SectionSubHeader"]))
                elements.append(
                    HRFlowable(
                        width="30%", thickness=1, color=colors.HexColor("#AAAAAA"), hAlign="LEFT"
                    )
                )
            elif level == 1 and has_nested:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SubHeader"]))
            else:
                elements.append(Paragraph(f"<b>{key}:</b>", styles["Body"]))

            _add_section(elements, v, styles, level + 1)
            continue

        # LISTS
        if isinstance(v, list):
            has_nested = any(isinstance(item, dict | list | str) for item in v)

            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SectionSubHeader"]))
                elements.append(
                    HRFlowable(
                        width="30%", thickness=1, color=colors.HexColor("#AAAAAA"), hAlign="LEFT"
                    )
                )
            elif level == 1 and has_nested:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SubHeader"]))
            else:
                elements.append(Paragraph(f"<b>{key}:</b>", styles["Body"]))

            if v and isinstance(v[0], dict):
                for item in v:
                    elements.append(Spacer(0.5, 2))
                    _add_section(elements, item, styles, level + 1)
            else:
                for item in v:
                    elements.append(Paragraph(f"- {item}", styles["Body"]))

            continue

        # DEFAULT FIELDS
        value = Paragraph(str(v), styles["Body"])
        table = Table(
            [[Paragraph(f"<b>{key}:</b>", styles["Body"]), value]],
            colWidths=[1.6 * inch, 4.9 * inch],  # Adjust for your page size
        )
        table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )
        elements.append(table)
        elements.append(Spacer(0.5, 0.5))
