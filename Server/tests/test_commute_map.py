"""
Test suite for commute map functionality in graphic_generation.py

This module tests the commute map generation features including:
- Static map URL generation
- Map image saving and buffering
- User preferences parsing
- Error handling and edge cases
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import json
from io import BytesIO
import sys
import os

# Add the parent directory to the path to import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.graphic_generation import (
    generate_static_map_url,
    save_map_as_image,
    save_map_as_buffer,
    generate_commute_map
)


class TestCommuteMapFunctions(unittest.TestCase):
    """Test cases for commute map functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.api_key = "test_api_key"
        self.primary_address = "123 Main St, New York, NY"
        self.sample_locations = [
            {"name": "Work", "address": "456 Business Ave, New York, NY"},
            {"name": "Gym", "address": "789 Fitness Blvd, New York, NY"},
            {"name": "School", "address": "321 Education St, New York, NY"}
        ]
        
        # Sample user preferences in different formats
        self.user_preferences_dict = {
            "important_locations": json.dumps(self.sample_locations)
        }
        
        self.user_preferences_object = Mock()
        self.user_preferences_object.important_locations = json.dumps(self.sample_locations)
        
        self.user_preferences_list = {
            "important_locations": self.sample_locations
        }

    def test_generate_static_map_url_basic(self):
        """Test basic static map URL generation."""
        url = generate_static_map_url(
            self.primary_address,
            self.sample_locations,
            self.api_key
        )
        
        # Check that URL contains expected components
        self.assertIn("https://maps.googleapis.com/maps/api/staticmap", url)
        self.assertIn("size=800x600", url)
        self.assertIn("maptype=roadmap", url)
        self.assertIn(f"key={self.api_key}", url)
        
        # Check that addresses are included
        self.assertIn("123+Main+St", url)  # URL encoded
        self.assertIn("456+Business+Ave", url)
        
        # Check that markers are included
        self.assertIn("markers=", url)
        self.assertIn("path=", url)

    def test_generate_static_map_url_empty_locations(self):
        """Test static map URL generation with empty locations."""
        url = generate_static_map_url(
            self.primary_address,
            [],
            self.api_key
        )
        
        # Should still generate URL with primary address
        self.assertIn("https://maps.googleapis.com/maps/api/staticmap", url)
        self.assertIn("123+Main+St", url)

    def test_generate_static_map_url_multiple_locations(self):
        """Test static map URL generation with multiple locations."""
        many_locations = [
            {"name": f"Location {i}", "address": f"{i} Test St, NY"}
            for i in range(10)
        ]
        
        url = generate_static_map_url(
            self.primary_address,
            many_locations,
            self.api_key
        )
        
        # Should handle multiple locations
        self.assertIn("https://maps.googleapis.com/maps/api/staticmap", url)
        # Check for multiple markers (A, B, C, D, etc.)
        self.assertIn("label%3AA", url)  # Primary marker
        self.assertIn("label%3AB", url)  # First secondary marker

    @patch('app.services.graphic_generation.requests.get')
    @patch('app.services.graphic_generation.Image.open')
    def test_save_map_as_image_success(self, mock_image_open, mock_requests_get):
        """Test successful map image saving."""
        # Mock successful HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_image_data"
        mock_requests_get.return_value = mock_response
        
        # Mock PIL Image
        mock_img = Mock()
        mock_image_open.return_value = mock_img
        
        result = save_map_as_image("http://test.com/map", "test_map.png")
        
        self.assertTrue(result)
        mock_requests_get.assert_called_once_with("http://test.com/map", timeout=30)
        mock_img.save.assert_called_once_with("test_map.png")

    @patch('app.services.graphic_generation.requests.get')
    def test_save_map_as_image_http_error(self, mock_requests_get):
        """Test map image saving with HTTP error."""
        # Mock failed HTTP response
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_requests_get.return_value = mock_response
        
        result = save_map_as_image("http://test.com/map", "test_map.png")
        
        self.assertFalse(result)

    @patch('app.services.graphic_generation.requests.get')
    def test_save_map_as_image_exception(self, mock_requests_get):
        """Test map image saving with exception."""
        # Mock exception
        mock_requests_get.side_effect = Exception("Network error")
        
        result = save_map_as_image("http://test.com/map", "test_map.png")
        
        self.assertFalse(result)

    @patch('app.services.graphic_generation.requests.get')
    def test_save_map_as_buffer_success(self, mock_requests_get):
        """Test successful map buffer creation."""
        # Mock successful HTTP response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_image_data"
        mock_requests_get.return_value = mock_response
        
        result = save_map_as_buffer("http://test.com/map")
        
        self.assertIsInstance(result, BytesIO)
        self.assertEqual(result.getvalue(), b"fake_image_data")
        mock_requests_get.assert_called_once_with("http://test.com/map", timeout=30)

    @patch('app.services.graphic_generation.requests.get')
    def test_save_map_as_buffer_http_error(self, mock_requests_get):
        """Test map buffer creation with HTTP error."""
        # Mock failed HTTP response
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Server Error"
        mock_requests_get.return_value = mock_response
        
        result = save_map_as_buffer("http://test.com/map")
        
        self.assertIsNone(result)

    @patch('app.services.graphic_generation.save_map_as_buffer')
    @patch('app.services.graphic_generation.generate_static_map_url')
    def test_generate_commute_map_dict_preferences(self, mock_generate_url, mock_save_buffer):
        """Test commute map generation with dictionary user preferences."""
        mock_generate_url.return_value = "http://test.com/map"
        mock_buffer = BytesIO(b"test_map_data")
        mock_save_buffer.return_value = mock_buffer
        
        result = generate_commute_map(
            self.primary_address,
            self.user_preferences_dict,
            self.api_key
        )
        
        self.assertEqual(result, mock_buffer)
        mock_generate_url.assert_called_once_with(
            self.primary_address,
            self.sample_locations,
            self.api_key
        )

    @patch('app.services.graphic_generation.save_map_as_buffer')
    @patch('app.services.graphic_generation.generate_static_map_url')
    def test_generate_commute_map_object_preferences(self, mock_generate_url, mock_save_buffer):
        """Test commute map generation with object user preferences."""
        mock_generate_url.return_value = "http://test.com/map"
        mock_buffer = BytesIO(b"test_map_data")
        mock_save_buffer.return_value = mock_buffer
        
        result = generate_commute_map(
            self.primary_address,
            self.user_preferences_object,
            self.api_key
        )
        
        self.assertEqual(result, mock_buffer)
        mock_generate_url.assert_called_once()

    @patch('app.services.graphic_generation.save_map_as_buffer')
    @patch('app.services.graphic_generation.generate_static_map_url')
    def test_generate_commute_map_list_preferences(self, mock_generate_url, mock_save_buffer):
        """Test commute map generation with list user preferences."""
        mock_generate_url.return_value = "http://test.com/map"
        mock_buffer = BytesIO(b"test_map_data")
        mock_save_buffer.return_value = mock_buffer
        
        result = generate_commute_map(
            self.primary_address,
            self.user_preferences_list,
            self.api_key
        )
        
        self.assertEqual(result, mock_buffer)
        mock_generate_url.assert_called_once_with(
            self.primary_address,
            self.sample_locations,
            self.api_key
        )

    def test_generate_commute_map_no_preferences(self):
        """Test commute map generation with no user preferences."""
        result = generate_commute_map(
            self.primary_address,
            None,
            self.api_key
        )
        
        self.assertIsNone(result)

    def test_generate_commute_map_empty_preferences(self):
        """Test commute map generation with empty user preferences."""
        result = generate_commute_map(
            self.primary_address,
            {},
            self.api_key
        )
        
        self.assertIsNone(result)

    def test_generate_commute_map_no_important_locations(self):
        """Test commute map generation with no important locations."""
        preferences = {"other_field": "value"}
        
        result = generate_commute_map(
            self.primary_address,
            preferences,
            self.api_key
        )
        
        self.assertIsNone(result)

    def test_generate_commute_map_invalid_json(self):
        """Test commute map generation with invalid JSON in important_locations."""
        preferences = {"important_locations": "invalid json string"}
        
        result = generate_commute_map(
            self.primary_address,
            preferences,
            self.api_key
        )
        
        self.assertIsNone(result)

    def test_generate_commute_map_malformed_locations(self):
        """Test commute map generation with malformed location data."""
        malformed_locations = [
            {"name": "Work"},  # Missing address
            {"address": "123 Test St"},  # Missing name
            {"name": "Gym", "address": "456 Fitness Ave"},  # Valid
            "invalid_location",  # Not a dict
        ]
        
        preferences = {"important_locations": malformed_locations}
        
        with patch('app.services.graphic_generation.save_map_as_buffer') as mock_save_buffer:
            with patch('app.services.graphic_generation.generate_static_map_url') as mock_generate_url:
                mock_generate_url.return_value = "http://test.com/map"
                mock_buffer = BytesIO(b"test_map_data")
                mock_save_buffer.return_value = mock_buffer
                
                result = generate_commute_map(
                    self.primary_address,
                    preferences,
                    self.api_key
                )
                
                # Should only process the valid location
                self.assertEqual(result, mock_buffer)
                mock_generate_url.assert_called_once()
                called_locations = mock_generate_url.call_args[0][1]
                self.assertEqual(len(called_locations), 1)
                self.assertEqual(called_locations[0]["name"], "Gym")

    @patch('app.services.graphic_generation.save_map_as_buffer')
    @patch('app.services.graphic_generation.generate_static_map_url')
    def test_generate_commute_map_limit_locations(self, mock_generate_url, mock_save_buffer):
        """Test that commute map generation limits to 5 locations."""
        # Create 10 locations
        many_locations = [
            {"name": f"Location {i}", "address": f"{i} Test St, NY"}
            for i in range(10)
        ]
        
        preferences = {"important_locations": many_locations}
        mock_generate_url.return_value = "http://test.com/map"
        mock_buffer = BytesIO(b"test_map_data")
        mock_save_buffer.return_value = mock_buffer
        
        result = generate_commute_map(
            self.primary_address,
            preferences,
            self.api_key
        )
        
        self.assertEqual(result, mock_buffer)
        mock_generate_url.assert_called_once()
        
        # Check that only 5 locations were passed
        called_locations = mock_generate_url.call_args[0][1]
        self.assertEqual(len(called_locations), 5)

    @patch('app.services.graphic_generation.save_map_as_buffer')
    @patch('app.services.graphic_generation.generate_static_map_url')
    def test_generate_commute_map_exception_handling(self, mock_generate_url, mock_save_buffer):
        """Test commute map generation exception handling."""
        mock_generate_url.side_effect = Exception("Map generation failed")
        
        result = generate_commute_map(
            self.primary_address,
            self.user_preferences_dict,
            self.api_key
        )
        
        self.assertIsNone(result)

    def test_url_encoding_special_characters(self):
        """Test that special characters in addresses are properly URL encoded."""
        special_address = "123 Main St & Broadway, New York, NY 10001"
        special_locations = [
            {"name": "Café", "address": "456 Café St, New York, NY"}
        ]
        
        url = generate_static_map_url(special_address, special_locations, self.api_key)
        
        # Check that special characters are encoded
        self.assertIn("%26", url)  # & encoded
        self.assertIn("Caf%C3%A9", url)  # é encoded


