from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import os
import requests
from io import BytesIO


def _create_pdf(report: dict, address: str) -> str:
    output_dir = os.path.join("static", "reports")
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"{address}.pdf")

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=60,
        bottomMargin=60,
    )

    # serif styles throughout
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontSize=18,
        leading=22,
        textColor="#4B2E2C",
        fontName="Times-Bold",
        spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        name="SubHeader",
        fontSize=12,
        leading=14,
        textColor="#6A7B52",
        fontName="Times-Bold",
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name="Body",
        fontSize=10,
        leading=14,
        fontName="Times-Roman",
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name="Caption",
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER,
        fontName="Times-Roman"
    ))
    styles.add(ParagraphStyle(
        name="HighlightBox",
        fontSize=10,
        backColor="#f6f6f6",
        borderPadding=6,
        borderColor="#6A7B52",
        borderWidth=1,
        borderRadius=4,
        leading=14,
        spaceAfter=8,
        fontName="Times-Roman"
    ))

    elements = []

    # HEADER
    elements.append(Paragraph("SilverKey Property Report", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1, color="#6A7B52"))
    elements.append(Spacer(1, 12))

    # loop over sections
    for section, section_data in report.items():
        elements.append(Paragraph(section.replace("_", " ").title(), styles["SectionHeader"]))
        elements.append(HRFlowable(width="30%", thickness=1, color="#6A7B52"))
        elements.append(Spacer(1, 6))

        if isinstance(section_data, dict):
            _add_section(elements, section_data, styles)
        elif isinstance(section_data, list):
            for item in section_data:
                _add_section(elements, item, styles)
        else:
            elements.append(Paragraph(str(section_data), styles["Body"]))

        # subtle break between top-level sections
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=0.5, color="#CCC"))
        elements.append(Spacer(1, 12))

    doc.build(elements)
    return f"/api/v1/report/static/reports/{address}.pdf"


def _add_section(elements, data, styles, level=0):
    """
    Recursively process nested dicts and lists into a cleaner, more styled PDF.
    """

    indent_space = "&nbsp;" * 4 * level

    for k, v in data.items():
        key_label = f"{indent_space}<b>{k.replace('_', ' ').title()}:</b>"

        # if nested dict
        if isinstance(v, dict):
            elements.append(Paragraph(key_label, styles["SubHeader"]))
            elements.append(Spacer(1, 4))
            _add_section(elements, v, styles, level + 1)

        # if list
        elif isinstance(v, list):
            if v and isinstance(v[0], dict):
                # treat list of dicts as a table
                table_data = []
                columns = list(v[0].keys())
                table_data.append(
                    [Paragraph(f"<b>{col.replace('_',' ').title()}</b>", styles["Body"]) for col in columns]
                )
                for item in v:
                    row = [str(item.get(col, "")) for col in columns]
                    table_data.append(row)
                table = Table(table_data, style=[
                    ("BACKGROUND", (0, 0), (-1, 0), "#6A7B52"),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTNAME", (0, 0), (-1, -1), "Times-Roman"),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ])
                elements.append(table)
                elements.append(Spacer(1, 8))
            else:
                # plain list
                for item in v:
                    elements.append(Paragraph(f"{indent_space}- {item}", styles["Body"]))

        else:
            # check if it's an image
            if isinstance(v, str) and v.startswith("http") and (v.endswith(".jpg") or v.endswith(".png")):
                try:
                    response = requests.get(v, timeout=5)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img = Image(img_data, width=3*inch, preserveAspectRatio=True)
                        elements.append(img)
                        elements.append(Paragraph(k.replace("_", " ").title(), styles["Caption"]))
                        elements.append(Spacer(1, 6))
                except:
                    elements.append(Paragraph(f"{key_label} [image failed to load]", styles["Body"]))
            else:
                # highlight key metrics
                if k.lower() in ["financial rating", "family rating", "nightlife score", "neighborhood rating", "environmental rating"]:
                    elements.append(Paragraph(f"{key_label} {v}", styles["HighlightBox"]))
                else:
                    elements.append(Paragraph(f"{key_label} {v}", styles["Body"]))