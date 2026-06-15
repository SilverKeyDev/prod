"""
Recursive section rendering for PDF reports (charts, images, nested dicts/lists).
"""

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, Spacer, Table, TableStyle

from .section_property_data import FLATTENED_FIELD_PATTERNS
from .section_renderer_helpers import (
    try_render_chart,
    try_render_community_images,
    try_render_home_image,
    try_render_image_prompt_pair,
)


def add_section(elements, data, styles, level=0):
    """Recursively render a report section (flattened groups, charts, images, dicts, lists)."""
    flattened_groups = {}
    regular_fields = {}
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

    for pattern, group in flattened_groups.items():
        is_school_field = pattern in ["preschool_", "elementary_", "middle_", "high_"]
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
        for k, v in group["fields"].items():
            field_name = k.replace(pattern, "").replace("_", " ").title()
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
                continue
            if isinstance(v, dict):
                elements.append(Paragraph(f"<b>{field_name}:</b>", styles["Body"]))
                add_section(elements, v, styles, level + 2)
            elif isinstance(v, list):
                elements.append(Paragraph(f"<b>{field_name}:</b>", styles["Body"]))
                for item in v:
                    if isinstance(item, dict):
                        add_section(elements, item, styles, level + 2)
                    else:
                        elements.append(Paragraph(f"- {item}", styles["Body"]))
            elif v is not None:
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

    for k, v in regular_fields.items():
        key = k.replace("_", " ").title()

        if try_render_chart(key, v, elements, styles):
            continue
        if try_render_home_image(k, v, elements, styles):
            continue
        if try_render_community_images(k, v, data, elements, styles):
            continue
        if try_render_image_prompt_pair(k, v, data, elements, styles):
            continue

        if isinstance(v, dict):
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
            add_section(elements, v, styles, level + 1)
            continue

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
                    add_section(elements, item, styles, level + 1)
            else:
                for item in v:
                    elements.append(Paragraph(f"- {item}", styles["Body"]))
            continue

        value = Paragraph(str(v), styles["Body"])
        table = Table(
            [[Paragraph(f"<b>{key}:</b>", styles["Body"]), value]],
            colWidths=[1.6 * inch, 4.9 * inch],
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
