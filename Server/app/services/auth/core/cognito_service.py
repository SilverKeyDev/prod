"""
AWS Cognito Service
Handles all AWS Cognito authentication operations.
"""
import boto3
import os
import logging
import hmac
import hashlib
import base64
import json
import time
import random
import jwt
import secrets
import string
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
            elif error_code == 'UserNotConfirmedException':
                logger.warning(f"AWS_COGNITO_SIGNIN_USER_NOT_CONFIRMED", extra={
                    'request_id': request_id,
                    'username': username[:3] + '***' + username[-3:] if username else 'missing',
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': error_code,
                    'message': 'Please verify your email address to continue.',
                    'login_failed': True,
                    'needs_verification': True
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

    def forgot_password(self, username, request_id: str = None, user_status: str = None):
        """
        Initiate forgot password flow.

        request_id and user_status are optional and used only to enrich logging so we
        can correlate this call back to the API request and the user's Cognito status.
        """
        # Generate a request-scoped ID if caller didn't provide one
        local_request_id = request_id or f"AWS_COGNITO_forgot_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        start_time = time.time()

        masked_username = username[:3] + '***' + username[-3:] if username else 'missing'

        try:
            logger.info("FORGOT_PASSWORD_COGNITO_CALL_START", extra={
                'request_id': local_request_id,
                'username': masked_username,
                'user_status_at_call_time': user_status,
            })

            response = self.client.forgot_password(
                ClientId=self.client_id,
                SecretHash=self._get_secret_hash(username),
                Username=username
            )

            duration_ms = int((time.time() - start_time) * 1000)
            metadata = response.get('ResponseMetadata', {}) or {}

            # Extract detailed code delivery information
            code_delivery = response.get('CodeDeliveryDetails', {}) or {}
            delivery_medium = code_delivery.get('DeliveryMedium', 'UNKNOWN')
            destination = code_delivery.get('Destination', 'UNKNOWN')
            attribute_name = code_delivery.get('AttributeName', 'UNKNOWN')

            # Log detailed email delivery information including AWS response metadata
            logger.info("FORGOT_PASSWORD_EMAIL_DELIVERY_INFO", extra={
                'request_id': local_request_id,
                'username': masked_username,
                'user_status_at_call_time': user_status,
                'delivery_medium': delivery_medium,
                'destination': destination[:3] + '***' + destination[-3:] if destination and destination != 'UNKNOWN' else destination,
                'attribute_name': attribute_name,
                'has_code_delivery': bool(code_delivery),
                'code_delivery_keys': list(code_delivery.keys()) if code_delivery else [],
                'aws_request_id': metadata.get('RequestId'),
                'aws_http_status': metadata.get('HTTPStatusCode'),
                'aws_retry_attempts': metadata.get('RetryAttempts'),
                'duration_ms': duration_ms,
            })

            # Validate that email delivery is configured
            if delivery_medium not in ['EMAIL', 'SMS']:
                logger.warning("FORGOT_PASSWORD_UNEXPECTED_DELIVERY_MEDIUM", extra={
                    'request_id': local_request_id,
                    'username': masked_username,
                    'delivery_medium': delivery_medium,
                    'expected': 'EMAIL or SMS',
                    'user_status_at_call_time': user_status,
                })

            if destination == 'UNKNOWN' or not destination:
                logger.warning("FORGOT_PASSWORD_NO_DESTINATION", extra={
                    'request_id': local_request_id,
                    'username': masked_username,
                    'code_delivery': code_delivery,
                    'user_status_at_call_time': user_status,
                })

            # Sometimes Cognito can report success but not include CodeDeliveryDetails.
            # Make that explicit so we can distinguish it from a fully healthy success.
            if not code_delivery:
                logger.warning("FORGOT_PASSWORD_NO_CODE_DELIVERY_DETAILS", extra={
                    'request_id': local_request_id,
                    'username': masked_username,
                    'aws_request_id': metadata.get('RequestId'),
                    'aws_http_status': metadata.get('HTTPStatusCode'),
                    'user_status_at_call_time': user_status,
                })

            return {
                'success': True,
                'code_delivery': code_delivery,
                'delivery_medium': delivery_medium,
                'destination': destination,
                'attribute_name': attribute_name,
                'aws_request_id': metadata.get('RequestId'),
                'aws_http_status': metadata.get('HTTPStatusCode'),
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']

            metadata = e.response.get('ResponseMetadata', {}) or {}

            logger.error(f"FORGOT_PASSWORD_COGNITO_ERROR: {error_code} - {error_message}", extra={
                'request_id': local_request_id,
                'username': masked_username,
                'error_code': error_code,
                'error_message': error_message,
                'http_status': metadata.get('HTTPStatusCode', 'unknown'),
                'aws_request_id': metadata.get('RequestId'),
            })
            return {
                'success': False,
                'error': error_code,
                'message': error_message,
                'aws_request_id': metadata.get('RequestId'),
                'aws_http_status': metadata.get('HTTPStatusCode'),
            }
        except Exception as e:
            logger.error(f"FORGOT_PASSWORD_UNEXPECTED_ERROR", extra={
                'request_id': local_request_id,
                'username': masked_username,
                'error_type': type(e).__name__,
                'error_message': str(e)
            }, exc_info=True)
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': f'An unexpected error occurred: {str(e)}'
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

    def refresh_access_token(self, refresh_token: str, username: str = None):
        """Refresh access token using Cognito refresh token"""
        request_id = f"AWS_COGNITO_refresh_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        start_time = time.time()
        
        try:
            # Validate refresh token
            if not refresh_token:
                logger.error(f"AWS_COGNITO_REFRESH_VALIDATION_ERROR", extra={
                    'request_id': request_id,
                    'error': 'Missing refresh token',
                    'duration_ms': int((time.time() - start_time) * 1000)
                })
                return {
                    'success': False,
                    'error': 'MISSING_REFRESH_TOKEN',
                    'message': 'Refresh token is required',
                    'refresh_failed': True
                }
            
            # Generate secret hash (for Cognito client with secret)
            # For refresh token auth, we need the username that was used to obtain the refresh token
            # If username is not provided, try to get it from the current access token
            try:
                if username:
                    secret_hash = self._get_secret_hash(username)
                else:
                    # Try to get username from current access token if available
                    # This is a fallback - ideally username should be provided
                    from flask import request
                    access_token = request.cookies.get('session')
                    if access_token:
                        try:
                            decoded = jwt.decode(access_token, options={"verify_signature": False})
                            username_from_token = decoded.get('email') or decoded.get('sub')
                            if username_from_token:
                                secret_hash = self._get_secret_hash(username_from_token)
                            else:
                                raise ValueError("Could not extract username from access token")
                        except Exception:
                            # If we can't get username from token, use client_id as fallback
                            # This may not work for all Cognito configurations
                            secret_hash = self._get_secret_hash(self.client_id)
                    else:
                        # Last resort: use client_id (may not work for all configurations)
                        secret_hash = self._get_secret_hash(self.client_id)
                
                logger.debug(f"AWS_COGNITO_REFRESH_SECRET_HASH_GENERATED", extra={
                    'request_id': request_id,
                    'secret_hash_length': len(secret_hash),
                    'has_username': bool(username)
                })
            except Exception as hash_error:
                logger.error(f"AWS_COGNITO_REFRESH_SECRET_HASH_ERROR", extra={
                    'request_id': request_id,
                    'error': str(hash_error),
                    'duration_ms': int((time.time() - start_time) * 1000)
                })
                return {
                    'success': False,
                    'error': 'SECRET_HASH_ERROR',
                    'message': 'Failed to generate authentication hash',
                    'refresh_failed': True
                }
            
            # Use REFRESH_TOKEN_AUTH flow
            auth_params = {
                'REFRESH_TOKEN': refresh_token,
                'SECRET_HASH': secret_hash
            }
            
            response = self.client.initiate_auth(
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters=auth_params,
                ClientId=self.client_id
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"AWS_COGNITO_REFRESH_SUCCESS", extra={
                'request_id': request_id,
                'duration_ms': duration_ms
            })
            
            return {
                'success': True,
                'tokens': response['AuthenticationResult']
            }
            
        except ClientError as e:
            duration_ms = int((time.time() - start_time) * 1000)
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"AWS_COGNITO_REFRESH_CLIENT_ERROR", extra={
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
                logger.warning(f"AWS_COGNITO_REFRESH_UNAUTHORIZED", extra={
                    'request_id': request_id,
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': 'REFRESH_TOKEN_EXPIRED',
                    'message': 'Refresh token has expired. Please log in again.',
                    'refresh_failed': True
                }
            elif error_code == 'InvalidParameterException':
                logger.warning(f"AWS_COGNITO_REFRESH_INVALID_PARAMETER", extra={
                    'request_id': request_id,
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': 'REFRESH_TOKEN_INVALID',
                    'message': 'Invalid refresh token. Please log in again.',
                    'refresh_failed': True
                }
            else:
                logger.error(f"AWS_COGNITO_REFRESH_UNKNOWN_ERROR", extra={
                    'request_id': request_id,
                    'error_code': error_code,
                    'error_message': error_message,
                    'duration_ms': duration_ms
                })
                return {
                    'success': False,
                    'error': error_code,
                    'message': error_message,
                    'refresh_failed': True
                }
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"AWS_COGNITO_REFRESH_UNEXPECTED_ERROR", extra={
                'request_id': request_id,
                'error_type': type(e).__name__,
                'error_message': str(e),
                'duration_ms': duration_ms,
                'timestamp': datetime.utcnow().isoformat()
            })
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred during token refresh. Please try again.',
                'refresh_failed': True
            }

    def admin_create_user(self, username, user_attributes, temporary_password=None):
        """
        Create a user in Cognito using admin privileges.
        Used to create Cognito accounts for Google OAuth users on-demand.
        
        Args:
            username: Email address (username)
            user_attributes: List of user attributes (email, name, etc.)
            temporary_password: Optional temporary password. If None, generates one.
        
        Returns:
            dict with 'success', 'user_sub', 'temporary_password', 'error', 'message'
        """
        try:
            # Generate secure temporary password if not provided
            if temporary_password is None:
                # Generate a secure random password that meets Cognito requirements
                # Must have: uppercase, lowercase, number, special char, min 8 chars
                alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                password_length = 16
                temporary_password = ''.join(secrets.choice(alphabet) for _ in range(password_length))
                # Ensure it has required character types
                if not any(c.isupper() for c in temporary_password):
                    temporary_password = temporary_password[0].upper() + temporary_password[1:]
                if not any(c.islower() for c in temporary_password):
                    temporary_password = temporary_password[0].lower() + temporary_password[1:]
                if not any(c.isdigit() for c in temporary_password):
                    temporary_password = temporary_password[:-1] + secrets.choice(string.digits)
                if not any(c in "!@#$%^&*" for c in temporary_password):
                    temporary_password = temporary_password[:-1] + secrets.choice("!@#$%^&*")
            
            # Create user with admin privileges
            response = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=user_attributes,
                TemporaryPassword=temporary_password,
                MessageAction='SUPPRESS',  # Don't send email about temp password
                DesiredDeliveryMediums=['EMAIL']
            )
            
            # Extract cognito_id (sub) from user attributes
            user_sub = None
            for attr in response.get('User', {}).get('Attributes', []):
                if attr['Name'] == 'sub':
                    user_sub = attr['Value']
                    break
            
            # If sub not in attributes, use Username as fallback (some Cognito configs use username as sub)
            if not user_sub:
                user_sub = response.get('User', {}).get('Username')
            
            logger.info(f"Admin created user in Cognito", extra={
                'username': username[:3] + '***' + username[-3:] if username else 'missing',
                'user_sub': user_sub[:8] + '...' if user_sub else 'unknown'
            })
            
            return {
                'success': True,
                'user_sub': user_sub,
                'temporary_password': temporary_password  # Returned but never used
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            # Handle case where user already exists
            if error_code == 'UsernameExistsException':
                logger.warning(f"User already exists in Cognito, attempting to retrieve", extra={
                    'username': username[:3] + '***' + username[-3:] if username else 'missing'
                })
                # Try to get existing user's cognito_id
                get_user_result = self.admin_get_user(username)
                if get_user_result['success']:
                    return {
                        'success': True,
                        'user_sub': get_user_result['user_sub'],
                        'temporary_password': None,
                        'already_exists': True
                    }
                else:
                    return {
                        'success': False,
                        'error': error_code,
                        'message': error_message
                    }
            
            logger.error(f"Error creating user in Cognito: {e}", extra={
                'error_code': error_code,
                'error_message': error_message,
                'username': username[:3] + '***' + username[-3:] if username else 'missing'
            })
            return {
                'success': False,
                'error': error_code,
                'message': error_message
            }
        except Exception as e:
            logger.error(f"Unexpected error creating user in Cognito: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': f'An unexpected error occurred: {str(e)}'
            }

    def admin_get_user(self, username):
        """
        Get user information from Cognito using admin privileges.
        Used to retrieve cognito_id for existing users.
        
        Args:
            username: Email address (username)
        
        Returns:
            dict with 'success', 'user_sub', 'error', 'message'
        """
        try:
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=username
            )
            
            # Extract cognito_id (sub) from user attributes
            user_sub = None
            for attr in response.get('UserAttributes', []):
                if attr['Name'] == 'sub':
                    user_sub = attr['Value']
                    break
            
            # If sub not in attributes, use Username (which is the sub)
            if not user_sub:
                user_sub = response.get('Username')
            
            logger.info(f"Retrieved user from Cognito", extra={
                'username': username[:3] + '***' + username[-3:] if username else 'missing',
                'user_sub': user_sub
            })
            
            return {
                'success': True,
                'user_sub': user_sub
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Error retrieving user from Cognito: {e}", extra={
                'error_code': error_code,
                'error_message': error_message,
                'username': username[:3] + '***' + username[-3:] if username else 'missing'
            })
            return {
                'success': False,
                'error': error_code,
                'message': error_message
            }
        except Exception as e:
            logger.error(f"Unexpected error retrieving user from Cognito: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': f'An unexpected error occurred: {str(e)}'
            }

    def admin_get_user_status(self, username):
        """
        Get user status and attributes from Cognito using admin privileges.
        
        Args:
            username: Email address (username)
        
        Returns:
            dict with 'success', 'user_status', 'email_verified', 'error', 'message'
        """
        try:
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=username
            )
            
            user_status = response.get('UserStatus', 'UNKNOWN')
            user_attributes = response.get('UserAttributes', [])
            
            # Extract email_verified status
            email_verified = False
            email_address = None
            for attr in user_attributes:
                if attr.get('Name') == 'email_verified':
                    email_verified = attr.get('Value', 'false').lower() == 'true'
                elif attr.get('Name') == 'email':
                    email_address = attr.get('Value')
            
            logger.info(f"Admin retrieved user status from Cognito", extra={
                'username': username[:3] + '***' + username[-3:] if username else 'missing',
                'user_status': user_status,
                'email_verified': email_verified,
                'has_email': bool(email_address)
            })
            
            return {
                'success': True,
                'user_status': user_status,
                'email_verified': email_verified,
                'email': email_address
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Error retrieving user status from Cognito: {e}", extra={
                'error_code': error_code,
                'error_message': error_message,
                'username': username[:3] + '***' + username[-3:] if username else 'missing'
            })
            return {
                'success': False,
                'error': error_code,
                'message': error_message
            }
        except Exception as e:
            logger.error(f"Unexpected error retrieving user status from Cognito: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': f'An unexpected error occurred: {str(e)}'
            }

    def admin_set_user_password(self, username, password, permanent=True):
        """
        Set user password using admin privileges.
        This changes user status from FORCE_CHANGE_PASSWORD to CONFIRMED.
        
        Args:
            username: Email address (username)
            password: Password to set
            permanent: If True, password is permanent (user status becomes CONFIRMED)
                      If False, password is temporary (user stays in FORCE_CHANGE_PASSWORD)
        
        Returns:
            dict with 'success', 'error', 'message'
        """
        try:
            self.client.admin_set_user_password(
                UserPoolId=self.user_pool_id,
                Username=username,
                Password=password,
                Permanent=permanent
            )
            
            logger.info(f"ADMIN_SET_USER_PASSWORD_SUCCESS", extra={
                'username': username[:3] + '***' + username[-3:] if username else 'missing',
                'permanent': permanent
            })
            
            return {
                'success': True
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"ADMIN_SET_USER_PASSWORD_ERROR", extra={
                'error_code': error_code,
                'error_message': error_message,
                'username': username[:3] + '***' + username[-3:] if username else 'missing',
                'permanent': permanent
            })
            return {
                'success': False,
                'error': error_code,
                'message': error_message
            }
        except Exception as e:
            logger.error(f"ADMIN_SET_USER_PASSWORD_UNEXPECTED_ERROR", extra={
                'username': username[:3] + '***' + username[-3:] if username else 'missing',
                'error_type': type(e).__name__,
                'error_message': str(e)
            }, exc_info=True)
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': f'An unexpected error occurred: {str(e)}'
            }

    def admin_reset_user_password(self, username):
        """
        Reset user password using admin privileges and send reset code via email.
        NOTE: This does NOT work for users in FORCE_CHANGE_PASSWORD status.
        Use admin_set_user_password + forgot_password instead for newly created accounts.
        
        Args:
            username: Email address (username)
        
        Returns:
            dict with 'success', 'code_delivery', 'error', 'message'
        """
        try:
            response = self.client.admin_reset_user_password(
                UserPoolId=self.user_pool_id,
                Username=username
            )
            
            logger.info(f"Admin reset user password in Cognito", extra={
                'username': username[:3] + '***' + username[-3:] if username else 'missing'
            })
            
            return {
                'success': True,
                'code_delivery': response.get('CodeDeliveryDetails')
            }
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Error resetting user password in Cognito: {e}", extra={
                'error_code': error_code,
                'error_message': error_message,
                'username': username[:3] + '***' + username[-3:] if username else 'missing'
            })
            return {
                'success': False,
                'error': error_code,
                'message': error_message
            }
        except Exception as e:
            logger.error(f"Unexpected error resetting user password in Cognito: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': f'An unexpected error occurred: {str(e)}'
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
