import unittest
from unittest.mock import patch, MagicMock, Mock
import pytest
import requests
import json
import sys
import os

# Add the parent directory to the path to import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.scrapers.age_data import (
    get_zip_from_address,
    fetch_age_table_by_zip,
    parse_age_distribution,
    get_age_distribution,
    get_population_total,
    AGE_GROUP_KEYS
)


class TestAgeData(unittest.TestCase):
    """Comprehensive test suite for age_data.py module."""

    def setUp(self):
        """Set up test fixtures."""
        self.sample_address = "123 Main St, Anytown, CA 90210"
        self.sample_zip = "90210"
        
        # Mock Google Geocoding API response
        self.mock_geocoding_response = {
            "status": "OK",
            "results": [{
                "address_components": [
                    {
                        "long_name": "90210",
                        "short_name": "90210",
                        "types": ["postal_code"]
                    },
                    {
                        "long_name": "California",
                        "short_name": "CA",
                        "types": ["administrative_area_level_1", "political"]
                    }
                ]
            }]
        }
        
        # Mock Census API response
        self.mock_census_response = [
            [
                "NAME",
                "S0101_C01_001E",  # Total population
                "S0101_C01_002E", "S0101_C01_003E", "S0101_C01_004E", "S0101_C01_005E", "S0101_C01_006E",  # 0-19
                "S0101_C01_007E", "S0101_C01_008E",  # 20-34
                "S0101_C01_009E", "S0101_C01_010E",  # 35-49
                "S0101_C01_011E", "S0101_C01_012E",  # 50-64
                "S0101_C01_013E", "S0101_C01_014E", "S0101_C01_015E",  # 65+
                "zip code tabulation area"
            ],
            [
                "ZCTA5 90210",
                "25000",  # Total population
                "500", "600", "700", "800", "400",  # 0-19: 3000 total
                "1200", "800",  # 20-34: 2000 total
                "1500", "1000",  # 35-49: 2500 total
                "1000", "500",  # 50-64: 1500 total
                "800", "200", "0",  # 65+: 1000 total
                "90210"
            ]
        ]

    # Tests for get_zip_from_address function
    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.GOOGLE_MAPS_API_KEY', 'test_api_key')
    def test_get_zip_from_address_success(self, mock_get):
        """Test successful ZIP code extraction from address."""
        mock_response = Mock()
        mock_response.json.return_value = self.mock_geocoding_response
        mock_response.url = "https://test.url"
        mock_get.return_value = mock_response
        
        result = get_zip_from_address(self.sample_address)
        
        self.assertEqual(result, "90210")
        mock_get.assert_called_once()
        
    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.GOOGLE_MAPS_API_KEY', 'test_api_key')
    def test_get_zip_from_address_geocoding_failed(self, mock_get):
        """Test geocoding failure handling."""
        mock_response = Mock()
        mock_response.json.return_value = {"status": "ZERO_RESULTS"}
        mock_response.url = "https://test.url"
        mock_get.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            get_zip_from_address(self.sample_address)
        
        self.assertIn("Geocoding failed: ZERO_RESULTS", str(context.exception))
        
    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.GOOGLE_MAPS_API_KEY', 'test_api_key')
    def test_get_zip_from_address_no_postal_code(self, mock_get):
        """Test handling when no postal code is found."""
        mock_response_no_zip = {
            "status": "OK",
            "results": [{
                "address_components": [
                    {
                        "long_name": "California",
                        "short_name": "CA",
                        "types": ["administrative_area_level_1", "political"]
                    }
                ]
            }]
        }
        
        mock_response = Mock()
        mock_response.json.return_value = mock_response_no_zip
        mock_response.url = "https://test.url"
        mock_get.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            get_zip_from_address(self.sample_address)
        
        self.assertIn("ZIP code not found", str(context.exception))

    @patch('app.scrapers.age_data.GOOGLE_MAPS_API_KEY', None)
    def test_get_zip_from_address_missing_api_key(self):
        """Test handling when Google Maps API key is missing."""
        with self.assertRaises(ValueError) as context:
            get_zip_from_address(self.sample_address)
        
        self.assertIn("GOOGLE_MAPS_API_KEY is missing", str(context.exception))

    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.GOOGLE_MAPS_API_KEY', 'test_api_key')
    def test_get_zip_from_address_network_error(self, mock_get):
        """Test handling of network errors during geocoding."""
        mock_get.side_effect = requests.RequestException("Network error")
        
        with self.assertRaises(requests.RequestException):
            get_zip_from_address(self.sample_address)

    # Tests for fetch_age_table_by_zip function
    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.CENSUS_API_KEY', 'test_census_key')
    def test_fetch_age_table_by_zip_success(self, mock_get):
        """Test successful Census data fetching."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_census_response
        mock_response.text = json.dumps(self.mock_census_response)
        mock_response.url = "https://test.census.url"
        mock_get.return_value = mock_response
        
        result = fetch_age_table_by_zip(self.sample_zip)
        
        self.assertEqual(result, self.mock_census_response)
        mock_get.assert_called_once()

    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.CENSUS_API_KEY', 'test_census_key')
    def test_fetch_age_table_by_zip_api_error(self, mock_get):
        """Test handling of Census API errors."""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_response.url = "https://test.census.url"
        mock_get.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            fetch_age_table_by_zip(self.sample_zip)
        
        self.assertIn("Census API returned status 404", str(context.exception))

    @patch('app.scrapers.age_data.requests.get')
    @patch('app.scrapers.age_data.CENSUS_API_KEY', 'test_census_key')
    def test_fetch_age_table_by_zip_empty_response(self, mock_get):
        """Test handling of empty Census API response."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_response.url = "https://test.census.url"
        mock_get.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            fetch_age_table_by_zip(self.sample_zip)
        
        self.assertIn("Census API returned empty response", str(context.exception))

    @patch('app.scrapers.age_data.CENSUS_API_KEY', None)
    def test_fetch_age_table_by_zip_missing_api_key(self):
        """Test handling when Census API key is missing."""
        with self.assertRaises(ValueError) as context:
            fetch_age_table_by_zip(self.sample_zip)
        
        self.assertIn("CENSUS_API_KEY is missing", str(context.exception))

    # Tests for parse_age_distribution function
    def test_parse_age_distribution_success(self):
        """Test successful age distribution parsing."""
        result = parse_age_distribution(self.mock_census_response)
        
        expected = {
            "0-19": 12,    # 3000/25000 * 100 = 12%
            "20-34": 8,    # 2000/25000 * 100 = 8%
            "35-49": 10,   # 2500/25000 * 100 = 10%
            "50-64": 6,    # 1500/25000 * 100 = 6%
            "65+": 4       # 1000/25000 * 100 = 4%
        }
        
        self.assertEqual(result, expected)

    def test_parse_age_distribution_missing_data(self):
        """Test parsing with missing age group data."""
        incomplete_data = [
            ["NAME", "S0101_C01_001E", "S0101_C01_002E"],
            ["ZCTA5 90210", "10000", "500"]
        ]
        
        result = parse_age_distribution(incomplete_data)
        
        # Should handle missing keys gracefully (defaulting to 0)
        self.assertIsInstance(result, dict)
        self.assertIn("0-19", result)

    def test_parse_age_distribution_invalid_data(self):
        """Test parsing with invalid data structure."""
        invalid_data = [["header"], ["incomplete"]]
        
        with self.assertRaises(Exception):
            parse_age_distribution(invalid_data)

    def test_parse_age_distribution_zero_population(self):
        """Test parsing with zero total population."""
        zero_pop_data = [
            ["NAME", "S0101_C01_001E", "S0101_C01_002E"],
            ["ZCTA5 90210", "0", "500"]
        ]
        
        with self.assertRaises(ZeroDivisionError):
            parse_age_distribution(zero_pop_data)

    # Tests for get_age_distribution function
    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    @patch('app.scrapers.age_data.parse_age_distribution')
    def test_get_age_distribution_success(self, mock_parse, mock_fetch, mock_get_zip):
        """Test successful end-to-end age distribution lookup."""
        mock_get_zip.return_value = self.sample_zip
        mock_fetch.return_value = self.mock_census_response
        mock_parse.return_value = {"0-19": 12, "20-34": 8}
        
        result = get_age_distribution(self.sample_address)
        
        self.assertEqual(result, {"0-19": 12, "20-34": 8})
        mock_get_zip.assert_called_once_with(self.sample_address)
        mock_fetch.assert_called_once_with(self.sample_zip)
        mock_parse.assert_called_once_with(self.mock_census_response)

    @patch('app.scrapers.age_data.get_zip_from_address')
    def test_get_age_distribution_error_handling(self, mock_get_zip):
        """Test error handling in get_age_distribution."""
        mock_get_zip.side_effect = Exception("Geocoding failed")
        
        result = get_age_distribution(self.sample_address)
        
        self.assertIn("error", result)
        self.assertIn("address", result)
        self.assertEqual(result["address"], self.sample_address)
        self.assertIn("Geocoding failed", result["error"])

    # Tests for get_population_total function
    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    def test_get_population_total_success(self, mock_fetch, mock_get_zip):
        """Test successful population total lookup."""
        mock_get_zip.return_value = self.sample_zip
        mock_fetch.return_value = self.mock_census_response
        
        result = get_population_total(self.sample_address)
        
        expected = {
            "zip_code": "90210",
            "total_population": 25000
        }
        
        self.assertEqual(result, expected)
        mock_get_zip.assert_called_once_with(self.sample_address)
        mock_fetch.assert_called_once_with(self.sample_zip)

    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    def test_get_population_total_float_population(self, mock_fetch, mock_get_zip):
        """Test population total with float values from Census."""
        mock_get_zip.return_value = self.sample_zip
        
        # Census data with float population value
        float_census_data = [
            ["NAME", "S0101_C01_001E", "zip code tabulation area"],
            ["ZCTA5 90210", "25000.5", "90210"]
        ]
        mock_fetch.return_value = float_census_data
        
        result = get_population_total(self.sample_address)
        
        expected = {
            "zip_code": "90210",
            "total_population": 25000  # Should be converted to int
        }
        
        self.assertEqual(result, expected)

    @patch('app.scrapers.age_data.get_zip_from_address')
    def test_get_population_total_geocoding_error(self, mock_get_zip):
        """Test error handling when geocoding fails."""
        mock_get_zip.side_effect = Exception("Geocoding failed")
        
        result = get_population_total(self.sample_address)
        
        self.assertIn("error", result)
        self.assertIn("address", result)
        self.assertEqual(result["address"], self.sample_address)
        self.assertIn("Geocoding failed", result["error"])

    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    def test_get_population_total_census_error(self, mock_fetch, mock_get_zip):
        """Test error handling when Census API fails."""
        mock_get_zip.return_value = self.sample_zip
        mock_fetch.side_effect = Exception("Census API error")
        
        result = get_population_total(self.sample_address)
        
        self.assertIn("error", result)
        self.assertIn("address", result)
        self.assertEqual(result["address"], self.sample_address)
        self.assertIn("Census API error", result["error"])

    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    def test_get_population_total_missing_population_field(self, mock_fetch, mock_get_zip):
        """Test error handling when population field is missing from Census data."""
        mock_get_zip.return_value = self.sample_zip
        
        # Census data without population field
        incomplete_census_data = [
            ["NAME", "zip code tabulation area"],
            ["ZCTA5 90210", "90210"]
        ]
        mock_fetch.return_value = incomplete_census_data
        
        result = get_population_total(self.sample_address)
        
        self.assertIn("error", result)
        self.assertIn("address", result)

    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    def test_get_population_total_invalid_population_value(self, mock_fetch, mock_get_zip):
        """Test error handling when population value is not numeric."""
        mock_get_zip.return_value = self.sample_zip
        
        # Census data with non-numeric population
        invalid_census_data = [
            ["NAME", "S0101_C01_001E", "zip code tabulation area"],
            ["ZCTA5 90210", "invalid_number", "90210"]
        ]
        mock_fetch.return_value = invalid_census_data
        
        result = get_population_total(self.sample_address)
        
        self.assertIn("error", result)
        self.assertIn("address", result)

    @patch('app.scrapers.age_data.get_zip_from_address')
    @patch('app.scrapers.age_data.fetch_age_table_by_zip')
    def test_get_population_total_empty_census_data(self, mock_fetch, mock_get_zip):
        """Test error handling when Census returns empty data."""
        mock_get_zip.return_value = self.sample_zip
        mock_fetch.return_value = []
        
        result = get_population_total(self.sample_address)
        
        self.assertIn("error", result)
        self.assertIn("address", result)

    # Tests for AGE_GROUP_KEYS constant
    def test_age_group_keys_structure(self):
        """Test that AGE_GROUP_KEYS has the expected structure."""
        expected_groups = ["0-19", "20-34", "35-49", "50-64", "65+"]
        
        self.assertEqual(list(AGE_GROUP_KEYS.keys()), expected_groups)
        
        # Each group should have a list of Census variable keys
        for group, keys in AGE_GROUP_KEYS.items():
            self.assertIsInstance(keys, list)
            self.assertGreater(len(keys), 0)
            
            # Each key should be a Census variable identifier
            for key in keys:
                self.assertIsInstance(key, str)
                self.assertTrue(key.startswith("S0101_C01_"))
                self.assertTrue(key.endswith("E"))


if __name__ == '__main__':
    unittest.main()
