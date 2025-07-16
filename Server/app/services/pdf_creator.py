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
from PIL import Image as PILImage
from .s3_service import s3_service
from urllib.parse import quote_plus

SERP_API_KEY = os.getenv("SERP_API")
SERP_API_ENDPOINT = "https://serpapi.com/search.json"

logger = logging.getLogger(__name__)

def _create_pdf(report: dict, address: str) -> str:
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
            title=f"SilverKey Property Report for {address}"
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name="SectionHeader", fontSize=18, leading=20, textColor="#000000", fontName="Times-Bold", spaceAfter=2))
        styles.add(ParagraphStyle(name="SubHeader", fontSize=12, leading=13, textColor="#6A7B52", fontName="Times-Bold", spaceAfter=1))
        styles.add(ParagraphStyle(name="Body", fontSize=10, leading=11, fontName="Times-Roman", leftIndent=6, spaceAfter=0))
        styles.add(ParagraphStyle(name="Caption", fontSize=8, leading=9, textColor=colors.grey, alignment=TA_CENTER, fontName="Times-Roman"))
        styles.add(ParagraphStyle(name="HighlightBox", fontSize=10, backColor="#f6f6f6", borderPadding=4, borderColor="#6A7B52", borderWidth=1, borderRadius=4, leading=12, spaceAfter=2, fontName="Times-Roman"))

        elements = []
        elements.append(Paragraph("SilverKey Property Report", styles["SectionHeader"]))
        elements.append(HRFlowable(width="100%", thickness=1, color="#888888"))

        for section, section_data in report.items():
            elements.append(Paragraph(section.replace("_", " ").title(), styles["SectionHeader"]))
            elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign="LEFT"))

            if isinstance(section_data, dict):
                elements.append(Indenter(left=10))
                _add_section(elements, section_data, styles)
                elements.append(Indenter(left=-10))
            elif isinstance(section_data, list):
                for item in section_data:
                    elements.append(Indenter(left=10))
                    if isinstance(item, dict):
                        _add_section(elements, item, styles)
                    else:
                        elements.append(Paragraph(f"- {item}", styles["Body"]))
                    elements.append(Indenter(left=-10))
            else:
                elements.append(Paragraph(str(section_data), styles["Body"]))

            elements.append(Spacer(1, 1))
            elements.append(HRFlowable(width="100%", thickness=0.5, color="#AAAAAA"))
            elements.append(Spacer(1, 1))

        doc.build(elements)
        pdf_data = pdf_buffer.getvalue()
        pdf_buffer.close()

        safe_address = "".join(c for c in address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
        filename = f"reports/{safe_address}_{uuid.uuid4().hex[:8]}.pdf"
        s3_key = s3_service.upload_pdf(pdf_data, filename, 'application/pdf')

        if s3_key:
            try:
                import json
                json_data = json.dumps(report, indent=2).encode('utf-8')
                json_filename = f"{filename.removesuffix('.pdf')}.json"
                s3_service.upload_pdf(json_data, json_filename, 'application/json')
            except Exception as e:
                logger.error(f"Failed to save raw JSON to S3: {str(e)}")

        if s3_key:
            logger.info("S3 upload successful, generating presigned URL")
            presigned_url = s3_service.generate_presigned_url(s3_key)
            return presigned_url if presigned_url else s3_key
        else:
            logger.warning("S3 upload failed, falling back to local storage")
            return _save_pdf_locally(pdf_data, address)

    except Exception as e:
        logger.error(f"Error creating PDF for address {address}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def _save_pdf_locally(pdf_data: bytes, address: str) -> str:
    try:
        output_dir = os.path.join("static", "reports")
        os.makedirs(output_dir, exist_ok=True)
        safe_address = "".join(c for c in address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
        file_path = os.path.join(output_dir, f"{safe_address}.pdf")
        with open(file_path, 'wb') as f:
            f.write(pdf_data)
        return f"/api/v1/report/static/reports/{safe_address}.pdf"
    except Exception as e:
        logger.error(f"Failed to save PDF locally: {str(e)}")
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

def generate_pie_chart(data: dict, title: str) -> BytesIO:
    try:
        labels = list(data.keys())
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and val.endswith('%'):
                    sizes.append(float(val.strip('%')))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(f"Skipping non-numeric value in pie chart for '{title}': {val} - {e}")
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping pie chart for '{title}' due to empty or invalid data.")
            return None

        pie_colors = [
            '#A3B18A', '#E5E5E5', '#4A5A28', '#4A3228', '#DAD7CD',
            '#588157', '#BC6C25', '#6C584C', '#CCD5AE', '#B5838D',
        ]
        colors = [pie_colors[i % len(pie_colors)] for i in range(len(sizes))]
        fig, ax = plt.subplots()
        ax.pie(sizes, labels=labels, autopct="%1.1f%%", startangle=140, colors=colors)
        ax.axis("equal")
        plt.title(title)
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate pie chart for {title}: {e}")
        return None


def _add_section(elements, data, styles, level=0):
    indent = "  " * level
    logger.debug(f"[SECTION KEYS] Level {level}, keys: {[k for k in data.keys()]}")

    for k, v in data.items():
        key = k.replace("_", " ").title()

        # PIE CHARTS
        if k.lower() in ["age_distribution", "gender_distribution", "racial_distribution"]:
            chart_buffer = generate_pie_chart(v, key)
            label = Paragraph(f"<b>{key}:</b>", styles["SubHeader"])
            
            value_lines = []
            if isinstance(v, dict):
                for subk, subv in v.items():
                    subk_formatted = subk.replace("_", " ").title()
                    value_lines.append(f"<b>{subk_formatted}:</b> {subv}")
            value_paragraph = Paragraph("<br/>".join(value_lines), styles["Body"])

            if chart_buffer:
                img = _resize_image_to_fit(chart_buffer)
                table_data = [[img, value_paragraph]]
                table = Table(table_data, colWidths=[2.5 * inch, 3.5 * inch])
                table.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (0, -1), 6),
                    ("RIGHTPADDING", (0, 0), (0, -1), 18),
                    ("LEFTPADDING", (1, 0), (1, -1), 18),
                    ("RIGHTPADDING", (1, 0), (1, -1), 6),
                ]))
                elements.append(label)
                elements.append(Spacer(.5, .5))
                elements.append(table)
                elements.append(Paragraph(f"{key} Pie Chart", styles["Caption"]))
                elements.append(Spacer(.5, .5))
            else:
                elements.append(label)
                elements.append(value_paragraph)
                elements.append(Spacer(.5, .5))
            continue

        # IMAGE PROMPT (inline in dict)
        if k.lower() == "image_prompt" and isinstance(v, str):
            logger.debug(f"{indent}[IMAGE PROMPT] key '{k}', prompt: {v}")
            image_url = _fetch_image_from_serp(v)
            logger.debug(f"{indent}[IMAGE PROMPT] Got image URL: {image_url}")
            if image_url:
                try:
                    response = requests.get(image_url, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img = _resize_image_to_fit(img_data)
                        elements.append(Spacer(1, 2))
                        elements.append(img)
                        elements.append(Paragraph(key.replace(" Prompt", ""), styles["Caption"]))
                        elements.append(Spacer(.5, .5))
                except Exception as e:
                    logger.warning(f"Failed to fetch image from URL {image_url}: {e}")
            continue

        # NESTED DICTS
        if isinstance(v, dict):
            elements.append(Paragraph(f"<b>{key}:</b>", styles["SubHeader"]))
            _add_section(elements, v, styles, level + 1)
            continue

        # LISTS
        if isinstance(v, list):
            if v and isinstance(v[0], dict):
                for item in v:
                    elements.append(Spacer(.5, 2))
                    elements.append(Paragraph(f"<b>{key} Item:</b>", styles["SubHeader"]))
                    _add_section(elements, item, styles, level + 1)  # ⬅ RECURSE into each item
            else:
                for item in v:
                    elements.append(Paragraph(f"- {item}", styles["Body"]))
            continue

        # DEFAULT FIELDS
        style_key = k.lower()
        highlight_style = styles.get("HighlightBox", styles["Body"])
        if style_key in [
            "financial rating", "family rating", "nightlife score",
            "neighborhood rating", "environmental rating"
        ]:
            value = Paragraph(str(v), highlight_style)
        else:
            value = Paragraph(str(v), styles["Body"])
        table = Table([[Paragraph(f"<b>{key}:</b>", styles["Body"]), value]], colWidths=[2.5 * inch, 3.5 * inch])
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(table)
        elements.append(Spacer(.5, .5))
