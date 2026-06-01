"""Unit tests for research preference resolution (no DB)."""

import json
import unittest
from unittest.mock import MagicMock, patch

from app.services.search.scoring.research_preferences_context import (
    compute_analysis_cache_signature,
    resolve_preferences_user_id_for_research,
)


class TestResearchPreferencesContext(unittest.TestCase):
    def test_cache_signature_stable(self) -> None:
        s1 = compute_analysis_cache_signature("u1", "self", True, 3, 3, "medium")
        s2 = compute_analysis_cache_signature("u1", "self", True, 3, 3, "medium")
        self.assertEqual(s1, s2)

    def test_cache_signature_changes_with_prefs_user(self) -> None:
        s1 = compute_analysis_cache_signature("u1", "self", True, 3, 3, "medium")
        s2 = compute_analysis_cache_signature("u2", "self", True, 3, 3, "medium")
        self.assertNotEqual(s1, s2)

    def test_buyer_ignores_foreign_preferences_user_id(self) -> None:
        user = MagicMock()
        user.id = "buyer-1"
        user.is_agent = False
        resolved, err = resolve_preferences_user_id_for_research(user, "other")
        self.assertIsNone(err)
        self.assertEqual(resolved, "buyer-1")

    @patch("app.services.search.scoring.research_preferences_context.agent_may_access_client")
    def test_agent_forbidden_when_client_not_in_list(self, mock_may_access) -> None:
        user = MagicMock()
        user.id = "agent-1"
        user.is_agent = True
        user.client_ids = json.dumps(["c1"])
        mock_may_access.return_value = False
        resolved, err = resolve_preferences_user_id_for_research(user, "not-a-client")
        self.assertIsNone(resolved)
        self.assertIsNotNone(err)
        self.assertEqual(err.get("error"), "FORBIDDEN")
        mock_may_access.assert_called_once_with("agent-1", "not-a-client")

    @patch("app.services.search.scoring.research_preferences_context.agent_may_access_client")
    def test_agent_allowed_for_listed_client(self, mock_may_access) -> None:
        user = MagicMock()
        user.id = "agent-1"
        user.is_agent = True
        user.client_ids = json.dumps(["c1"])
        mock_may_access.return_value = True
        resolved, err = resolve_preferences_user_id_for_research(user, "c1")
        self.assertIsNone(err)
        self.assertEqual(resolved, "c1")
        mock_may_access.assert_called_once_with("agent-1", "c1")

    @patch("app.services.search.scoring.research_preferences_context.agent_may_access_client")
    def test_agent_allowed_via_connection_only_mocked(self, mock_may_access) -> None:
        user = MagicMock()
        user.id = "agent-conn"
        user.is_agent = True
        user.client_ids = json.dumps([])
        mock_may_access.return_value = True
        resolved, err = resolve_preferences_user_id_for_research(user, "client-via-conn")
        self.assertIsNone(err)
        self.assertEqual(resolved, "client-via-conn")
        mock_may_access.assert_called_once_with("agent-conn", "client-via-conn")


if __name__ == "__main__":
    unittest.main()
