"""Unit tests for research PDF chart field selection."""

from unittest.mock import patch

from app.services.research.pdf_creator.sections.chart_selection import chart_data_from_value


def test_lifestyle_dna_dict_selects_horizontal_bar():
    with patch(
        "app.services.research.pdf_creator.sections.chart_selection.generate_horizontal_bar_chart",
        return_value=b"png",
    ) as mock_gen:
        buffer, chart_type = chart_data_from_value("lifestyle_dna", {"urban": 40, "suburban": 60})
    assert buffer == b"png"
    assert chart_type == "Lifestyle DNA Bar Chart"
    mock_gen.assert_called_once()


def test_age_distribution_dict_selects_vertical_lollipop():
    with patch(
        "app.services.research.pdf_creator.sections.chart_selection.generate_vertical_lollipop_chart",
        return_value=b"png",
    ) as mock_gen:
        buffer, chart_type = chart_data_from_value(
            "age_distribution", {"age_0_19": 10, "age_20_34": 20}
        )
    assert buffer == b"png"
    assert chart_type == "Age Distribution Chart"
    mock_gen.assert_called_once()
    call_data = mock_gen.call_args[0][0]
    assert "0-19" in call_data


def test_generic_chartable_field_selects_bar_chart():
    with patch(
        "app.services.research.pdf_creator.sections.chart_selection.generate_horizontal_bar_chart",
        return_value=b"png",
    ) as mock_gen:
        buffer, chart_type = chart_data_from_value(
            "income_distribution",
            {"under_25k": "10%", "25k_50k": "20%", "50k_75k": "30%"},
        )
    assert buffer == b"png"
    assert chart_type == "Data Chart"
    mock_gen.assert_called_once()


def test_non_chartable_field_returns_empty():
    buffer, chart_type = chart_data_from_value("notes", "plain text")
    assert buffer is None
    assert chart_type == ""
