from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    HRFlowable,
    Indenter
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import os
import requests
from io import BytesIO
import uuid
import logging
import traceback
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from .s3_service import s3_service
from urllib.parse import quote_plus
from .graphic_generation import generate_pie_chart, generate_horizontal_bar_chart, generate_donut_chart, generate_vertical_lollipop_chart
from PIL import Image as PILImage

SERP_API_KEY = os.getenv("SERP_API")
SERP_API_ENDPOINT = "https://serpapi.com/search.json"

logger = logging.getLogger(__name__)

def _create_pdf(report: dict, address: str, filename: str) -> str:
    if not report:
        logger.error("No report data provided")
        raise ValueError("Report data is required")
    if not address:
        logger.error("No address provided")
        raise ValueError("Address is required")
    logger.debug(f"report: {report}")

    try:
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=30,
            topMargin=40,
            bottomMargin=40,
            title=f"SilverKey: {address}"
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name="MainTitle", fontSize=24, leading=30, fontName="Helvetica", textColor=colors.black, alignment=TA_CENTER))
        styles.add(ParagraphStyle(name="SectionHeader", fontSize=18, leading=22, textColor=colors.black, fontName="Helvetica", spaceAfter=8))
        styles.add(ParagraphStyle(name="SectionSubHeader", fontSize=16, leading=20, textColor="#D8CAB8", fontName="Helvetica-Bold", spaceAfter=8))
        styles.add(ParagraphStyle(name="SubHeader", fontSize=11, leading=14, textColor="#6A7B52", fontName="Helvetica-Oblique", spaceAfter=6))
        styles.add(ParagraphStyle(name="Body", fontSize=10, leading=13, fontName="Helvetica", spaceAfter=4))
        styles.add(ParagraphStyle(name="Caption", fontSize=8, leading=10, textColor=colors.grey, alignment=TA_CENTER, fontName="Helvetica-Oblique"))
        styles.add(ParagraphStyle(name="HighlightBox", fontSize=10, backColor="#f6f6f6", borderPadding=4, borderColor="#6A7B52", borderWidth=1, borderRadius=4, leading=12, spaceAfter=6, fontName="Helvetica"))

        elements = []

        # Add main title with address
        elements.append(Paragraph(address, styles["MainTitle"]))
        elements.append(Spacer(1, 1))
        elements.append(HRFlowable(width="100%", thickness=1.2, color="#D8CAB8"))
        elements.append(Spacer(1, 20))

        for i, (section, section_data) in enumerate(report.items()):
            if i!= 0:
                title_style = styles["SectionHeader"]
                elements.append(Paragraph(section.replace("_", " ").title(), title_style))
                elements.append(HRFlowable(width="100%", thickness=0.5, color="#AAAAAA"))
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

        s3_key = s3_service.upload_pdf(pdf_data, filename, 'application/pdf')

        if s3_key:
            try:
                import json
                json_data = json.dumps(report, indent=1).encode('utf-8')
                json_filename = f"{filename.removesuffix('.pdf')}.json"
                s3_service.upload_pdf(json_data, json_filename, 'application/json')
            except Exception as e:
                logger.error(f"Failed to save raw JSON to S3: {str(e)}")

        if s3_key:
            logger.info("S3 upload successful, generating presigned URL")
            presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=filename)
            return presigned_url if presigned_url else s3_key

    except Exception as e:
        logger.error(f"Error creating PDF for address {address}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def _fetch_image_from_serp(prompt: str) -> str:
    if not SERP_API_KEY:
        logger.warning("SERP_API_KEY not set; cannot fetch images.")
        return ""

    try:
        params = {
            "engine": "google",
            "q": prompt,
            "tbm": "isch",
            "num": "5",  # get up to 5 options to improve chances
            "api_key": SERP_API_KEY,
        }
        query_str = "&".join(f"{k}={quote_plus(str(v))}" for k, v in params.items())
        response = requests.get(f"{SERP_API_ENDPOINT}?{query_str}", timeout=30)

        if response.status_code == 200:
            data = response.json()
            images_results = data.get("images_results", [])
            for result in images_results:
                candidate = result.get("original") or result.get("thumbnail") or ""
                if not candidate:
                    continue
                if any(domain in candidate for domain in [
                    "facebook.com",
                    "lookaside.fbsbx.com",
                    "shutterstock.com/thumb",
                    "dreamstime.com",
                    "alamy.com/comp",
                    "123rf.com",
                    "depositphotos.com"
                ]):
                    logger.debug(f"[SERP FILTER] Skipping bad image domain: {candidate}")
                    continue
                logger.debug(f"[SERP] Using image URL: {candidate}")
                return candidate

        logger.warning(f"SERP API returned no usable image for prompt: '{prompt}'")
    except Exception as e:
        logger.warning(f"SERP API error for prompt '{prompt}': {e}")

    return ""


def _resize_image_to_fit(img_data: BytesIO, max_width: float = 3 * inch, max_height: float = 2.25 * inch) -> Image:
    pil_img = PILImage.open(img_data)
    width, height = pil_img.size
    aspect_ratio = width / height
    if aspect_ratio >= 1:
        display_width = min(max_width, width)
        display_height = display_width / aspect_ratio
    else:
        display_height = min(max_height, height)
        display_width = display_height * aspect_ratio
    img_data.seek(0)
    return Image(img_data, width=display_width, height=display_height)


def _add_section(elements, data, styles, level=0):
    indent = "  " * level
    logger.debug(f"[SECTION KEYS] Level {level}, keys: {[k for k in data.keys()]}")

    for k, v in data.items():
        key = k.replace("_", " ").title()

        # CHARTS - Only generate if data is a dictionary
        chart_buffer = None
        chart_type = ""
        
        if isinstance(v, dict):
            if k.lower() == "lifestyle_dna":
                chart_buffer = generate_horizontal_bar_chart(v, key)
                chart_type = "Lifestyle DNA Bar Chart"
            elif k.lower() in ["gender_distribution"]:
                chart_buffer = generate_donut_chart(v, key)
                chart_type = "Gender Distribution Donut Chart"
            elif k.lower() in ["racial_distribution"]:
                chart_buffer = generate_pie_chart(v, key)
                chart_type = "Racial Distribution Pie Chart"
            elif k.lower() == "age_distribution":
                chart_buffer = generate_vertical_lollipop_chart(v, key)
                chart_type = "Age Distribution Bar Chart"
            else:
                chart_buffer = generate_horizontal_bar_chart(v, key)
                chart_type = "Lifestyle Chart"

        if chart_buffer:
            label = Paragraph(f"<b>{key}:</b>", styles["SubHeader"])
            
            value_lines = []
            if isinstance(v, dict):
                for subk, subv in v.items():
                    subk_formatted = subk.replace("_", " ").title()
                    value_lines.append(f"<b>{subk_formatted}:</b> {subv}")
            else:
                # Fallback for string data
                value_lines.append(str(v))
            value_paragraph = Paragraph("<br/>".join(value_lines), styles["Body"])

            img = _resize_image_to_fit(chart_buffer)
            table_data = [[img, value_paragraph]]
            table = Table(table_data, colWidths=[3 * inch, 3.5 * inch])
            table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 60),
                ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                ("TOPPADDING", (0, 0), (-1, -1), 15),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
            ]))
            elements.append(label)
            elements.append(Spacer(1, 0.1 * inch))   # More vertical spacing above chart
            elements.append(table)
            elements.append(Spacer(1, 0.1 * inch))   # Spacing before caption
            elements.append(Paragraph(f"{key} {chart_type}", styles["Caption"]))
            elements.append(Spacer(1, 0.2 * inch))   # More spacing before next section
            continue

        # IMAGE PROMPT (inline in dict)
        if k.lower() == "image_prompt" and isinstance(v, str):
            elements.append(Spacer(1, 15))
            logger.debug(f"{indent}[IMAGE PROMPT] key '{k}', prompt: {v}")
            image_url = _fetch_image_from_serp(v)
            logger.debug(f"{indent}[IMAGE PROMPT] Got image URL: {image_url}")
            if image_url:
                try:
                    response = requests.get(image_url, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img = _resize_image_to_fit(img_data)
                        elements.append(Spacer(1, 6))
                        elements.append(img)
                        elements.append(Paragraph(key.replace(" Prompt", ""), styles["Caption"]))
                        elements.append(Spacer(1, 3))
                except Exception as e:
                    logger.warning(f"Failed to fetch image from URL {image_url}: {e}")
            continue

        # NESTED DICTS
        if isinstance(v, dict):
            # Check if dict has any content (primitive or nested)
            has_nested = any(isinstance(subv, (dict, list, str)) for subv in v.values())

            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SectionSubHeader"]))
                elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign='LEFT'))
            elif level == 1 and has_nested:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SubHeader"]))
            else:
                elements.append(Paragraph(f"<b>{key}:</b>", styles["Body"]))

            _add_section(elements, v, styles, level + 1)
            continue


        # LISTS
        if isinstance(v, list):
            has_nested = any(isinstance(item, (dict, list, str)) for item in v)

            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SectionSubHeader"]))
                elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign='LEFT'))
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
            colWidths=[1.6 * inch, 4.9 * inch]  # Adjust for your page size
        )
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(table)
        elements.append(Spacer(.5, .5))
