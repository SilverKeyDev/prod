"""Tests for public agent listings JSON API."""

from unittest.mock import patch

from app.schemas.generated import PublicAgentListing, StatusCategory
from tests.unit.routes.rev_share.conftest import assert_resource_not_found


def _listing(status_category: StatusCategory) -> PublicAgentListing:
    return PublicAgentListing(
        id="row-1",
        zpid="12345",
        address="653 Prada Court, Lawrenceville, GA 30043",
        city="Lawrenceville",
        state="GA",
        zipcode="30043",
        price="$519,900",
        beds="6",
        baths="4",
        sqft="2364",
        primary_image_url="https://example.com/photo.jpg",
        listing_status="Active",
        status_category=status_category,
        brokerage="Example Realty",
        mls_home_id="10700080",
        mls_region="GA",
    )


def test_public_agent_listings_not_found(client):
    with patch(
        "app.routes.public.agent_listings.build_public_agent_listings",
        return_value=None,
    ):
        response = client.get("/api/v1/public/agent-profile/missing-user-id/listings")

    assert_resource_not_found(response)


def test_public_agent_listings_invalid_status(client):
    response = client.get("/api/v1/public/agent-profile/user-1/listings?status=pending")

    assert response.status_code == 400


def test_public_agent_listings_success(client):
    with patch(
        "app.routes.public.agent_listings.build_public_agent_listings",
        return_value=[_listing(StatusCategory.active)],
    ) as build:
        response = client.get("/api/v1/public/agent-profile/user-1/listings")

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert len(body["listings"]) == 1
    assert body["listings"][0]["status_category"] == "active"
    assert body["listings"][0]["brokerage"] == "Example Realty"
    build.assert_called_once_with("user-1", None)


def test_public_agent_listings_status_filter_passthrough(client):
    with patch(
        "app.routes.public.agent_listings.build_public_agent_listings",
        return_value=[],
    ) as build:
        response = client.get("/api/v1/public/agent-profile/user-1/listings?status=sold")

    assert response.status_code == 200
    assert response.get_json()["listings"] == []
    build.assert_called_once_with("user-1", StatusCategory.sold)
