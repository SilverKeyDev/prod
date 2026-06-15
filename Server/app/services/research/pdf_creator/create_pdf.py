"""Orchestration for research property PDF creation and S3 upload."""

import json
import traceback
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import HRFlowable, Indenter, Paragraph, SimpleDocTemplate, Spacer

from app.services.documents.s3_service import s3_service
from logger import log

from .pdf_report_styles import build_report_pdf_styles
from .sections.pdf_commute_section import append_commute_map_section
from .sections.pdf_demographics_charts import insert_demographics_charts_after_neighborhood
from .sections.pdf_prebuilt_charts import build_prebuilt_chart_tables
from .sections.section_property_data import add_property_data_section
from .sections.section_renderer import add_section


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

        styles = build_report_pdf_styles()

        elements = []
        elements.append(Paragraph(address, styles["MainTitle"]))
        elements.append(Spacer(1, 1))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D8CAB8")))
        elements.append(Spacer(1, 20))

        prebuilt_chart_tables = build_prebuilt_chart_tables(report)
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
                    append_commute_map_section(
                        elements,
                        address=address,
                        section_data=section_data,
                        styles=styles,
                        user_preferences=user_preferences,
                    )

                elements.append(Indenter(left=1))
                add_section(elements, section_data, styles)
                elements.append(Indenter(left=-1))

                if (
                    not charts_inserted_after_neighborhood
                    and section.lower() == "neighborhood_overview"
                ):
                    charts_inserted_after_neighborhood = (
                        insert_demographics_charts_after_neighborhood(
                            elements,
                            prebuilt_chart_tables=prebuilt_chart_tables,
                            styles=styles,
                        )
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
