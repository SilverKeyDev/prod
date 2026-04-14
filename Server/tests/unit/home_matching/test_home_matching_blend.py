"""
Tests for home matching blend scores
"""


class TestBlendScores:
    """Test blending MCDA and embedding scores"""

    def test_blend_scores_basic(self):
        """Test basic score blending"""
        from app.services.search.home_matching.postprocessing.blend_scores import blend_scores

        mcda_score = 75.0
        embedding_score = 0.85
        blend_weight = 0.3  # 30% embedding, 70% MCDA

        blended = blend_scores(mcda_score, embedding_score, blend_weight)

        # Should be weighted average
        expected = (mcda_score * (1 - blend_weight)) + (embedding_score * 100 * blend_weight)
        assert abs(blended - expected) < 0.01

    def test_blend_scores_zero_weight(self):
        """Test blending with zero embedding weight (pure MCDA)"""
        from app.services.search.home_matching.postprocessing.blend_scores import blend_scores

        mcda_score = 75.0
        embedding_score = 0.85
        blend_weight = 0.0  # 0% embedding

        blended = blend_scores(mcda_score, embedding_score, blend_weight)

        # Should equal MCDA score
        assert blended == mcda_score

    def test_blend_scores_full_weight(self):
        """Test blending with full embedding weight"""
        from app.services.search.home_matching.postprocessing.blend_scores import blend_scores

        mcda_score = 75.0
        embedding_score = 0.85
        blend_weight = 1.0  # 100% embedding

        blended = blend_scores(mcda_score, embedding_score, blend_weight)

        # Should equal embedding score (scaled to 100)
        assert abs(blended - (embedding_score * 100)) < 0.01

    def test_blend_multiple_properties(self):
        """Test blending scores for multiple properties"""
        from app.services.search.home_matching.postprocessing.blend_scores import (
            blend_property_scores,
        )

        properties = [
            {"id": "prop-1", "mcda_score": 80.0, "embedding_score": 0.9},
            {"id": "prop-2", "mcda_score": 70.0, "embedding_score": 0.7},
            {"id": "prop-3", "mcda_score": 60.0, "embedding_score": 0.8},
        ]

        blend_weight = 0.2

        results = blend_property_scores(properties, blend_weight)

        assert len(results) == 3
        assert all("blended_score" in prop for prop in results)
        # Verify ordering is reasonable
        assert results[0]["blended_score"] >= results[1]["blended_score"]

    def test_normalize_scores(self):
        """Test normalizing scores to 0-1 range"""
        from app.services.search.home_matching.postprocessing.blend_scores import normalize_scores

        scores = [45.0, 60.0, 75.0, 90.0]

        normalized = normalize_scores(scores, min_val=15.0, max_val=90.0)

        assert len(normalized) == len(scores)
        assert all(0.0 <= score <= 1.0 for score in normalized)
        # Verify relative ordering preserved
        assert normalized[0] < normalized[1] < normalized[2] < normalized[3]

    def test_rank_properties_by_blend(self):
        """Test ranking properties by blended score"""
        from app.services.search.home_matching.postprocessing.blend_scores import rank_properties

        properties = [
            {"id": "prop-1", "blended_score": 75.0},
            {"id": "prop-2", "blended_score": 85.0},
            {"id": "prop-3", "blended_score": 65.0},
            {"id": "prop-4", "blended_score": 90.0},
        ]

        ranked = rank_properties(properties)

        assert len(ranked) == 4
        # Should be sorted by descending score
        assert ranked[0]["id"] == "prop-4"  # Highest score
        assert ranked[1]["id"] == "prop-2"
        assert ranked[2]["id"] == "prop-1"
        assert ranked[3]["id"] == "prop-3"  # Lowest score


