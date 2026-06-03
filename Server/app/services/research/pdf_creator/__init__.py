"""
PDF report creation: orchestration and public API.
"""

import json
import os
import traceback
from io import BytesIO

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

from app.services.documents.s3_service import s3_service
from logger import log

from ..graphs.graphic_generation import (
    generate_commute_map,
    generate_horizontal_bar_chart,
    generate_vertical_lollipop_chart,
)
from .image_utils import resize_image_to_fit
from .section_property_data import add_property_data_section
from .section_renderer import add_section


def _create_pdf(
    report: dict, address: str, filename: str, user_preferences: dict | None = None
) -> str:
    if not report:
        log.error("ERRORS", "No report data provided")
        raise ValueError("Report data is required")
    if not address:
        log.error("ERRORS", "No address provided")
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
            title=f"SilverKey: {address}",
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
        elements.append(Paragraph(address, styles["MainTitle"]))
        elements.append(Spacer(1, 1))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D8CAB8")))
        elements.append(Spacer(1, 20))

        prebuilt_chart_tables = {}
        try:
            lifestyle_data = report.get("lifestyle_dna")
            if isinstance(lifestyle_data, dict):
                lifestyle_chart_data = {
                    k: (v.strip() if isinstance(v, str) and v.strip().endswith("%") else f"{v}%")
                    for k, v in lifestyle_data.items()
                }
                lifestyle_buffer = generate_horizontal_bar_chart(
                    lifestyle_chart_data, "Lifestyle Dna"
                )
                if lifestyle_buffer:
                    lifestyle_img = resize_image_to_fit(
                        lifestyle_buffer,
                        target_width=3.6 * inch,
                        target_height=2.8 * inch,
                        is_chart=True,
                    )
                    lifestyle_table = Table([[lifestyle_img]], colWidths=[3.6 * inch])
                    lifestyle_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                                ("TOPPADDING", (0, 0), (-1, -1), 1),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                            ]
                        )
                    )
                    prebuilt_chart_tables["lifestyle_dna"] = lifestyle_table

            age_data = report.get("age_distribution")
            if isinstance(age_data, dict):
                age_chart_data = {
                    fn: (
                        val.strip()
                        if isinstance(val, str) and val.strip().endswith("%")
                        else f"{val}%"
                    )
                    for fn, val in age_data.items()
                }
                age_buffer = generate_vertical_lollipop_chart(age_chart_data, "Age Distribution")
                if age_buffer:
                    age_img = resize_image_to_fit(
                        age_buffer, target_width=3.6 * inch, target_height=2.8 * inch, is_chart=True
                    )
                    age_table = Table([[age_img]], colWidths=[3.6 * inch])
                    age_table.setStyle(
                        TableStyle(
                            [
                                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                                ("TOPPADDING", (0, 0), (-1, -1), 1),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                            ]
                        )
                    )
                    prebuilt_chart_tables["age_distribution"] = age_table
        except Exception as e:
            log.warn("PROPERTY_DETAILS", "Failed to prebuild charts:", {"detail": str(e)})

        charts_inserted_after_neighborhood = False

        for i, (section, section_data) in enumerate(report.items()):
            key = section.replace("_", " ").title()
            if section.lower() == "property_data":
                elements.append(Spacer(1, 10))
            elif i != 0 and section.lower() not in ["age_distribution", "lifestyle_dna"]:
                elements.append(Paragraph(key, styles["SectionHeader"]))
                elements.append(
                    HRFlowable(width="100%", thickness=1, color=colors.HexColor("#AAAAAA"))
                )
                elements.append(Spacer(1, 1))

            if section.lower() in ["age_distribution", "lifestyle_dna"] and isinstance(
                section_data, dict
            ):
                continue

            if isinstance(section_data, dict):
                if section.lower() == "property_data":
                    add_property_data_section(elements, section_data, styles)
                    continue

                if section.lower() == "commute":
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
                                    elements.append(
                                        Paragraph("Travel Times by Car", styles["SectionSubHeader"])
                                    )
                                    elements.append(Spacer(1, 1))
                                    elements.append(
                                        HRFlowable(
                                            width="100%",
                                            thickness=1,
                                            color=colors.HexColor("#D8CAB8"),
                                        )
                                    )
                                    elements.append(Spacer(1, 4))
                                    elements.append(Indenter(left=20))
                                    for location in travel_times:
                                        travel_text = (
                                            f"&bull; {location['name']} – {location['travel_time']}"
                                        )
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
                        log.error(
                            "ERRORS", "Error generating commute map:", {"detail": str(map_error)}
                        )

                elements.append(Indenter(left=1))
                add_section(elements, section_data, styles)
                elements.append(Indenter(left=-1))

                if (
                    not charts_inserted_after_neighborhood
                    and section.lower() == "neighborhood_overview"
                ):
                    try:
                        lifestyle_table = prebuilt_chart_tables.get("lifestyle_dna")
                        age_table = prebuilt_chart_tables.get("age_distribution")
                        if lifestyle_table or age_table:
                            elements.append(Spacer(1, 6))
                            if lifestyle_table and age_table:
                                side_by_side = Table(
                                    [[age_table, lifestyle_table]],
                                    colWidths=[3.6 * inch, 3.6 * inch],
                                    hAlign="CENTER",
                                )
                                side_by_side.setStyle(
                                    TableStyle(
                                        [
                                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                            ("LEFTPADDING", (0, 0), (-1, -1), 10),
                                            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                                            ("TOPPADDING", (0, 0), (-1, -1), 6),
                                            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                                        ]
                                    )
                                )
                                elements.append(side_by_side)
                                elements.append(
                                    Paragraph("Demographics Overview", styles["Caption"])
                                )
                                elements.append(Spacer(1, 20))
                            else:
                                elements.append(lifestyle_table or age_table)
                                elements.append(Spacer(1, 10))
                            charts_inserted_after_neighborhood = True
                    except Exception as e:
                        log.warn(
                            "PROPERTY_DETAILS",
                            "Failed to render side-by-side charts:",
                            {"detail": str(e)},
                        )
            elif isinstance(section_data, list):
                for item in section_data:
                    elements.append(Indenter(left=1))
                    if isinstance(item, dict):
                        add_section(elements, item, styles)
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
                json_data = json.dumps(report, indent=1).encode("utf-8")
                if "/" in filename:
                    path_parts = filename.split("/")
                    if len(path_parts) >= 3 and path_parts[1] == "reports":
                        pdf_filename = path_parts[3]
                        json_filename = f"{path_parts[0]}/json/{path_parts[2]}/{pdf_filename.removesuffix('.pdf')}.json"
                    else:
                        json_filename = f"{filename.removesuffix('.pdf')}.json"
                else:
                    json_filename = f"{filename.removesuffix('.pdf')}.json"
                s3_service.upload_pdf(json_data, json_filename, "application/json")
            except Exception as e:
                log.error("ERRORS", "Failed to save raw JSON to S3", {"error": str(e)})

        if s3_key:
            presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=filename)
            return presigned_url if presigned_url else s3_key

        return ""

    except Exception as e:
        log.error(
            "ERRORS",
            "Error creating PDF",
            {
                "address": address,
                "error": str(e),
                "exception_type": type(e).__name__,
                "traceback": traceback.format_exc(),
            },
        )
        raise
