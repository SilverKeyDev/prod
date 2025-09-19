#!/usr/bin/env python3
"""
Debug script for login issues
Run this to check environment variables and test login functionality
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment_variables():
    """Check if all required environment variables are set"""
    print("🔍 Checking environment variables...")
    
    required_vars = [
        'COGNITO_USER_POOL_ID',
        'COGNITO_CLIENT_ID', 
        'COGNITO_CLIENT_SECRET',
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
            print(f"❌ {var}: NOT SET")
        else:
            # Show partial value for security
            if 'SECRET' in var or 'KEY' in var:
                print(f"✅ {var}: {value[:10]}...{value[-4:] if len(value) > 14 else '***'}")
            else:
                print(f"✅ {var}: {value}")
    
    if missing_vars:
        print(f"\n❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("\n✅ All required environment variables are set")
        return True

def test_cognito_connection():
    """Test connection to AWS Cognito"""
    print("\n🔍 Testing Cognito connection...")
    
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        # Initialize Cognito client
        client = boto3.client(
            'cognito-idp',
            region_name=os.getenv('AWS_REGION', 'us-east-2')
        )
        
        # Try to describe the user pool
        user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
        response = client.describe_user_pool(UserPoolId=user_pool_id)
        
        print(f"✅ Cognito connection successful")
        print(f"   User Pool: {response['UserPool']['Name']}")
        print(f"   Pool ID: {user_pool_id}")
        print(f"   Region: {os.getenv('AWS_REGION', 'us-east-2')}")
        
        return True
        
    except ClientError as e:
        print(f"❌ Cognito connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_login_endpoint():
    """Test the login endpoint with invalid credentials"""
    print("\n🔍 Testing login endpoint...")
    
    try:
        # Test with invalid credentials
        url = "http://127.0.0.1:5000/api/v1/auth/login"
        payload = {
            "email": "test@example.com",
            "password": "bad"
        }
        
        print(f"   URL: {url}")
        print(f"   Payload: {payload}")
        
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        # Check if we get the expected 401 for invalid credentials
        if response.status_code == 401:
            print("✅ Login endpoint working correctly (401 for invalid credentials)")
            return True
        elif response.status_code == 500:
            print("❌ Login endpoint returning 500 error - this is the bug!")
            return False
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server - is it running?")
        return False
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_password_hash():
    """Test password hash verification"""
    print("\n🔍 Testing password hash verification...")
    
    try:
        from werkzeug.security import check_password_hash, generate_password_hash
        
        # Test with a known password
        test_password = "testpassword123"
        hashed = generate_password_hash(test_password)
        
        # Test correct password
        if check_password_hash(hashed, test_password):
            print("✅ Password hash verification working correctly")
        else:
            print("❌ Password hash verification failed")
            return False
            
        # Test incorrect password
        if not check_password_hash(hashed, "wrongpassword"):
            print("✅ Password hash correctly rejects wrong passwords")
        else:
            print("❌ Password hash incorrectly accepts wrong passwords")
            return False
            
        return True
        
    except ImportError:
        print("❌ werkzeug not available for password hash testing")
        return False
    except Exception as e:
        print(f"❌ Password hash test error: {e}")
        return False

def main():
    """Main debug function"""
    print("🚀 SilverKey Login Debug Script")
    print("=" * 50)
    
    # Check environment variables
    env_ok = check_environment_variables()
    
    # Test Cognito connection
    cognito_ok = test_cognito_connection()
    
    # Test password hash functionality
    hash_ok = test_password_hash()
    
    # Test login endpoint
    endpoint_ok = test_login_endpoint()
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    print(f"   Environment Variables: {'✅' if env_ok else '❌'}")
    print(f"   Cognito Connection: {'✅' if cognito_ok else '❌'}")
    print(f"   Password Hash: {'✅' if hash_ok else '❌'}")
    print(f"   Login Endpoint: {'✅' if endpoint_ok else '❌'}")
    
    if all([env_ok, cognito_ok, hash_ok, endpoint_ok]):
        print("\n🎉 All tests passed! Login should be working.")
    else:
        print("\n⚠️  Some tests failed. Check the issues above.")
        
    print("\n💡 Next steps:")
    print("   1. Run: journalctl -u gunicorn --no-pager -n 200 -f")
    print("   2. Trigger a login attempt")
    print("   3. Look for the phase logs in the output")

if __name__ == "__main__":
    main()
