"""Unit tests for listing_type_match (profile prefs vs API listingStatus)."""

from __future__ import annotations

import importlib.util
import unittest
from datetime import datetime, timezone
from pathlib import Path

# Load module by path so importing does not execute app/__init__.py (Flask).
_helper_path = (
    Path(__file__).resolve().parents[3] / "app/services/search/helpers/listing_type_match.py"
)
_spec = importlib.util.spec_from_file_location("listing_type_match_standalone", _helper_path)
assert _spec and _spec.loader
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
listing_type_prefs_are_owner_posted_only = _mod.listing_type_prefs_are_owner_posted_only
property_matches_listing_type_prefs = _mod.property_matches_listing_type_prefs


class TestPropertyMatchesListingTypePrefs(unittest.TestCase):
    def test_agent_listed_matches_for_sale(self) -> None:
        prop = {"listingStatus": "for_sale"}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["agent_listed"]))

    def test_agent_listed_rejects_sold(self) -> None:
        prop = {"listingStatus": "sold"}
        self.assertFalse(property_matches_listing_type_prefs(prop, ["agent_listed"]))

    def test_empty_status_passes_through(self) -> None:
        prop: dict = {}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["agent_listed"]))

    def test_or_semantics_second_pref_matches(self) -> None:
        prop = {"listingStatus": "for_sale"}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["owner_posted", "agent_listed"]))

    def test_owner_posted_requires_fsbo_signal(self) -> None:
        prop = {"listingStatus": "for_sale"}
        self.assertFalse(property_matches_listing_type_prefs(prop, ["owner_posted"]))
        prop_fsbo = {
            "listingStatus": "for_sale",
            "homeFacts": {"listingType": "For sale by owner"},
        }
        self.assertTrue(property_matches_listing_type_prefs(prop_fsbo, ["owner_posted"]))

    def test_owner_posted_matches_fsbo_in_description(self) -> None:
        prop = {"listingStatus": "for_sale", "description": "Charming FSBO ranch near schools."}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["owner_posted"]))

    def test_listing_type_prefs_are_owner_posted_only(self) -> None:
        self.assertTrue(listing_type_prefs_are_owner_posted_only(["owner_posted"]))
        self.assertTrue(listing_type_prefs_are_owner_posted_only(["owner_posted", "owner_posted"]))
        self.assertFalse(listing_type_prefs_are_owner_posted_only(["owner_posted", "agent_listed"]))
        self.assertFalse(listing_type_prefs_are_owner_posted_only([]))

    def test_new_construction_via_year_built(self) -> None:
        year = datetime.now(tz=timezone.utc).year
        prop = {"listingStatus": "for_sale", "yearBuilt": year}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["new_construction"]))

    def test_new_construction_old_home_false(self) -> None:
        prop = {"listingStatus": "for_sale", "yearBuilt": 1980}
        self.assertFalse(property_matches_listing_type_prefs(prop, ["new_construction"]))

    def test_foreclosure_action(self) -> None:
        prop = {"listingStatus": "foreclosure"}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["foreclosure_action"]))

    def test_legacy_unknown_pref_substring(self) -> None:
        prop = {"listingStatus": "custom_special_status"}
        self.assertTrue(property_matches_listing_type_prefs(prop, ["special"]))

    def test_bulk_for_sale_survives_agent_listed_filter(self) -> None:
        """Regression: polygon post-filter must not drop all MLS for_sale rows."""
        props = [{"listingStatus": "for_sale", "zpid": i} for i in range(59)]
        prefs = ["agent_listed"]
        kept = [p for p in props if property_matches_listing_type_prefs(p, prefs)]
        self.assertEqual(len(kept), 59)


if __name__ == "__main__":
    unittest.main(verbosity=2)
