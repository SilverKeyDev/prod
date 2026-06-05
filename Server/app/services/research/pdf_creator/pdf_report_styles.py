"""ReportLab paragraph styles for research PDF reports."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet


def build_report_pdf_styles():
    """Register and return the style sheet used by property research PDFs."""
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
    return styles
