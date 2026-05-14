"""
Tests for home matching ensemble / blend helpers.
"""

from unittest.mock import Mock


class TestBlendScores:
    """``blend_scores`` scales embedding similarity to a 0–100 display score."""

    def test_blend_scores_scales_embedding(self):
        from app.services.search.home_matching.postprocessing.blend_scores import blend_scores

        assert blend_scores(0.85) == 85.0
        assert blend_scores(0.0) == 0.0
        assert blend_scores(1.0) == 100.0

    def test_blend_scores_clamps_out_of_range(self):
        from app.services.search.home_matching.postprocessing.blend_scores import (
            EnsembleScorer,
        )

        ensemble = EnsembleScorer()
        assert ensemble.blend_scores(-0.5) == 0.0
        assert ensemble.blend_scores(1.25) == 100.0


class TestScoreHomeBatch:
    """``score_home_batch`` wires embedding scores through a blend function."""

    def test_score_home_batch_uses_blend_func(self):
        from app.services.search.home_matching.postprocessing.batch_scoring import score_home_batch

        mock_scorer = Mock()
        mock_scorer.score_user_against_homes.return_value = [("h1", 0.8), ("h2", 0.4)]
        blend = Mock(side_effect=lambda x: round(x * 100, 1))

        homes = [{"home_id": "a"}, {"home_id": "b"}]
        out = score_home_batch(
            {"user_id": "u1"},
            0,
            homes,
            mock_scorer,
            blend,
            track_to_db=False,
        )

        assert len(out) == 2
        assert out[0]["final_score"] == 80.0
        assert out[1]["final_score"] == 40.0
        blend.assert_called()


class TestCohortAssigner:
    """Smoke tests for ``CohortAssigner`` (DB-backed)."""

    def test_unknown_user_default_cohort(self, app):
        from app.services.search.home_matching.postprocessing.cohort_assigner import (
            cohort_assigner,
        )

        with app.app_context():
            assert cohort_assigner.get_user_cohort("no-such-user-uuid") == "default"