class TestBatchScoring:
    """Test batch scoring operations"""

    def test_batch_score_properties(self, sample_preferences):
        """Test scoring multiple properties in batch"""
        from app.services.search.home_matching.postprocessing.batch_scoring import batch_score

        properties = [
            {
                "ListingId": "prop-1",
                "ListPrice": 350000,
                "BedroomsTotal": 3,
                "BathroomsTotalInteger": 2,
                "LivingArea": 2000,
                "PropertyType": "Residential",
            },
            {
                "ListingId": "prop-2",
                "ListPrice": 280000,
                "BedroomsTotal": 2,
                "BathroomsTotalInteger": 1,
                "LivingArea": 1500,
                "PropertyType": "Residential",
            },
            {
                "ListingId": "prop-3",
                "ListPrice": 450000,
                "BedroomsTotal": 4,
                "BathroomsTotalInteger": 3,
                "LivingArea": 2800,
                "PropertyType": "Residential",
            },
        ]

        results = batch_score(properties, sample_preferences)

        assert len(results) == 3
        assert all("score" in prop for prop in results)
        assert all(15.0 <= prop["score"] <= 90.0 for prop in results)

    def test_batch_score_with_embeddings(self, sample_preferences):
        """Test batch scoring with embedding scores"""
        from app.services.search.home_matching.postprocessing.batch_scoring import (
            batch_score_with_embeddings,
        )

        properties = [
            {
                "ListingId": "prop-1",
                "ListPrice": 350000,
                "BedroomsTotal": 3,
                "BathroomsTotalInteger": 2,
                "LivingArea": 2000,
                "PropertyType": "Residential",
                "embedding_score": 0.85,
            },
            {
                "ListingId": "prop-2",
                "ListPrice": 280000,
                "BedroomsTotal": 2,
                "BathroomsTotalInteger": 1,
                "LivingArea": 1500,
                "PropertyType": "Residential",
                "embedding_score": 0.75,
            },
        ]

        blend_weight = 0.2

        results = batch_score_with_embeddings(properties, sample_preferences, blend_weight)

        assert len(results) == 2
        assert all("mcda_score" in prop for prop in results)
        assert all("embedding_score" in prop for prop in results)
        assert all("blended_score" in prop for prop in results)

    def test_filter_by_minimum_score(self):
        """Test filtering properties by minimum score threshold"""
        from app.services.search.home_matching.postprocessing.batch_scoring import filter_by_score

        properties = [
            {"id": "prop-1", "score": 80.0},
            {"id": "prop-2", "score": 45.0},
            {"id": "prop-3", "score": 65.0},
            {"id": "prop-4", "score": 30.0},
        ]

        min_score = 50.0
        filtered = filter_by_score(properties, min_score)

        assert len(filtered) == 2
        assert all(prop["score"] >= min_score for prop in filtered)
        assert filtered[0]["id"] == "prop-1"
        assert filtered[1]["id"] == "prop-3"


class TestCohortAssignment:
    """Test cohort assignment for users"""

    def test_assign_cohort(self):
        """Test assigning user to cohort"""
        from app.services.search.home_matching.postprocessing.cohort_assigner import assign_cohort

        user_id = "user-123"
        cohort = assign_cohort(user_id)

        assert cohort in ["control", "treatment_a", "treatment_b"]
        # Same user should get same cohort
        cohort2 = assign_cohort(user_id)
        assert cohort == cohort2

    def test_cohort_distribution(self):
        """Test cohort assignment distribution"""
        from app.services.search.home_matching.postprocessing.cohort_assigner import assign_cohort

        cohorts = []
        for i in range(300):
            cohort = assign_cohort(f"user-{i}")
            cohorts.append(cohort)

        # Check distribution is reasonably balanced
        control_count = cohorts.count("control")
        treatment_a_count = cohorts.count("treatment_a")
        treatment_b_count = cohorts.count("treatment_b")

        # Each should be roughly 33% (with some variance)
        assert 60 < control_count < 140
        assert 60 < treatment_a_count < 140
        assert 60 < treatment_b_count < 140

    def test_get_blend_weight_by_cohort(self):
        """Test getting blend weight for cohort"""
        from app.services.search.home_matching.postprocessing.cohort_assigner import (
            get_blend_weight_for_cohort,
        )

        control_weight = get_blend_weight_for_cohort("control")
        treatment_a_weight = get_blend_weight_for_cohort("treatment_a")
        treatment_b_weight = get_blend_weight_for_cohort("treatment_b")

        assert 0.0 <= control_weight <= 1.0
        assert 0.0 <= treatment_a_weight <= 1.0
        assert 0.0 <= treatment_b_weight <= 1.0
        # Weights should be different between cohorts
        assert control_weight != treatment_a_weight or control_weight != treatment_b_weight
