"""
Helpers for section_renderer: chart and image block rendering.
"""

from io import BytesIO

import requests
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

from logger import log

from ..images.image_utils import (
    resize_image_for_home_hero,
    resize_image_for_side_by_side,
    resize_image_to_fit,
)
from ..images.serp_images import fetch_image_from_serp
from .chart_selection import chart_data_from_value


def try_render_chart(key, v, elements, styles):
    """
    If v is chartable, build chart, append to elements, and return True.
    Otherwise return False.
    """
    chart_buffer, chart_type = chart_data_from_value(key, v)

    if not chart_buffer:
        return False

    label = Paragraph(f"<b>{key}:</b>", styles["SubHeader"])
    img = resize_image_to_fit(chart_buffer, is_chart=True)
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


def try_render_home_image(key, v, elements, styles):
    """Render home_image_prompt (hero image). Return True if handled."""
    if key.lower() != "home_image_prompt" or not isinstance(v, str):
        return False
    elements.append(Spacer(1, 20))
    image_url = fetch_image_from_serp(v)
    if image_url:
        try:
            response = requests.get(image_url, timeout=30)
            if response.status_code == 200:
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
            else:
                log.warn(
                    "API",
                    "Failed to fetch home image, status code:",
                    {"detail": str(response.status_code)},
                )
        except Exception:
            log.warn("API", "Failed to fetch home image from URL :", {"detail": str(image_url)})
    else:
        log.warn("API", "No image URL returned for home image prompt:", {"detail": str(v)})
    return True


def _fetch_images_side_by_side(prompt_1, prompt_2=None):
    """Fetch one or two images from SERP; return list of flowables."""
    image_url_1 = fetch_image_from_serp(prompt_1)
    image_url_2 = fetch_image_from_serp(prompt_2) if prompt_2 else ""
    images = []
    for url in (image_url_1, image_url_2):
        if url:
            try:
                response = requests.get(url, timeout=30)
                if response.status_code == 200:
                    img_data = BytesIO(response.content)
                    images.append(resize_image_for_side_by_side(img_data, is_chart=False))
            except Exception:
                log.warn("API", "Failed to fetch image from URL :", {"detail": str(url)})
    return images


def try_render_community_images(key, v, data, elements, styles):
    """Render community_image_1 (and optional community_image_2). Return True if handled."""
    if key.lower() == "community_image_2" and isinstance(v, str):
        return True  # Rendered with community_image_1
    if key.lower() != "community_image_1" or not isinstance(v, str):
        return False
    elements.append(Spacer(1, 15))
    second_prompt = data.get("community_image_2") if isinstance(data, dict) else None
    images = _fetch_images_side_by_side(v, second_prompt)
    if images:
        elements.append(Spacer(1, 6))
        if len(images) == 2:
            table = Table([[images[0], images[1]]], colWidths=[3 * inch, 3 * inch])
        else:
            table = Table([[images[0]]], colWidths=[6 * inch])
        style_list = [
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ("INNERPADDING", (0, 0), (-1, -1), 6),
        ]
        if len(images) == 2:
            style_list.extend(
                [
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        else:
            style_list.extend(
                [
                    ("LEFTPADDING", (0, 0), (-1, -1), 30),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                    ("TOPPADDING", (0, 0), (-1, -1), 15),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
                ]
            )
        table.setStyle(TableStyle(style_list))
        elements.append(table)
        elements.append(Spacer(1, 10))
    return True


def try_render_image_prompt_pair(key, v, data, elements, styles):
    """Render image_prompt (and optional image_prompt_2). Return True if handled."""
    if key.lower() == "image_prompt_2" and isinstance(v, str):
        return True
    if key.lower() != "image_prompt" or not isinstance(v, str):
        return False
    elements.append(Spacer(1, 15))
    second_prompt = data.get("image_prompt_2") if isinstance(data, dict) else None
    images = _fetch_images_side_by_side(v, second_prompt)
    if images:
        elements.append(Spacer(1, 6))
        if len(images) == 2:
            table = Table([[images[0], images[1]]], colWidths=[3 * inch, 3 * inch])
        else:
            table = Table([[images[0]]], colWidths=[6 * inch])
        style_list = [
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ("INNERPADDING", (0, 0), (-1, -1), 6),
        ]
        if len(images) == 2:
            style_list.extend(
                [
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        else:
            style_list.extend(
                [
                    ("LEFTPADDING", (0, 0), (-1, -1), 30),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                    ("TOPPADDING", (0, 0), (-1, -1), 15),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
                ]
            )
        table.setStyle(TableStyle(style_list))
        elements.append(table)
        elements.append(Paragraph(key.replace(" Prompt", ""), styles["Caption"]))
        elements.append(Spacer(1, 3))
    return True