class TestCommuteMapIntegration(unittest.TestCase):
    """Integration tests for commute map functionality."""

    def setUp(self):
        """Set up integration test fixtures."""
        self.api_key = "test_api_key"
        self.primary_address = "123 Main St, New York, NY"

    @patch('app.services.graphic_generation.requests.get')
    def test_end_to_end_commute_map_generation(self, mock_requests_get):
        """Test end-to-end commute map generation."""
        # Mock successful HTTP response for map image
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_map_image_data"
        mock_requests_get.return_value = mock_response
        
        # User preferences with important locations
        user_preferences = {
            "important_locations": json.dumps([
                {"name": "Work", "address": "456 Business Ave, New York, NY"},
                {"name": "Gym", "address": "789 Fitness Blvd, New York, NY"}
            ])
        }
        
        # Generate commute map
        result = generate_commute_map(
            self.primary_address,
            user_preferences,
            self.api_key
        )
        
        # Verify result
        self.assertIsInstance(result, BytesIO)
        self.assertEqual(result.getvalue(), b"fake_map_image_data")
        
        # Verify HTTP request was made
        mock_requests_get.assert_called_once()
        called_url = mock_requests_get.call_args[0][0]
        self.assertIn("https://maps.googleapis.com/maps/api/staticmap", called_url)


if __name__ == '__main__':
    # Configure logging for tests
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Run the tests
    unittest.main(verbosity=2)
