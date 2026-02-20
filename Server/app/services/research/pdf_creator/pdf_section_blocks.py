"""Chart and image block rendering for research PDF sections (delegated from pdf_section_rendering)."""

import logging
from io import BytesIO

import requests
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

from ..graphs.graphic_generation import (
    generate_horizontal_bar_chart,
    generate_vertical_lollipop_chart,
)
from .pdf_image_utils import (
    resize_image_for_home_hero,
    resize_image_for_side_by_side,
    resize_image_to_fit,
)
from .pdf_serp_images import fetch_image_from_serp

logger = logging.getLogger(__name__)

CHARTABLE_FIELDS = {
    "demographics",
    "income_distribution",
    "education_levels",
    "employment_stats",
    "safety_metrics",
    "transportation_usage",
}


def _is_chartable_value(val):
    """Return True if value is suitable for charting (numeric, percentage, rating, categorical)."""
    if val is None:
        return False
    if isinstance(val, int | float):
        return True
    if not isinstance(val, str):
        return False
    val_stripped = val.strip()
    if not val_stripped:
        return False
    if val_stripped.endswith("%") and val_stripped[:-1].replace(".", "").isdigit():
        return True
    if "/" in val_stripped and val_stripped.split("/")[0].replace(".", "").isdigit():
        return True
    if val_stripped.lower() in (
        "high",
        "medium",
        "low",
        "very high",
        "very low",
        "moderate",
        "popular",
        "very popular",
        "unpopular",
    ):
        return True
    if any(c in val_stripped for c in ["$", "-", "/", " to ", " and ", "month", "year", "per"]):
        return False
    return False


def _chart_data_from_value(k, v):
    """Build (chart_buffer, chart_type) for known chart fields; (None, '') otherwise."""
    chart_buffer = None
    chart_type = ""

    if hasattr(v, "with_percent") and callable(getattr(v, "with_percent", None)):
        chart_data = v.with_percent()
        if k.lower() == "lifestyle_dna":
            chart_buffer = generate_horizontal_bar_chart(chart_data, k.replace("_", " ").title())
            chart_type = "Lifestyle DNA Bar Chart"
        elif k.lower() == "age_distribution":
            chart_buffer = generate_vertical_lollipop_chart(chart_data, k.replace("_", " ").title())
            chart_type = "Age Distribution Chart"
        return (chart_buffer, chart_type)

    if not isinstance(v, dict):
        return (None, "")

    if k.lower() == "lifestyle_dna":
        chart_data = {fn: f"{val}%" for fn, val in v.items()}
        chart_buffer = generate_horizontal_bar_chart(chart_data, k.replace("_", " ").title())
        chart_type = "Lifestyle DNA Bar Chart"
        return (chart_buffer, chart_type)

    if k.lower() == "age_distribution":
        chart_data = {}
        for field_name, value in v.items():
            if field_name.startswith("age_"):
                display_name = (
                    field_name.replace("age_", "").replace("_plus", "+").replace("_", "-")
                )
                chart_data[display_name] = f"{value}%"
            else:
                chart_data[field_name] = f"{value}%"
        chart_buffer = generate_vertical_lollipop_chart(chart_data, k.replace("_", " ").title())
        chart_type = "Age Distribution Chart"
        return (chart_buffer, chart_type)

    if k.lower() in CHARTABLE_FIELDS:
        total = len(v)
        chartable_count = sum(1 for val in v.values() if _is_chartable_value(val))
        if total > 0 and chartable_count >= (total * 0.5):
            chart_buffer = generate_horizontal_bar_chart(v, k.replace("_", " ").title())
            chart_type = "Data Chart"
            return (chart_buffer, chart_type)

    return (None, "")


def try_add_chart_block(elements, k, v, key, styles):
    """If (k, v) is a chart field, append chart block to elements and return True."""
    chart_buffer, chart_type = _chart_data_from_value(k, v)
    if not chart_buffer:
        return False

    label = Paragraph(f"<b>{key}:</b>", styles["SubHeader"])
    img = resize_image_to_fit(
        chart_buffer, target_width=6 * inch, target_height=2.8 * inch, is_chart=True
    )
    table = Table([[img]], colWidths=[6 * inch])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 30),
                ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                ("TOPPADDING", (0, 0), (-1, -1), 15),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
            ]
        )
    )
    elements.append(label)
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(table)
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph(f"{key} {chart_type}", styles["Caption"]))
    elements.append(Spacer(1, 0.2 * inch))
    return True


