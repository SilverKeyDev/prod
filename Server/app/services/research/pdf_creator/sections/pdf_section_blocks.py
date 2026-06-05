"""Chart and image block rendering for research PDF sections (delegated from pdf_section_rendering)."""

from io import BytesIO

import requests
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

from logger import log

from ..images.pdf_image_utils import (
    resize_image_for_home_hero,
    resize_image_for_side_by_side,
    resize_image_to_fit,
)
from ..images.pdf_serp_images import fetch_image_from_serp
from .chart_selection import chart_data_from_value


def try_add_chart_block(elements, k, v, key, styles):
    """If (k, v) is a chart field, append chart block to elements and return True."""
    chart_buffer, chart_type = chart_data_from_value(k, v)
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
        log.warn("API", "No image URL returned for home image prompt:", {"detail": str(v[:80])})
        return True

    try:
        response = requests.get(image_url, timeout=30)
        if response.status_code != 200:
            log.warn(
                "API",
                "Failed to fetch home image, status code:",
                {"detail": str(response.status_code)},
            )
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
    except Exception:
        log.warn("API", "Failed to fetch home image from URL :", {"detail": str(image_url)})
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
    except Exception:
        log.warn("API", "Failed to fetch image from URL :", {"detail": str(url)})
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
