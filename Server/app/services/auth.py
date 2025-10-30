import boto3
import os
import logging
import hmac
import hashlib
import base64
import json
import time
import random
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from flask import current_app

logger = logging.getLogger(__name__)

class CognitoService:
    def __init__(self):
        from app.config import Config
        
        # Initialize with explicit region from config
        self.region = Config.AWS_REGION
        self.client = boto3.client(
            'cognito-idp', 
            region_name=self.region,
            config=boto3.session.Config(
                read_timeout=Config.AWS_COGNITO_TIMEOUT,
                connect_timeout=Config.AWS_COGNITO_TIMEOUT,
                retries={'max_attempts': 3}
            )
        )
        self.user_pool_id = os.getenv('AWS_COGNITO_USER_POOL_ID')
        self.client_id = os.getenv('AWS_COGNITO_CLIENT_ID')
        self.client_secret = os.getenv('AWS_COGNITO_CLIENT_SECRET')

    def sign_up(self, username, password, user_attributes):
        """Register a new user"""
        try:
            response = self.client.sign_up(
                ClientId=self.client_id,
                SecretHash=self._get_secret_hash(username),
                Username=username,
                Password=password,
                UserAttributes=user_attributes
            )
            return {
                'success': True,
                'user_sub': response['UserSub'],
                'code_delivery': response['CodeDeliveryDetails']
            }
        except ClientError as e:
            logger.error(f"Error signing up user: {e}")
            return {
                'success': False,
                'error': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def confirm_sign_up(self, username, confirmation_code):
        """Confirm user registration with verification code"""
        try:
            self.client.confirm_sign_up(
                ClientId=self.client_id,
                SecretHash=self._get_secret_hash(username),
                Username=username,
                ConfirmationCode=confirmation_code
            )
            return {'success': True}
        except ClientError as e:
            logger.error(f"Error confirming sign up: {e}")
            return {
                'success': False,
                'error': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def sign_in(self, username, password):
        """Authenticate user and get tokens"""
        request_id = f"AWS_COGNITO_signin_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        start_time = time.time()
        
        try:
            # Validate inputs
            if not username:
                logger.error(f"AWS_COGNITO_SIGNIN_VALIDATION_ERROR", extra={
                    'request_id': request_id,
                    'error': 'Missing username',
                    'duration_ms': int((time.time() - start_time) * 1000)
                })
                return {
                    'success': False,
                    'error': 'MISSING_USERNAME',
                    'message': 'Username is required',
                    'login_failed': True
                }
            
            if not password:
                logger.error(f"AWS_COGNITO_SIGNIN_VALIDATION_ERROR", extra={
                    'request_id': request_id,
                    'error': 'Missing password',
                    'duration_ms': int((time.time() - start_time) * 1000)
                })
                return {
                    'success': False,
                    'error': 'MISSING_PASSWORD',
                    'message': 'Password is required',
                    'login_failed': True
                }

            # Generate secret hash
            try:
                secret_hash = self._get_secret_hash(username)
                logger.debug(f"AWS_COGNITO_SECRET_HASH_GENERATED", extra={
                    'request_id': request_id,
                    'secret_hash_length': len(secret_hash)
                })
            except Exception as hash_error:
                logger.error(f"AWS_COGNITO_SECRET_HASH_ERROR", extra={
                    'request_id': request_id,
                    'error': str(hash_error),
                    'duration_ms': int((time.time() - start_time) * 1000)
                })
                return {
                    'success': False,
                    'error': 'SECRET_HASH_ERROR',
                    'message': 'Failed to generate authentication hash',
                    'login_failed': True
                }

            auth_params = {
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            }
            
            response = self.client.initiate_auth(
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters=auth_params,
                ClientId=self.client_id
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            return {
                'success': True,
                'tokens': response['AuthenticationResult']
            }
        except ClientError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"AWS_COGNITO_SIGNIN_CLIENT_ERROR", extra={
                'request_id': request_id,
                'error_code': error_code,
                'error_message': error_message,
                'http_status_code': e.response.get('ResponseMetadata', {}).get('HTTPStatusCode', 'unknown'),
                'request_id_cognito': e.response.get('ResponseMetadata', {}).get('RequestId', 'unknown'),
                'duration_ms': duration_ms,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Handle specific error cases
            if error_code == 'NotAuthorizedException':
                logger.warning(f"AWS_COGNITO_SIGNIN_UNAUTHORIZED", extra={
                    'request_id': request_id,
                    'username': username[:3] + '***' + username[-3:] if username else 'missing',
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': error_code,
                    'message': 'Incorrect email or password. Please try again.',
                    'login_failed': True
                }
            elif error_code == 'UserNotFoundException':
                logger.warning(f"AWS_COGNITO_SIGNIN_USER_NOT_FOUND", extra={
                    'request_id': request_id,
                    'username': username[:3] + '***' + username[-3:] if username else 'missing',
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': error_code,
                    'message': 'No account found with this email address.',
                    'login_failed': True
                }
            elif error_code == 'TooManyRequestsException':
                logger.warning(f"AWS_COGNITO_SIGNIN_RATE_LIMITED", extra={
                    'request_id': request_id,
                    'username': username[:3] + '***' + username[-3:] if username else 'missing',
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': error_code,
                    'message': 'Too many login attempts. Please try again later.',
                    'login_failed': True
                }
            else:
                logger.error(f"AWS_COGNITO_SIGNIN_UNKNOWN_ERROR", extra={
                    'request_id': request_id,
                    'error_code': error_code,
                    'error_message': error_message,
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': error_code,
                    'message': error_message,
                    'login_failed': True
                }
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"AWS_COGNITO_SIGNIN_UNEXPECTED_ERROR", extra={
                'request_id': request_id,
                'error_type': type(e).__name__,
                'error_message': str(e),
                'duration_ms': duration_ms,
                'timestamp': datetime.utcnow().isoformat()
            })
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred. Please try again.',
                'login_failed': True
            }

    def forgot_password(self, username):
        """Initiate forgot password flow"""
        try:
            response = self.client.forgot_password(
                ClientId=self.client_id,
                SecretHash=self._get_secret_hash(username),
                Username=username
            )
            return {
                'success': True,
                'code_delivery': response['CodeDeliveryDetails']
            }
        except ClientError as e:
            logger.error(f"Error initiating forgot password: {e}")
            return {
                'success': False,
                'error': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def confirm_forgot_password(self, username, confirmation_code, new_password):
        """Confirm forgot password with code and set new password"""
        try:
            self.client.confirm_forgot_password(
                ClientId=self.client_id,
                SecretHash=self._get_secret_hash(username),
                Username=username,
                ConfirmationCode=confirmation_code,
                Password=new_password
            )
            return {'success': True}
        except ClientError as e:
            logger.error(f"Error confirming forgot password: {e}")
            return {
                'success': False,
                'error': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def _get_secret_hash(self, username):
        """Generate secret hash for Cognito"""
        if not username:
            raise ValueError("Username cannot be None or empty")
        if not self.client_id:
            raise ValueError("AWS_COGNITO_CLIENT_ID is not set in environment variables")
        if not self.client_secret:
            raise ValueError("AWS_COGNITO_CLIENT_SECRET is not set in environment variables")
            
        message = username + self.client_id
        dig = hmac.new(
            self.client_secret.encode('utf-8'),
            msg=message.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()

# Singleton instance
AWS_COGNITO_service = CognitoService()
