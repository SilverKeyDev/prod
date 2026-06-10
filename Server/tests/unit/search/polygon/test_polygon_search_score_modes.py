"""Polygon search scoring across buyer/agent and cache vs fresh paths."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest

from app.services.search.polygon.polygon_runner import run_polygon_search

MOCK_GET_PREFS = "app.services.search.polygon.polygon_runner.get_user_preferences_parsed"
MOCK_ISOCHRONE = (
    "app.services.search.polygon.resolve_search_polygon.generate_isochrone_polygon_from_preferences"
)
MOCK_PAGINATED = "app.services.search.polygon.polygon_runner.search_properties_paginated"
MOCK_MARK_PAST = (
    "app.services.search.polygon.polygon_runner.mark_past_search_results_as_not_current"
)
MOCK_PERSIST = "app.services.search.polygon.polygon_runner.persist_and_prune_search_results"
MOCK_STRICT = "app.services.search.polygon.polygon_runner.resolve_strict_preference_filter"


def _square_ring() -> list[dict[str, float]]:
    """Ring with lat/lon keys (isochrone + GeoJSON helpers)."""
    corners = [
        (33.75, -84.39),
        (33.76, -84.39),
        (33.76, -84.38),
        (33.75, -84.38),
    ]
    return [{"lat": lat, "lon": lon, "lng": lon} for lat, lon in corners]


_VIEWPORT = [
    {"lat": lat, "lng": lon}
    for lat, lon in [
        (33.75, -84.39),
        (33.76, -84.39),
        (33.76, -84.38),
        (33.75, -84.38),
    ]
]

_CLIENT_PREFS = {
    "home_budget_max": 550_000,
    "preferred_bedrooms_min": 3,
    "preferred_bathrooms_min": 2,
}


def _paginated_homogeneous() -> list[dict]:
    return [
        {
            "zpid": str(2000 + i),
            "address": f"{100 + i} Peachtree St, Atlanta, GA",
            "price": 350_000 + i * 15_000,
            "bedrooms": 3,
            "bathrooms": 2,
            "livingArea": 1_750 + i * 40,
            "latitude": 33.751 + i * 0.001,
            "longitude": -84.385,
            "daysOnMarket": 10 + i,
            "listingStatus": "for_sale",
        }
        for i in range(6)
    ]


def _distinct_openapi_scores(payload: dict) -> set[float]:
    props = payload.get("properties") or []
    scores: set[float] = set()
    for row in props:
        if isinstance(row, dict) and row.get("score") is not None:
            scores.add(round(float(row["score"]), 1))
    return scores


@pytest.fixture
def flask_ctx():
    from flask import Flask

    app = Flask("polygon_score_modes_test")
    with app.app_context():
        yield app


@pytest.fixture
def memory_db(flask_ctx):
    import app.models  # noqa: F401 — register models
    from app.extensions import db

    flask_ctx.config.update(
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    if "sqlalchemy" not in getattr(flask_ctx, "extensions", {}):
        db.init_app(flask_ctx)
    with flask_ctx.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()


class TestPolygonSearchScoreModes:
    @patch(MOCK_STRICT, return_value=False)
    @patch(MOCK_PERSIST)
    @patch(MOCK_MARK_PAST)
    @patch(MOCK_GET_PREFS)
    def test_force_search_without_geometry_returns_empty_200(
        self,
        mock_prefs,
        mock_mark,
        mock_persist,
        _mock_strict,
        flask_ctx,
    ) -> None:
        mock_prefs.return_value = ({}, None)

        payload, status = run_polygon_search(
            "buyer-no-area",
            {"forceSearch": True},
        )
        assert status == 200
        assert payload["properties"] == []
        assert payload["meta"].get("searchArea") == "none"

    @patch(MOCK_STRICT, return_value=False)
    @patch(MOCK_PERSIST)
    @patch(MOCK_MARK_PAST)
    @patch(MOCK_PAGINATED)
    @patch(MOCK_ISOCHRONE)
    @patch(MOCK_GET_PREFS)
    def test_buyer_viewport_force_search_spreads_scores(
        self,
        mock_prefs,
        mock_iso,
        mock_paginated,
        mock_mark,
        mock_persist,
        _mock_strict,
        flask_ctx,
    ) -> None:
        mock_prefs.return_value = (_CLIENT_PREFS, None)
        mock_iso.return_value = _square_ring()
        mock_paginated.return_value = (_paginated_homogeneous(), 1, [])

        payload, status = run_polygon_search(
            "buyer-user-1",
            {"forceSearch": True, "viewport_polygon": _VIEWPORT},
        )
        assert status == 200
        assert payload["meta"]["scored"] is True
        assert len(_distinct_openapi_scores(payload)) >= 2

    @patch(MOCK_STRICT, return_value=False)
    @patch(MOCK_PERSIST)
    @patch(MOCK_MARK_PAST)
    @patch(MOCK_PAGINATED)
    @patch(MOCK_ISOCHRONE)
    @patch(MOCK_GET_PREFS)
    def test_agent_uses_client_preferences_subject(
        self,
        mock_prefs,
        mock_iso,
        mock_paginated,
        mock_mark,
        mock_persist,
        _mock_strict,
        flask_ctx,
    ) -> None:
        mock_prefs.return_value = (_CLIENT_PREFS, None)
        mock_iso.return_value = _square_ring()
        mock_paginated.return_value = (_paginated_homogeneous(), 1, [])

        payload, status = run_polygon_search(
            "agent-user-1",
            {"forceSearch": True},
            preferences_subject_user_id="client-user-9",
        )
        assert status == 200
        mock_prefs.assert_called()
        assert mock_prefs.call_args[0][0] == "client-user-9"
        assert len(_distinct_openapi_scores(payload)) >= 2

    @patch(MOCK_STRICT, return_value=False)
    @patch(MOCK_PERSIST)
    @patch(MOCK_MARK_PAST)
    @patch(MOCK_PAGINATED)
    @patch(MOCK_ISOCHRONE)
    @patch(MOCK_GET_PREFS)
    def test_isochrone_preferences_search_spreads_scores(
        self,
        mock_prefs,
        mock_iso,
        mock_paginated,
        mock_mark,
        mock_persist,
        _mock_strict,
        flask_ctx,
    ) -> None:
        mock_prefs.return_value = (_CLIENT_PREFS, None)
        mock_iso.return_value = _square_ring()
        mock_paginated.return_value = (_paginated_homogeneous(), 1, [])

        payload, status = run_polygon_search(
            "buyer-user-2",
            {"forceSearch": True},
        )
        assert status == 200
        assert payload["meta"].get("searchArea") == "isochrone"
        assert len(_distinct_openapi_scores(payload)) >= 2

    def test_only_cached_returns_distinct_persisted_scores(self, memory_db) -> None:
        from app.extensions import db
        from app.models import PropertyCache, UserPropertyLink

        user_id = f"cache-user-{uuid.uuid4().hex[:8]}"
        props: list[PropertyCache] = []
        for idx, score in enumerate((54.0, 72.0)):
            prop = PropertyCache(
                id=str(uuid.uuid4()),
                zpid=f"z-cache-{idx}",
                address=f"{idx} Cache Ln",
                address_normalized=f"cache_{idx}_{uuid.uuid4().hex[:6]}",
                price="400000",
                beds="3",
                baths="2",
                sqft="2000",
                latitude=33.75,
                longitude=-84.39,
            )
            db.session.add(prop)
            db.session.flush()
            link = UserPropertyLink(
                user_id=user_id,
                property_id=prop.id,
                current=True,
                ranking=idx + 1,
                score=score,
            )
            db.session.add(link)
            props.append(prop)
        db.session.commit()

        payload, status = run_polygon_search(user_id, {"onlyCached": True})
        assert status == 200
        scores = _distinct_openapi_scores(payload)
        assert 54.0 in scores
        assert 72.0 in scores

    def test_only_cached_null_link_score_hydrates_from_raw_data(self, memory_db) -> None:
        from app.extensions import db
        from app.models import PropertyCache, UserPropertyLink

        user_id = f"null-score-{uuid.uuid4().hex[:8]}"
        prop = PropertyCache(
            id=str(uuid.uuid4()),
            zpid="z-null",
            address="1 Null Score Rd",
            address_normalized=f"null_{uuid.uuid4().hex[:6]}",
            price="400000",
            raw_data={"_score": 61.5},
        )
        db.session.add(prop)
        db.session.flush()
        db.session.add(
            UserPropertyLink(
                user_id=user_id,
                property_id=prop.id,
                current=True,
                ranking=1,
                score=None,
            )
        )
        db.session.commit()

        payload, status = run_polygon_search(user_id, {"onlyCached": True})
        assert status == 200
        props = payload.get("properties") or []
        assert len(props) == 1
        assert props[0].get("score") == 61.5

    def test_only_cached_includes_home_id(self, memory_db) -> None:
        from app.extensions import db
        from app.models import PropertyCache, UserPropertyLink

        user_id = f"home-id-{uuid.uuid4().hex[:8]}"
        prop_id = str(uuid.uuid4())
        prop = PropertyCache(
            id=prop_id,
            zpid="z-home-id",
            address="9 Home Id Way",
            address_normalized=f"home_id_{uuid.uuid4().hex[:6]}",
            price="500000",
        )
        db.session.add(prop)
        db.session.flush()
        db.session.add(
            UserPropertyLink(
                user_id=user_id,
                property_id=prop.id,
                current=True,
                ranking=1,
                score=80.0,
            )
        )
        db.session.commit()

        payload, status = run_polygon_search(user_id, {"onlyCached": True})
        assert status == 200
        props = payload.get("properties") or []
        assert len(props) == 1
        assert props[0].get("home_id") == prop_id
        assert props[0].get("id") == "z-home-id"
        assert props[0].get("score") == 80.0

    def test_hydrate_listings_refreshes_price_preserves_score(self, memory_db) -> None:
        from app.extensions import db
        from app.models import PropertyCache, UserPropertyLink

        user_id = f"hydrate-{uuid.uuid4().hex[:8]}"
        prop_id = str(uuid.uuid4())
        prop = PropertyCache(
            id=prop_id,
            zpid="z-hydrate",
            address="10 Hydrate Ln",
            address_normalized=f"hydrate_{uuid.uuid4().hex[:6]}",
            price="400000",
            listing_status="FOR_SALE",
        )
        db.session.add(prop)
        db.session.flush()
        db.session.add(
            UserPropertyLink(
                user_id=user_id,
                property_id=prop.id,
                current=True,
                ranking=1,
                score=77.5,
            )
        )
        db.session.commit()

        fresh_listing = {
            "zpid": "z-hydrate",
            "address": "10 Hydrate Ln, Atlanta, GA",
            "price": 425000,
            "bedrooms": 4,
            "bathrooms": 3,
            "livingArea": 2100,
            "latitude": 33.75,
            "longitude": -84.39,
            "listingStatus": "PENDING",
            "imgSrc": "https://example.com/fresh.jpg",
        }

        with patch(
            "app.services.search.db.hydrate_cached_listings.get_property_detail",
            return_value=(fresh_listing, None),
        ):
            payload, status = run_polygon_search(
                user_id, {"onlyCached": True, "hydrateListings": True}
            )

        assert status == 200
        props = payload.get("properties") or []
        assert len(props) == 1
        assert props[0].get("home_id") == prop_id
        assert props[0].get("score") == 77.5
        assert props[0].get("financials", {}).get("price") == 425000
        assert props[0].get("metadata", {}).get("listingStatus") == "PENDING"
