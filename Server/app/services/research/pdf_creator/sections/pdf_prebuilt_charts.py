"""Pre-render demographic chart tables for research PDF reports."""

from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle

from app.services.graphics import (
    generate_horizontal_bar_chart,
    generate_vertical_lollipop_chart,
)
from logger import log

from ..images.image_utils import resize_image_to_fit


def _chart_table_style() -> list:
    return [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]


def _percent_chart_data(raw: dict) -> dict:
    return {
        k: (v.strip() if isinstance(v, str) and v.strip().endswith("%") else f"{v}%")
        for k, v in raw.items()
    }


def build_prebuilt_chart_tables(report: dict) -> dict:
    """Build lifestyle_dna and age_distribution chart tables keyed by section name."""
    prebuilt_chart_tables = {}
    try:
        lifestyle_data = report.get("lifestyle_dna")
        if isinstance(lifestyle_data, dict):
            lifestyle_buffer = generate_horizontal_bar_chart(
                _percent_chart_data(lifestyle_data), "Lifestyle Dna"
            )
            if lifestyle_buffer:
                lifestyle_img = resize_image_to_fit(
                    lifestyle_buffer,
                    target_width=3.6 * inch,
                    target_height=2.8 * inch,
                    is_chart=True,
                )
                lifestyle_table = Table([[lifestyle_img]], colWidths=[3.6 * inch])
                lifestyle_table.setStyle(TableStyle(_chart_table_style()))
                prebuilt_chart_tables["lifestyle_dna"] = lifestyle_table

        age_data = report.get("age_distribution")
        if isinstance(age_data, dict):
            age_buffer = generate_vertical_lollipop_chart(
                _percent_chart_data(age_data), "Age Distribution"
            )
            if age_buffer:
                age_img = resize_image_to_fit(
                    age_buffer, target_width=3.6 * inch, target_height=2.8 * inch, is_chart=True
                )
                age_table = Table([[age_img]], colWidths=[3.6 * inch])
                age_table.setStyle(TableStyle(_chart_table_style()))
                prebuilt_chart_tables["age_distribution"] = age_table
    except Exception as e:
        log.warn("PROPERTY_DETAILS", "Failed to prebuild charts:", {"detail": str(e)})
    return prebuilt_chart_tables
