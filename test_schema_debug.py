#!/usr/bin/env python3
"""
Debug script to identify missing schema definitions causing Perplexity API rejection
"""

import sys
import os
sys.path.append('/Users/jaycewalzer/Desktop/SilverKey/Server')

from app.models.report_models import FullReport
from app.services.schema_generator import generate_report_schema
import json

def test_schema_generation():
    """Test schema generation and identify missing definitions"""
    
    # Test user preferences and report customization
    user_preferences = {
        'lifestyle_type': 'laid-back',
        'age': 30,
        'gender': 'Female',
        'income_range': '$50,000-$75,000'
    }
    
    report_customization = {
        'report_section_priorities': [
            'neighborhood_overview', 'culture_and_events', 'safety', 'weather',
            'social_character', 'local_amenities', 'commute', 'family_friendly',
            'nightlife_and_dating', 'accessibility', 'development', 'schools', 'extra_tips'
        ]
    }
    
    print("🔍 Testing FullReport schema generation...")
    
    # Generate the full schema from FullReport
    full_schema = FullReport.schema()
    print(f"✅ Full schema generated with {len(full_schema.get('$defs', {}))} definitions")
    print(f"📋 Full schema $defs keys: {list(full_schema.get('$defs', {}).keys())}")
    
    # Check for missing nested models
    expected_nested_models = [
        'GenderDistribution', 'RacialDistribution', 'AgeDistribution', 'LifestyleDNA',
        'AppsPopularity', 'SchoolInfo', 'Restaurant', 'Activity', 'Park', 'Amenity',
        'UtilityCosts'
    ]
    
    missing_models = []
    for model in expected_nested_models:
        if model not in full_schema.get('$defs', {}):
            missing_models.append(model)
    
    if missing_models:
        print(f"❌ Missing nested models in full schema: {missing_models}")
    else:
        print("✅ All expected nested models found in full schema")
    
    # Test the schema generator
    print("\n🔍 Testing schema generator...")
    try:
        generated_schema = generate_report_schema(report_customization, user_preferences)
        print(f"✅ Generated schema with {len(generated_schema.get('$defs', {}))} definitions")
        print(f"📋 Generated schema $defs keys: {list(generated_schema.get('$defs', {}).keys())}")
        
        # Check for missing nested models in generated schema
        missing_in_generated = []
        for model in expected_nested_models:
            if model not in generated_schema.get('$defs', {}):
                missing_in_generated.append(model)
        
        if missing_in_generated:
            print(f"❌ Missing nested models in generated schema: {missing_in_generated}")
        else:
            print("✅ All expected nested models found in generated schema")
            
        # Check for conflicting allOf + type definitions
        print("\n🔍 Checking for conflicting definitions...")
        conflicts_found = []
        
        for prop_name, prop_schema in generated_schema.get('properties', {}).items():
            if 'allOf' in prop_schema and 'type' in prop_schema:
                conflicts_found.append(f"Property '{prop_name}' has both allOf and type")
        
        for def_name, def_schema in generated_schema.get('$defs', {}).items():
            if 'properties' in def_schema:
                for prop_name, prop_schema in def_schema['properties'].items():
                    if 'allOf' in prop_schema and 'type' in prop_schema:
                        conflicts_found.append(f"Definition '{def_name}.{prop_name}' has both allOf and type")
        
        if conflicts_found:
            print(f"❌ Schema conflicts found:")
            for conflict in conflicts_found:
                print(f"   - {conflict}")
        else:
            print("✅ No schema conflicts found")
            
    except Exception as e:
        print(f"❌ Schema generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_schema_generation()
