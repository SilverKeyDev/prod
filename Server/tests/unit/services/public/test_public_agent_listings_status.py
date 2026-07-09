"""Tests for public agent listings status bucketing."""

from app.schemas.generated import StatusCategory
from app.services.public.agent_listings import status_category_for_listing_status


def test_active_like_statuses_bucket_as_active():
    for raw in ("Active", "ACTIVE", "New", "Price Change", "Under Contract", "Back On Market"):
        assert status_category_for_listing_status(raw) == StatusCategory.active


def test_sold_like_statuses_bucket_as_sold():
    for raw in ("Sold", "SOLD", "Closed", "Recently Sold", "recently_sold", "Off Market"):
        assert status_category_for_listing_status(raw) == StatusCategory.sold


def test_missing_status_buckets_as_active():
    assert status_category_for_listing_status(None) == StatusCategory.active
    assert status_category_for_listing_status("") == StatusCategory.active
