"""Unit tests for research preference resolution (no DB)."""

import json
import unittest
from unittest.mock import MagicMock

from app.services.search.scoring import (
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

    def test_agent_forbidden_when_client_not_in_list(self) -> None:
        user = MagicMock()
        user.id = "agent-1"
        user.is_agent = True
        user.client_ids = json.dumps(["c1"])
        resolved, err = resolve_preferences_user_id_for_research(user, "not-a-client")
        self.assertIsNone(resolved)
        self.assertIsNotNone(err)
        self.assertEqual(err.get("error"), "FORBIDDEN")

    def test_agent_allowed_for_listed_client(self) -> None:
        user = MagicMock()
        user.id = "agent-1"
        user.is_agent = True
        user.client_ids = json.dumps(["c1"])
        resolved, err = resolve_preferences_user_id_for_research(user, "c1")
        self.assertIsNone(err)
        self.assertEqual(resolved, "c1")


if __name__ == "__main__":
    unittest.main()
