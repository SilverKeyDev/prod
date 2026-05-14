"""Tests for ``get_property_images`` from the Slipstream data module.

Verifies image extraction, empty-input handling, and graceful behavior on API
failure.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response


class TestGetPropertyImages:
    @patch("app.services.search.data.property.property_images.slipstream_get")
    def test_returns_images(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [{"images": ["a.jpg", "b.jpg", "c.jpg"]}],
                },
            }
        )
        from app.services.search.data.property.property_images import get_property_images

        imgs = get_property_images("MLS-001")
        assert imgs == ["a.jpg", "b.jpg", "c.jpg"]

    @patch("app.services.search.data.property.property_images.slipstream_get")
    def test_no_images(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {"listings": [{"images": []}]},
            }
        )
        from app.services.search.data.property.property_images import get_property_images

        imgs = get_property_images("MLS-001")
        assert imgs == []

    def test_empty_id(self):
        from app.services.search.data.property.property_images import get_property_images

        assert get_property_images("") == []

    @patch("app.services.search.data.property.property_images.slipstream_get")
    def test_api_failure(self, mock_get):
        mock_get.return_value = _mock_response({}, status_code=500, ok=False)
        from app.services.search.data.property.property_images import get_property_images

        assert get_property_images("MLS-001") == []
