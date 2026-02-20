import logging
import traceback
from io import BytesIO

import matplotlib
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Indenter,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

matplotlib.use("Agg")

from app.services.documents.s3_service import s3_service

from .pdf_section_rendering import FLATTENED_FIELD_PATTERNS

logger = logging.getLogger(__name__)


def _pdf(report: dict, address: str, filename: str, title: str) -> str:
    if not report:
        logger.error("No report data provided")
        raise ValueError("Report data is required")
    if not address:
        logger.error("No address provided")
        raise ValueError("Address is required")

    try:
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=30,
            topMargin=40,
            bottomMargin=40,
            title=f"{title}",
        )

        styles = getSampleStyleSheet()
        styles.add(
            ParagraphStyle(
                name="MainTitleComparison",
                fontSize=18,
                leading=30,
                fontName="Helvetica",
                textColor=colors.black,
                alignment=TA_CENTER,
                wordWrap="LTR",
                splitLongWords=False,
            )
        )
        styles.add(
            ParagraphStyle(
                name="MainTitle",
                fontSize=22,
                leading=30,
                fontName="Helvetica",
                textColor=colors.black,
                alignment=TA_CENTER,
                wordWrap="LTR",
                splitLongWords=False,
            )
        )
        styles.add(
            ParagraphStyle(
                name="SectionHeader",
                fontSize=18,
                leading=22,
                textColor=colors.black,
                fontName="Helvetica",
                spaceAfter=8,
            )
        )
        styles.add(
            ParagraphStyle(
                name="SectionSubHeader",
                fontSize=16,
                leading=20,
                textColor=colors.HexColor("#D8CAB8"),
                fontName="Helvetica-Bold",
                spaceAfter=8,
            )
        )
        styles.add(
            ParagraphStyle(
                name="SubHeader",
                fontSize=11,
                leading=14,
                textColor=colors.HexColor("#6A7B52"),
                fontName="Helvetica-Oblique",
                spaceAfter=6,
            )
        )
        styles.add(
            ParagraphStyle(name="Body", fontSize=10, leading=13, fontName="Helvetica", spaceAfter=4)
        )
        styles.add(
            ParagraphStyle(
                name="Caption",
                fontSize=8,
                leading=10,
                textColor=colors.grey,
                alignment=TA_CENTER,
                fontName="Helvetica-Oblique",
            )
        )
        styles.add(
            ParagraphStyle(
                name="HighlightBox",
                fontSize=10,
                backColor=colors.HexColor("#f6f6f6"),
                borderPadding=4,
                borderColor=colors.HexColor("#6A7B52"),
                borderWidth=1,
                borderRadius=4,
                leading=12,
                spaceAfter=6,
                fontName="Helvetica",
            )
        )

        elements = []
        elements.append(Paragraph(title, styles["MainTitle"]))
        elements.append(Spacer(1, 1))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D8CAB8")))
        elements.append(Spacer(1, 20))

        # Cache chart tables for side-by-side rendering

        for i, (section, section_data) in enumerate(report.items()):
            key = section.replace("_", " ").title()

            # Skip title for chart sections
            if i != 0:
                elements.append(Paragraph(key, styles["SectionHeader"]))
                elements.append(
                    HRFlowable(width="100%", thickness=1, color=colors.HexColor("#AAAAAA"))
                )
                elements.append(Spacer(1, 1))

            if isinstance(section_data, dict):
                elements.append(Indenter(left=1))
                _add_section(elements, section_data, styles)
                elements.append(Indenter(left=-1))
            elif isinstance(section_data, list):
                for item in section_data:
                    elements.append(Indenter(left=1))
                    if isinstance(item, dict):
                        _add_section(elements, item, styles)
                    else:
                        elements.append(Paragraph(f"- {item}", styles["Body"]))
                    elements.append(Indenter(left=-1))
            else:
                elements.append(Paragraph(str(section_data), styles["Body"]))

        doc.build(elements)
        pdf_data = pdf_buffer.getvalue()
        pdf_buffer.close()

        s3_key = s3_service.upload_pdf(pdf_data, filename, "application/pdf")

        if s3_key:
            try:
                import json

                json_data = json.dumps(report, indent=1).encode("utf-8")
                # Create JSON filename with simplified tree structure: userid/json/type/filename
                # Extract the path components from the PDF filename
                if "/" in filename:
                    # New tree structure: userid/reports/type/filename.pdf -> userid/json/type/filename.json
                    path_parts = filename.split("/")
                    if len(path_parts) >= 3 and path_parts[1] == "reports":
                        user_id = path_parts[0]
                        report_type = path_parts[2]
                        pdf_filename = path_parts[3]
                        json_filename = (
                            f"{user_id}/json/{report_type}/{pdf_filename.removesuffix('.pdf')}.json"
                        )
                    else:
                        # Fallback for unexpected structure
                        json_filename = f"{filename.removesuffix('.pdf')}.json"
                else:
                    # Old flat structure fallback
                    json_filename = f"{filename.removesuffix('.pdf')}.json"

                s3_service.upload_pdf(json_data, json_filename, "application/json")
            except Exception as e:
                logger.error(f"Failed to save raw JSON to S3: {str(e)}")

        if s3_key:
            presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=filename)
            return presigned_url if presigned_url else s3_key

        return ""

    except Exception as e:
        logger.error(f"Error creating PDF for address {address}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise


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
