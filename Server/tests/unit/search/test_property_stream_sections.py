"""Unit tests for property research SSE stream event shapes (subsection coverage)."""

from __future__ import annotations

import json
from contextlib import ExitStack
from datetime import datetime, timezone
from unittest.mock import MagicMock, Mock, patch

import pytest

from app.services.research.property.property_analysis import DEFAULT_SECTION_ORDER
from app.services.search.property.property_stream import generate_property_stream
from app.services.search.property.property_stream_internal import _sse
from app.services.search.scoring.research_preferences_context import ResearchAnalysisOptions


def _parse_sse_chunks(chunks: list[str]) -> list[dict]:
    events: list[dict] = []
    for chunk in chunks:
        if not chunk.startswith("data: "):
            continue
        payload = json.loads(chunk.removeprefix("data: ").strip())
        events.append(payload)
    return events


def _basic_listing_data() -> dict:
    return {
        "zpid": "MLS-100",
        "streetAddress": "100 Main St",
        "city": "Austin",
        "state": "TX",
        "zipcode": "78701",
        "bedrooms": 3,
        "bathrooms": 2,
        "livingArea": 1600,
        "price": 425000,
        "latitude": 30.27,
        "longitude": -97.74,
        "imgSrc": "https://example.com/photo.jpg",
        "images": ["https://example.com/photo.jpg"],
        "propertyType": "Single Family",
        "listingStatus": "Active",
    }


@pytest.fixture
def analysis_options() -> ResearchAnalysisOptions:
    return ResearchAnalysisOptions(
        preferences_user_id="user-stream-1",
        profile_subject="self",
        viewer_is_agent=False,
        pros_count=3,
        cons_count=3,
        bullet_style="medium",
        cache_signature="sig-test",
        preferences={"preferred_bedrooms": 3},
    )


class TestSseHelpers:
    def test_sse_wraps_type_and_data(self) -> None:
        raw = _sse("basic", {"success": True, "data": {"address": "100 Main St"}})
        parsed = json.loads(raw.removeprefix("data: ").strip())
        assert parsed["type"] == "basic"
        assert parsed["data"]["success"] is True


def _stream_patch_targets(
    *,
    analysis_options: ResearchAnalysisOptions | None = None,
    cached_sections: dict | None = None,
    sonar_result: Mock | None = None,
    compare_mode: bool = False,
) -> dict[str, object]:
    """Patch map for property stream tests (keeps nesting under Python's block limit)."""
    internal = "app.services.search.property.property_stream_internal"
    tail = "app.services.search.property.property_stream_internal_tail"
    mock_prop = Mock()
    mock_prop.id = 42
    mock_prop.images = ["https://example.com/photo.jpg"]
    mock_prop.images_fetched_at = datetime.now(timezone.utc)
    mock_prop.image_features = {"clean": ["pool"]}
    mock_prop.image_features_generated_at = datetime.now(timezone.utc)
    mock_prop.basic_data_updated_at = datetime.now(timezone.utc)
    mock_prop.listing_features = None
    mock_prop.raw_data = _basic_listing_data()

    targets: dict[str, object] = {
        f"{internal}.get_current_user": Mock(id="user-stream-1"),
        f"{internal}.get_property_by_zpid_or_address": None,
        f"{internal}.fetch_basic_property_data": (_basic_listing_data(), None),
        f"{internal}.get_or_create_property": mock_prop,
        f"{internal}.update_property_basic_data": None,
        f"{internal}.update_property_price": None,
        f"{internal}.build_commute_data": {"travel_times": [{"minutes": 20}]},
        f"{internal}.get_cached_sections_dict": cached_sections or {},
        f"{internal}.get_cached_sections": [],
        f"{internal}.should_regenerate_section": False,
        f"{internal}.finalize_property_analysis_payload": lambda pa, _addr, **_: pa,
        f"{internal}.public_property_analysis": lambda pa: pa,
        f"{tail}.fetch_zillow_images": ["https://example.com/photo.jpg"],
        f"{tail}.build_features": {"kitchen": ["granite"]},
        f"{tail}.build_combined_features": ["pool"],
        f"{tail}.persist_to_property_cache": None,
    }
    if compare_mode:
        targets[f"{internal}.generate_report_sections_for_property_streaming"] = iter([])
        targets[f"{internal}.build_research_analysis_options"] = (analysis_options, None)
    else:
        targets[f"{internal}.build_research_analysis_options"] = (analysis_options, None)
        targets[f"{internal}.get_user_commute"] = None
        targets[f"{internal}.save_user_commute"] = None
        targets[f"{internal}.get_user_highlights"] = None
        targets[f"{internal}.analyze_property_with_sonar_pro"] = sonar_result
        targets[f"{internal}.resolve_highlights_counts_and_signature"] = (3, 3, "sig-test", 85.0)
        targets[f"{internal}.save_user_highlights"] = None
        targets[f"{internal}.generate_report_sections_for_property_streaming"] = iter([])
        targets[f"{internal}.enrich_neighborhood_overview_with_census"] = lambda nb, _addr: {
            **nb,
            "age_distribution": {"18-24": "10%"},
        }
        targets[f"{internal}.attach_analysis_cache_meta"] = lambda pa, _sig: pa
        targets[f"{tail}.extract_and_clean_features"] = {"clean": ["hardwood"]}
        targets[f"{tail}.update_property_images"] = None
    return targets


