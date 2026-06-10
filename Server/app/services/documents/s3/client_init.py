"""S3 client initialization."""

import os
import time

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from flask import current_app, has_app_context

from logger import log

from ..s3_helpers import get_bucket_name


class S3ClientManager:
    """Manages S3 client initialization and lifecycle."""

    def __init__(self):
        self.s3_client = None
        self.bucket_name = None
        self.initialization_attempted = False
        self.initialization_successful = False
        self._last_init_attempt = 0
        self._init_retry_delay = 30  # seconds

    def _initialize_s3_client(self, force_retry=False):
        """Initialize the S3 client with credentials from config or environment."""
        current_time = time.time()

        # Prevent too frequent retry attempts
        if (
            not force_retry
            and self.initialization_attempted
            and current_time - self._last_init_attempt < self._init_retry_delay
        ):
            return

        self._last_init_attempt = current_time
        self.initialization_attempted = True

        try:
            # Get credentials from Flask config first, then fall back to environment
            aws_access_key = None
            aws_secret_key = None
            s3_region = None

            if has_app_context():
                try:
                    config = current_app.config
                    aws_access_key = config.get("AWS_ACCESS_KEY_ID")
                    aws_secret_key = config.get("AWS_SECRET_ACCESS_KEY")
                    s3_region = config.get("AWS_REGION", "us-east-2")
                except Exception:
                    pass

            # Fallback to environment variables
            if not aws_access_key or not aws_secret_key:
                aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
                aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
                s3_region = os.getenv("AWS_REGION", "us-east-2")

            # Get bucket name using helper
            bucket_name = get_bucket_name()

            # Validate credentials
            if not aws_access_key or not aws_secret_key or not bucket_name:
                log.error(
                    "DOCUMENTS", "S3 credentials not configured - S3 operations will be disabled"
                )
                return

            # Validate credential format (basic checks)
            if len(aws_access_key) < 16 or len(aws_secret_key) < 20:
                log.error(
                    "DOCUMENTS",
                    "S3 credentials appear invalid - S3 operations will be disabled",
                )
                return

            # Create S3 client
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=s3_region,
            )

            # Test the connection and bucket access
            try:
                self.s3_client.head_bucket(Bucket=bucket_name)
            except Exception as bucket_test_error:
                log.error(
                    "DOCUMENTS",
                    "S3 bucket access test failed",
                    {"error": str(bucket_test_error)},
                )
                raise bucket_test_error

            # Store bucket name for later use
            self.bucket_name = bucket_name
            self.initialization_successful = True

        except NoCredentialsError:
            log.error("DOCUMENTS", "AWS credentials not found or invalid")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            log.error(
                "DOCUMENTS",
                "S3 client initialization failed",
                {"error_code": error_code, "error_message": error_message},
            )
            self.s3_client = None
        except Exception as e:
            log.error(
                "DOCUMENTS",
                "Unexpected error initializing S3 client",
                {"error": str(e)},
            )
            self.s3_client = None

    def _ensure_s3_client(self):
        """Ensure S3 client is initialized, with retry logic."""
        if self.s3_client is None and not self.initialization_successful:
            try:
                self._initialize_s3_client(force_retry=True)
            except Exception as e:
                log.error(
                    "DOCUMENTS",
                    "S3 client initialization failed",
                    {"error": str(e)},
                )
                return False

        if self.s3_client is None:
            log.warn("DOCUMENTS", "S3 client initialization failed - operations will be disabled")
            return False

        return True

    def force_reinitialize(self):
        """Force reinitialize the S3 client (useful for debugging)."""
        self.s3_client = None
        self.bucket_name = None
        self.initialization_attempted = False
        self.initialization_successful = False
        self._initialize_s3_client(force_retry=True)
        return self.s3_client is not None
