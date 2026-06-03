"""Unit tests for email HTML rendering helpers."""

from types import SimpleNamespace

from app.services.email.render_email_html import convert_listing_to_email_dict, get_workspace_root


def test_convert_listing_to_email_dict_maps_fields():
    home = SimpleNamespace(
        id="home-1",
        address="123 Main St",
        price="450000",
        beds="3",
        baths="2",
        sqft="1800",
        score=0.9,
        image_url="https://cdn.example/photo.jpg",
    )
    result = convert_listing_to_email_dict(home)
    assert result["id"] == "home-1"
    assert result["address"] == "123 Main St"
    assert result["bedrooms"] == 3
    assert result["bathrooms"] == 2
    assert result["sqft"] == 1800
    assert result["score"] == 0.9
    assert result["imageUrl"] == "https://cdn.example/photo.jpg"


def test_get_workspace_root_points_at_monorepo_root():
    root = get_workspace_root()
    assert (root / "Client").is_dir()
    assert (root / "Server").is_dir()
