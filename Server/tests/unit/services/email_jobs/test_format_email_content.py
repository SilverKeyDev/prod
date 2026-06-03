"""Unit tests for email content formatting."""

from types import SimpleNamespace

from app.services.email.format_email_content import EMAIL_CONFIG, EmailFormatter


def test_format_listings_text_includes_configured_title_and_listing_details():
    formatter = EmailFormatter()
    listings = [
        SimpleNamespace(
            address="123 Main St",
            price="450000",
            beds="3",
            baths="2",
            sqft="1800",
            score=0.87,
        )
    ]
    body = formatter.format_listings_text(listings)
    assert EMAIL_CONFIG["title"] in body
    assert "123 Main St" in body
    assert "450,000" in body
    assert "Match Score: 0.87" in body
    assert EMAIL_CONFIG["footer_text"] in body


def test_format_listings_text_returns_empty_for_no_listings():
    formatter = EmailFormatter()
    assert formatter.format_listings_text([]) == ""


def test_format_email_message_returns_subject_and_plain_body():
    formatter = EmailFormatter()
    listing = SimpleNamespace(
        address="456 Oak Ave",
        price="500000",
        beds="4",
        baths="3",
        sqft="2200",
        score=0.75,
    )
    email, subject, body_text, html_body = formatter.format_email_message(
        "buyer@example.com",
        [listing],
        use_html=False,
    )
    assert email == "buyer@example.com"
    assert subject == EMAIL_CONFIG["subject_template"]
    assert "456 Oak Ave" in body_text
    assert html_body is None
