"""Tests for ``get_property_images`` from the RapidAPI data module.

Verifies image extraction from multiple payload shapes, empty-input handling,
and graceful behavior on API failure.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response


class TestGetPropertyImages:
    @patch("app.services.search.data.property.property_images.rapidapi_get")
    def test_returns_images(self, mock_get):
        mock_get.return_value = _mock_response({"images": ["a.jpg", "b.jpg", "c.jpg"]})
        from app.services.search.data.property.property_images import get_property_images

        imgs = get_property_images("12345")
        assert imgs == ["a.jpg", "b.jpg", "c.jpg"]
        assert mock_get.call_args[1]["params"]["zpid"] == "12345"

    @patch("app.services.search.data.property.property_images.rapidapi_get")
    def test_photos_key(self, mock_get):
        mock_get.return_value = _mock_response(
            {"photos": [{"url": "a.jpg"}, {"src": "b.jpg"}, "c.jpg"]}
        )
        from app.services.search.data.property.property_images import get_property_images

        imgs = get_property_images("12345")
        assert imgs == ["a.jpg", "b.jpg", "c.jpg"]

    @patch("app.services.search.data.property.property_images.rapidapi_get")
    def test_no_images(self, mock_get):
        mock_get.return_value = _mock_response({"images": []})
        from app.services.search.data.property.property_images import get_property_images

        imgs = get_property_images("12345")
        assert imgs == []

    def test_empty_id(self):
        from app.services.search.data.property.property_images import get_property_images

        assert get_property_images("") == []

    @patch("app.services.search.data.property.property_images.rapidapi_get")
    def test_api_failure(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=500, ok=False)
        from app.services.search.data.property.property_images import get_property_images

        assert get_property_images("12345") == []
