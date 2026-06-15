"""Side-by-side demographic chart insertion for research PDF reports."""

from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

from logger import log


def insert_demographics_charts_after_neighborhood(
    elements: list,
    *,
    prebuilt_chart_tables: dict,
    styles,
) -> bool:
    """
    Insert lifestyle/age charts after neighborhood_overview.

    Returns True when charts were inserted (caller should skip re-inserting).
    """
    try:
        lifestyle_table = prebuilt_chart_tables.get("lifestyle_dna")
        age_table = prebuilt_chart_tables.get("age_distribution")
        if not (lifestyle_table or age_table):
            return False

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
            elements.append(Paragraph("Demographics Overview", styles["Caption"]))
            elements.append(Spacer(1, 20))
        else:
            elements.append(lifestyle_table or age_table)
            elements.append(Spacer(1, 10))
        return True
    except Exception as e:
        log.warn(
            "PROPERTY_DETAILS",
            "Failed to render side-by-side charts:",
            {"detail": str(e)},
        )
        return False
