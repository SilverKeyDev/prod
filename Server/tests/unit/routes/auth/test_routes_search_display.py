"""Tests for GET/PATCH /api/v1/search-display."""

from unittest.mock import patch

from flask import Flask


class TestSearchDisplayRoutes:
    """Read and update per-user search display settings."""

    def test_get_search_display_creates_defaults(self, client, app: Flask, db_session):
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-123",
                email="search-display@example.com",
                name="Search Display User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/search-display",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["search_display"]["show_commute_overlay"] is True
                assert data["search_display"]["map_home_cards_count"] == 1
                assert data["search_display"]["results_order_by"] == "match_score"
                assert data["search_display"]["preferences_strict_filter"] is False

    def test_patch_search_display_persists_partial_updates(self, client, app: Flask, db_session):
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-456",
                email="search-display-patch@example.com",
                name="Search Display Patch User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.patch(
                    "/api/v1/search-display",
                    headers={"Authorization": "Bearer mock_token"},
                    json={
                        "show_commute_overlay": False,
                        "results_order_by": "price",
                        "preferences_strict_filter": True,
                    },
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["search_display"]["show_commute_overlay"] is False
                assert data["search_display"]["results_order_by"] == "price"
                assert data["search_display"]["preferences_strict_filter"] is True

                get_response = client.get(
                    "/api/v1/search-display",
                    headers={"Authorization": "Bearer mock_token"},
                )
                get_data = get_response.get_json()
                assert get_data["search_display"]["show_commute_overlay"] is False
                assert get_data["search_display"]["results_order_by"] == "price"
                assert get_data["search_display"]["preferences_strict_filter"] is True

    def test_patch_search_display_persists_fractional_map_zoom(
        self, client, app: Flask, db_session
    ):
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-zoom",
                email="search-display-zoom@example.com",
                name="Search Display Zoom User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.patch(
                    "/api/v1/search-display",
                    headers={"Authorization": "Bearer mock_token"},
                    json={
                        "last_search_context": {
                            "search_source": "location",
                            "map_zoom": 12.7,
                            "map_center": {"lat": 33.75, "lng": -84.39},
                        }
                    },
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["search_display"]["last_search_context"]["map_zoom"] == 12.7

    def test_patch_search_display_rejects_empty_body(self, client, app: Flask, db_session):
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-789",
                email="search-display-empty@example.com",
                name="Search Display Empty User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.patch(
                    "/api/v1/search-display",
                    headers={"Authorization": "Bearer mock_token"},
                    json={},
                )

                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False
