import boto3
import os
import logging
import hmac
import hashlib
import base64
import json
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from flask import current_app

logger = logging.getLogger(__name__)

class CognitoService:
    def __init__(self):
        from app.config import Config
        
        # Initialize with explicit region from config
        self.region = Config.AWS_REGION
        ##CHANGE LATER, SHITTY TEMPORARY FIX
        boto3.client(
            'cognito-idp',
            region_name='us-east-2',
            endpoint_url='https://cognito-idp.us-east-2.amazonaws.com'
        )

        self.user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
        self.client_id = os.getenv('COGNITO_CLIENT_ID')
        self.client_secret = os.getenv('COGNITO_CLIENT_SECRET')
        
        # Debug logging
        logger.debug(f"CognitoService initialized with:")
        logger.debug(f"  AWS_REGION: {self.region}")
        logger.debug(f"  COGNITO_USER_POOL_ID: {self.user_pool_id}")
        logger.debug(f"  COGNITO_CLIENT_ID: {self.client_id}")
        logger.debug(f"  COGNITO_CLIENT_SECRET: {'***' if self.client_secret else 'None'}")

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
        try:
            auth_params = {
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': self._get_secret_hash(username)
            }
            
            response = self.client.initiate_auth(
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters=auth_params,
                ClientId=self.client_id
            )
            
            return {
                'success': True,
                'tokens': response['AuthenticationResult']
            }
        except ClientError as e:
            logger.error(f"Error signing in: {e}")
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
            raise ValueError("COGNITO_CLIENT_ID is not set in environment variables")
        if not self.client_secret:
            raise ValueError("COGNITO_CLIENT_SECRET is not set in environment variables")
            
        message = username + self.client_id
        dig = hmac.new(
            self.client_secret.encode('utf-8'),
            msg=message.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()

# Singleton instance
cognito_service = CognitoService()
