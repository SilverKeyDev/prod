#!/usr/bin/env python3
"""
Test script to trigger login and capture detailed error information
"""

import os
import sys
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set AWS_REGION
os.environ['AWS_REGION'] = 'us-east-2'

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_login_directly():
    """Test login by calling the Cognito service directly"""
    print("🔍 Testing Cognito service directly...")
    
    try:
        from app.services.auth import cognito_service
        
        print("✅ Cognito service imported successfully")
        
        # Test with invalid credentials
        result = cognito_service.sign_in(
            username="test@example.com",
            password="bad"
        )
        
        print(f"📊 Cognito result: {result}")
        
        if result['success']:
            print("✅ Cognito authentication succeeded")
        else:
            print(f"❌ Cognito authentication failed: {result.get('error', 'unknown')}")
            print(f"   Message: {result.get('message', 'no message')}")
            print(f"   Login failed flag: {result.get('login_failed', False)}")
        
        return result
        
    except Exception as e:
        print(f"❌ Exception in Cognito service: {e}")
        print(f"   Type: {type(e).__name__}")
        print(f"   Traceback: {traceback.format_exc()}")
        return None

def test_login_route():
    """Test login by calling the route directly"""
    print("\n🔍 Testing login route directly...")
    
    try:
        from app import create_app
        from flask import json
        
        # Create app context
        app = create_app()
        
        with app.app_context():
            from app.routes.auth import auth_bp
            
            print("✅ Auth blueprint imported successfully")
            
            # Create a test request
            with app.test_client() as client:
                response = client.post('/api/v1/auth/login', 
                    json={'email': 'test@example.com', 'password': 'bad'},
                    content_type='application/json'
                )
                
                print(f"📊 Route response status: {response.status_code}")
                print(f"📊 Route response data: {response.get_json()}")
                
                return response.status_code, response.get_json()
                
    except Exception as e:
        print(f"❌ Exception in login route: {e}")
        print(f"   Type: {type(e).__name__}")
        print(f"   Traceback: {traceback.format_exc()}")
        return None, None

def main():
    """Main test function"""
    print("🚀 SilverKey Login Error Debug Script")
    print("=" * 50)
    
    # Test Cognito service directly
    cognito_result = test_login_directly()
    
    # Test login route
    status_code, response_data = test_login_route()
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    
    if cognito_result:
        print(f"   Cognito Service: {'✅ Working' if cognito_result.get('success') else '❌ Failed'}")
        if not cognito_result.get('success'):
            print(f"   Cognito Error: {cognito_result.get('error', 'unknown')}")
    else:
        print("   Cognito Service: ❌ Exception occurred")
    
    if status_code:
        print(f"   Login Route: {'✅ Working' if status_code == 401 else '❌ Failed'}")
        print(f"   Status Code: {status_code}")
        if response_data:
            print(f"   Error: {response_data.get('error', 'unknown')}")
    else:
        print("   Login Route: ❌ Exception occurred")

if __name__ == "__main__":
    main()