class TestGeneratePropertyStreamSections:
    def test_stream_emits_core_subsection_events(self, app, analysis_options) -> None:
        """Overview (basic), Location (commute_data), Match (partial), Analysis sections, tail, complete."""
        cached_sections = {
            "neighborhood": {"summary": "Walkable"},
            "family_friendly": {"schools": [{"name": "Elem"}]},
            "climate_environmental_safety": {"climate": "Mild summers."},
            "affordability": {"summary": "Within budget"},
            "commute": {"summary": "25 min drive"},
            "entertainment": {"venues": []},
            "investment": {"outlook": "stable"},
            "convenience_walkability": {"walk_score": 72},
        }

        class _SonarResult:
            pros = ["Great layout"]
            cons = ["Busy street"]

        sonar_result = _SonarResult()

        with app.app_context():
            targets = _stream_patch_targets(
                analysis_options=analysis_options,
                cached_sections=cached_sections,
                sonar_result=sonar_result,
            )
            with ExitStack() as stack:
                mock_db = stack.enter_context(
                    patch("app.services.search.property.property_stream_internal.db")
                )
                for target, value in targets.items():
                    if callable(value) and not isinstance(value, Mock):
                        stack.enter_context(patch(target, side_effect=value))
                    else:
                        stack.enter_context(patch(target, return_value=value))
                mock_db.session.commit = MagicMock()
                mock_db.session.rollback = MagicMock()
                chunks = list(
                    generate_property_stream(
                        {"zpid": "MLS-100"},
                        address="100 Main St, Austin, TX",
                        research_body={},
                    )
                )

                events = _parse_sse_chunks(chunks)
                types = [e["type"] for e in events]

                assert "basic" in types
                assert "commute_data" in types
                assert "property_analysis_partial" in types
                assert "property_analysis_section" in types
                assert "property_analysis" in types
                assert "images" in types
                assert "complete" in types

                section_events = [e for e in events if e["type"] == "property_analysis_section"]
                section_keys = {list(e["data"].keys())[0] for e in section_events}
                assert "climate_environmental_safety" in section_keys
                assert "family_friendly" in section_keys
                assert "neighborhood_overview" in section_keys

                neighborhood_event = next(
                    e for e in section_events if "neighborhood_overview" in e["data"]
                )
                assert neighborhood_event["data"]["neighborhood_overview"]["summary"] == "Walkable"
                assert neighborhood_event["data"]["neighborhood_overview"]["age_distribution"] == {
                    "18-24": "10%"
                }

                basic = next(e for e in events if e["type"] == "basic")
                assert basic["data"]["data"]["streetAddress"] == "100 Main St"

                commute = next(e for e in events if e["type"] == "commute_data")
                assert commute["data"]["travel_times"]

                analysis = next(e for e in events if e["type"] == "property_analysis")
                for section_key in (
                    "neighborhood",
                    "family_friendly",
                    "climate_environmental_safety",
                ):
                    assert section_key in analysis["data"]

                partial = next(e for e in events if e["type"] == "property_analysis_partial")
                assert "pros" in partial["data"]
                assert "cons" in partial["data"]

    def test_compare_stream_skips_highlights_and_yields_section_events(
        self, app, analysis_options
    ) -> None:
        from app.services.search.property.property_stream import generate_property_stream_compare

        cached_sections = {
            sn: {"stub": True} for sn in DEFAULT_SECTION_ORDER if sn != "neighborhood"
        }

        with app.app_context():
            targets = _stream_patch_targets(
                analysis_options=analysis_options,
                cached_sections=cached_sections,
                compare_mode=True,
            )
            with ExitStack() as stack:
                mock_db = stack.enter_context(
                    patch("app.services.search.property.property_stream_internal.db")
                )
                for target, value in targets.items():
                    if callable(value) and not isinstance(value, Mock):
                        stack.enter_context(patch(target, side_effect=value))
                    else:
                        stack.enter_context(patch(target, return_value=value))
                mock_db.session.commit = MagicMock()
                mock_db.session.rollback = MagicMock()
                chunks = list(
                    generate_property_stream_compare({"zpid": "MLS-100"}, address="100 Main St")
                )

                events = _parse_sse_chunks(chunks)
                types = [e["type"] for e in events]

                assert "property_analysis_section" in types
                assert "property_analysis_partial" not in types
                section_types = {
                    list(e["data"].keys())[0]
                    for e in events
                    if e["type"] == "property_analysis_section"
                }
                assert "climate_environmental_safety" in section_types
                assert "family_friendly" in section_types
