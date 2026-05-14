"""
Tests for home matching MCDA scoring
"""


class TestMCDAScoring:
    """Test MCDA scoring algorithm"""

    def test_score_listing_basic(self, sample_preferences, sample_property):
        """Test basic scoring calculation"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        score = score_listing_mcda(
            preferences=sample_preferences,
            property_dict=sample_property,
            status_type="ForSale",
        )

        # Score should be between display_min and display_max
        assert 1.0 <= score <= 99.0
        # Score should be rounded to 1 decimal
        assert round(score, 1) == score

    def test_score_perfect_match(self):
        """Test scoring for perfect match property"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        preferences = {
            "price_min": 300000,
            "price_max": 400000,
            "preferred_bedrooms": 3,
            "preferred_bathrooms": 2,
            "preferred_sqft_min": 1800,
            "preferred_sqft_max": 2200,
        }

        property_dict = {
            "ListPrice": 350000,  # Right in range
            "BedroomsTotal": 3,  # Exact match
            "BathroomsTotalInteger": 2,  # Exact match
            "LivingArea": 2000,  # Right in range
            "PropertyType": "Residential",
            "DaysOnMarket": 10,
        }

        score = score_listing_mcda(preferences, property_dict)

        # Should have high score (above base)
        assert score > 50.0

    def test_score_over_budget(self):
        """Test scoring applies penalty for over-budget properties"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        preferences = {
            "price_min": 200000,
            "price_max": 300000,
            "preferred_bedrooms": 3,
            "preferred_bathrooms": 2,
        }

        property_dict = {
            "ListPrice": 450000,  # Way over budget
            "BedroomsTotal": 3,
            "BathroomsTotalInteger": 2,
            "LivingArea": 2000,
            "PropertyType": "Residential",
        }

        score = score_listing_mcda(preferences, property_dict)

        # Should have low score due to over-budget penalty
        assert score < 50.0

    def test_score_below_minimum_beds(self):
        """Test scoring applies penalty for insufficient bedrooms"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        preferences = {
            "price_max": 400000,
            "preferred_bedrooms_min": 3,
            "preferred_bathrooms": 2,
        }

        property_dict = {
            "ListPrice": 350000,
            "BedroomsTotal": 2,  # Below minimum
            "BathroomsTotalInteger": 2,
            "LivingArea": 2000,
            "PropertyType": "Residential",
        }

        score = score_listing_mcda(preferences, property_dict)

        # Should have reduced score due to beds constraint
        assert score < 50.0

    def test_score_wrong_property_type(self):
        """Test scoring applies penalty for wrong property type"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        preferences = {
            "price_max": 400000,
            "preferred_bedrooms": 3,
            "preferred_housing_type": "house",  # Want single family
        }

        property_dict = {
            "ListPrice": 350000,
            "BedroomsTotal": 3,
            "BathroomsTotalInteger": 2,
            "PropertyType": "Residential",
            "PropertySubType": "Condo",  # Different type
            "LivingArea": 2000,
        }

        score = score_listing_mcda(preferences, property_dict)

        # Should have penalty for wrong property type
        assert score < 60.0

    def test_score_with_commute_preference(self):
        """Test scoring considers commute time"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        preferences = {
            "price_max": 400000,
            "preferred_bedrooms": 3,
            "max_commute_minutes": 30,
            "important_locations": [
                {"lat": 40.7128, "lng": -74.006, "commute_tolerance": 30},
            ],
        }

        property_dict = {
            "ListPrice": 350000,
            "BedroomsTotal": 3,
            "BathroomsTotalInteger": 2,
            "LivingArea": 2000,
            "PropertyType": "Residential",
            "Latitude": 40.7128,
            "Longitude": -74.006,
            "commute_minutes": 5,
        }

        score = score_listing_mcda(preferences, property_dict)

        assert score > 45.0

    def test_score_with_amenities(self):
        """Test scoring considers nearby amenities"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        preferences = {
            "price_max": 400000,
            "preferred_bedrooms": 3,
            "preferred_amenities": ["schools", "parks", "shopping"],
        }

        property_dict = {
            "ListPrice": 350000,
            "BedroomsTotal": 3,
            "BathroomsTotalInteger": 2,
            "LivingArea": 2000,
            "PropertyType": "Residential",
            "nearby_amenities": ["schools", "parks", "shopping", "restaurants"],
            "amenity_score": 0.9,
        }

        score = score_listing_mcda(preferences, property_dict)

        assert score > 45.0

    def test_get_mcda_config(self):
        """Test getting MCDA configuration"""
        from app.services.search.home_matching.mcda.score import get_mcda_config

        config = get_mcda_config()

        assert isinstance(config, dict)
        assert "base_score" in config
        assert "soft_signal_weights" in config
        assert "hard_multipliers" in config
        assert config["base_score"] == 52.5

    def test_score_custom_config(self, sample_preferences, sample_property):
        """Test scoring with custom configuration"""
        from app.services.search.home_matching.mcda.score import score_listing_mcda

        custom_config = {
            "base_score": 60.0,
            "soft_signal_weights": {
                "price_fit": 20.0,
                "beds": 10.0,
                "baths": 10.0,
                "sqft": 8.0,
                "commute": 12.0,
                "amenities": 10.0,
                "lot_acres": 2.0,
                "home_age": 2.0,
                "days_on_market": 1.5,
                "walkability": 2.0,
                "listing_type_fit": 1.0,
            },
        }

        score = score_listing_mcda(
            preferences=sample_preferences,
            property_dict=sample_property,
            config=custom_config,
        )

        assert 1.0 <= score <= 99.0


class TestHardConstraints:
    """Test hard constraint multipliers"""

    def test_hard_constraint_multiplier(self):
        """Test hard constraint multiplier calculation"""
        from app.services.search.home_matching.mcda.criteria.hard_constraints import (
            hard_constraint_multiplier,
        )

        preferences = {
            "price_max": 300000,
            "preferred_bedrooms_min": 3,
            "preferred_bathrooms_min": 2,
        }

        property_dict = {
            "ListPrice": 450000,  # Over budget
            "BedroomsTotal": 2,  # Below min beds
            "BathroomsTotalInteger": 2,
            "PropertyType": "Residential",
        }

        multipliers = {
            "over_budget_moderate": 0.55,
            "over_budget_severe": 0.42,
            "over_budget_extreme": 0.30,
            "below_min_beds": 0.35,
            "below_min_baths": 0.35,
            "wrong_property_type": 0.45,
            "below_min_sqft": 0.50,
            "above_max_sqft": 0.52,
            "multiplier_floor": 0.15,
        }

        multiplier = hard_constraint_multiplier(preferences, property_dict, "ForSale", multipliers)

        # Should have penalties applied
        assert 0.15 <= multiplier <= 1.0
        assert multiplier < 0.5  # Multiple constraints violated


class TestSoftSignals:
    """Test soft signal calculations"""

    def test_price_fit_signal(self):
        """Test price fit normalization"""
        from app.services.search.home_matching.mcda.criteria.price import soft_price_normalized

        preferences = {"price_min": 200000, "price_max": 400000}

        # Property at ideal price (65% of range)
        property_dict = {"ListPrice": 330000}
        signal = soft_price_normalized(preferences, property_dict, "ForSale", 0.65)
        assert 0.0 <= signal <= 1.0
        assert signal >= 0.49

    def test_beds_fit_signal(self):
        """Test bedrooms fit normalization"""
        from app.services.search.home_matching.mcda.criteria.beds_baths import soft_beds_normalized

        preferences = {"preferred_bedrooms": 3}

        # Exact match
        property_dict = {"BedroomsTotal": 3}
        signal = soft_beds_normalized(preferences, property_dict, 0.45)
        assert signal >= 0.5  # Should be good fit

    def test_commute_fit_signal(self):
        """Test commute time normalization"""
        from app.services.search.home_matching.mcda.criteria.commute import soft_commute_normalized

        preferences = {"max_commute_minutes": 30}

        # Property with short commute
        property_dict = {"commute_minutes": 15}
        signal = soft_commute_normalized(preferences, property_dict)
        assert 0.0 <= signal <= 1.0
        assert signal >= 0.49

    def test_sqft_fit_signal(self):
        """Test square footage fit normalization"""
        from app.services.search.home_matching.mcda.criteria.sqft import soft_sqft_normalized

        preferences = {"preferred_sqft_min": 1500, "preferred_sqft_max": 2500}

        # Property in range
        property_dict = {"LivingArea": 2000}
        signal = soft_sqft_normalized(preferences, property_dict)
        assert 0.0 <= signal <= 1.0
        assert signal >= 0.49  # In range is good
