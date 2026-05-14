"""Tests for ``search_inactive_listings`` from the Slipstream data module.

Verifies the inactive-listings endpoint parses sold/closed listings and hits the
correct Slipstream URL.
"""

from __future__ import annotations

from unittest.mock import patch

from ._helpers import _mock_response, _raw_listing


class TestSearchInactiveListings:
    @patch("app.services.search.data.listings.listings_inactive.slipstream_get")
    def test_success(self, mock_get):
        mock_get.return_value = _mock_response(
            {
                "success": True,
                "result": {
                    "listings": [_raw_listing(id="S1", status="Sold", salePrice=480000)],
                    "paging": {"number": 1, "count": 1, "size": 25},
                },
            }
        )
        from app.services.search.data.listings.listings_inactive import search_inactive_listings

        listings, paging, errors = search_inactive_listings()
        assert len(listings) == 1
        assert listings[0]["listingStatus"] == "Sold"
        assert listings[0]["salePrice"] == 480000
        mock_get.assert_called_once()
        assert "/ws/listings/inactive/search" in mock_get.call_args[0][0]