def try_add_home_image_block(elements, k, v, styles):
    """If (k, v) is home_image_prompt, fetch image, append block, and return True."""
    if k.lower() != "home_image_prompt" or not isinstance(v, str):
        return False

    elements.append(Spacer(1, 20))
    image_url = fetch_image_from_serp(v)
    if not image_url:
        logger.warning("No image URL returned for home image prompt: %s", v[:80])
        return True

    try:
        response = requests.get(image_url, timeout=30)
        if response.status_code != 200:
            logger.warning("Failed to fetch home image, status code: %s", response.status_code)
            return True
        img_data = BytesIO(response.content)
        home_img = resize_image_for_home_hero(img_data)
        elements.append(Spacer(1, 10))
        table = Table([[home_img]], colWidths=[6.5 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                    ("INNERPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        elements.append(table)
        elements.append(Spacer(1, 15))
    except Exception as e:
        logger.warning("Failed to fetch home image from URL %s: %s", image_url, e)
    return True


def _fetch_and_resize_side_by_side(url):
    """Fetch image from url and return resize_image_for_side_by_side result or None."""
    if not url:
        return None
    try:
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            return None
        return resize_image_for_side_by_side(BytesIO(response.content), is_chart=False)
    except Exception as e:
        logger.warning("Failed to fetch image from URL %s: %s", url, e)
        return None


def try_add_community_images_block(elements, k, v, data, styles):
    """If (k, v) is community_image_1 (or we're on community_image_2), handle dual community images."""
    if k.lower() == "community_image_2" and isinstance(v, str):
        return True  # Skip; handled with community_image_1
    if k.lower() != "community_image_1" or not isinstance(v, str):
        return False

    elements.append(Spacer(1, 15))
    second_prompt = data.get("community_image_2") if isinstance(data, dict) else None
    image_url_1 = fetch_image_from_serp(v)
    image_url_2 = fetch_image_from_serp(second_prompt or "")

    images = []
    img1 = _fetch_and_resize_side_by_side(image_url_1)
    if img1:
        images.append(img1)
    img2 = _fetch_and_resize_side_by_side(image_url_2)
    if img2:
        images.append(img2)

    if not images:
        return True

    elements.append(Spacer(1, 6))
    if len(images) == 2:
        table = Table([[images[0], images[1]]], colWidths=[3 * inch, 3 * inch])
    else:
        table = Table([[images[0]]], colWidths=[6 * inch])

    pad = 30 if len(images) == 1 else 10
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), pad),
                ("RIGHTPADDING", (0, 0), (-1, -1), pad),
                ("TOPPADDING", (0, 0), (-1, -1), 15 if len(images) == 1 else 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 15 if len(images) == 1 else 10),
                ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("INNERPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 10))
    return True


def try_add_property_images_block(elements, k, v, data, styles):
    """If (k, v) is image_prompt (or we're on image_prompt_2), handle dual property images."""
    if k.lower() == "image_prompt_2" and isinstance(v, str):
        return True
    if k.lower() != "image_prompt" or not isinstance(v, str):
        return False

    elements.append(Spacer(1, 15))
    second_prompt = data.get("image_prompt_2") if isinstance(data, dict) else None
    image_url_1 = fetch_image_from_serp(v)
    image_url_2 = fetch_image_from_serp(second_prompt or "")

    images = []
    img1 = _fetch_and_resize_side_by_side(image_url_1)
    if img1:
        images.append(img1)
    img2 = _fetch_and_resize_side_by_side(image_url_2)
    if img2:
        images.append(img2)

    if not images:
        return True

    elements.append(Spacer(1, 6))
    if len(images) == 2:
        table = Table([[images[0], images[1]]], colWidths=[3 * inch, 3 * inch])
    else:
        table = Table([[images[0]]], colWidths=[6 * inch])

    pad = 30 if len(images) == 1 else 10
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), pad),
                ("RIGHTPADDING", (0, 0), (-1, -1), pad),
                ("TOPPADDING", (0, 0), (-1, -1), 15 if len(images) == 1 else 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 15 if len(images) == 1 else 10),
                ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("INNERPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(table)
    caption_key = k.replace("_", " ").title().replace(" Prompt", "")
    elements.append(Paragraph(caption_key, styles["Caption"]))
    elements.append(Spacer(1, 3))
    return True
