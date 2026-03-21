"""
S3 Service for document storage and retrieval.
Handles all S3 operations with proper error handling and configuration management.
"""

import os
import time
from io import BytesIO

import boto3
from botocore.exceptions import ClientError, NoCredentialsError, ParamValidationError
from flask import current_app, has_app_context

from app.utils.security.app_logging import get_logger

from .s3_helpers import get_bucket_name
from .s3_urls import generate_presigned_url as url_generate_presigned
from .s3_urls import generate_view_url as url_generate_view

logger = get_logger()


class S3Service:
    """Service for managing S3 operations for document storage."""

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
                logger.error("S3 credentials not configured - S3 operations will be disabled")
                return

            # Validate credential format (basic checks)
            if len(aws_access_key) < 16 or len(aws_secret_key) < 20:
                logger.error("S3 credentials appear invalid - S3 operations will be disabled")
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
                logger.error(f"S3 bucket access test failed: {str(bucket_test_error)}")
                raise bucket_test_error

            # Store bucket name for later use
            self.bucket_name = bucket_name
            self.initialization_successful = True

        except NoCredentialsError:
            logger.error("AWS credentials not found or invalid")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            logger.error(f"S3 client initialization failed: {error_code} - {error_message}")
            self.s3_client = None
        except Exception as e:
            logger.error(f"Unexpected error initializing S3 client: {str(e)}")
            self.s3_client = None

    def _ensure_s3_client(self):
        """Ensure S3 client is initialized, with retry logic."""
        if self.s3_client is None and not self.initialization_successful:
            try:
                self._initialize_s3_client(force_retry=True)
            except Exception as e:
                logger.error(f"S3 client initialization failed: {str(e)}")
                return False

        if self.s3_client is None:
            logger.warning("S3 client initialization failed - operations will be disabled")
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

    def upload_pdf(
        self, file_data: bytes, filename: str, content_type: str = "application/pdf"
    ) -> str | None:
        """
        Upload a PDF file to S3.

        Args:
            file_data: The PDF file data as bytes
            filename: The filename to use in S3
            content_type: The content type (default: application/pdf)

        Returns:
            The S3 key (path) of the uploaded file, or None if upload failed
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot upload PDF")
            return None

        if not file_data or not filename or len(file_data) == 0:
            logger.error("Invalid file data or filename provided for upload")
            return None

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available")
            return None

        try:
            client = self.s3_client
            assert client is not None  # ensured by _ensure_s3_client
            file_obj = BytesIO(file_data)
            client.upload_fileobj(
                file_obj,
                bucket_name,
                filename,
                ExtraArgs={
                    "ContentType": content_type,
                    "ACL": "private",  # Private access, use presigned URLs for access
                },
            )
            return filename

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            logger.error(f"Failed to upload PDF to S3: {filename} - {error_code}: {error_message}")
            return None
        except ParamValidationError as e:
            logger.error(f"Parameter validation error uploading PDF: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading PDF to S3: {str(e)}")
            return None

    def upload_file(
        self, file_path: str, s3_key: str, content_type: str | None = None
    ) -> str | None:
        """
        Upload a file from local filesystem to S3.

        Args:
            file_path: Local file path
            s3_key: S3 key (path) to store the file
            content_type: Optional content type (will be inferred if not provided)

        Returns:
            The S3 key if successful, None otherwise
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot upload file")
            return None

        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available")
            return None

        try:
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type
            extra_args["ACL"] = "private"

            client = self.s3_client
            assert client is not None  # ensured by _ensure_s3_client
            client.upload_file(file_path, bucket_name, s3_key, ExtraArgs=extra_args)
            return s3_key

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            logger.error(f"Failed to upload file to S3: {s3_key} - {error_code}: {error_message}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading file to S3: {str(e)}")
            return None

    def generate_presigned_url(
        self, s3_key: str, operation: str = "get_object", download_filename: str | None = None
    ) -> str | None:
        """Generate a presigned URL for downloading a file from S3."""
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot generate presigned URL")
            return None
        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            return None
        client = self.s3_client
        assert client is not None  # ensured by _ensure_s3_client
        return url_generate_presigned(client, bucket_name, s3_key, operation, download_filename)

    def generate_view_url(
        self,
        s3_key: str,
        operation: str = "get_object",
        content_type: str | None = None,
    ) -> str | None:
        """Generate a presigned URL for viewing a file inline (e.g. PDF or profile image)."""
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot generate view URL")
            return None
        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            return None
        client = self.s3_client
        assert client is not None  # ensured by _ensure_s3_client
        return url_generate_view(client, bucket_name, s3_key, operation, content_type)

    def delete_pdf(self, s3_key: str) -> bool:
        """
        Delete a file from S3.

        Args:
            s3_key: The S3 key (path) of the file to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot delete file")
            return False

        if not s3_key:
            logger.error("No S3 key provided for deletion")
            return False

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available for deletion")
            return False

        try:
            client = self.s3_client
            assert client is not None  # ensured by _ensure_s3_client
            client.delete_object(Bucket=bucket_name, Key=s3_key)
            return True

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            logger.error(f"Failed to delete file from S3: {s3_key} - {error_code}: {error_message}")

            if error_code == "NoSuchKey":
                logger.warning(f"S3 object '{s3_key}' does not exist (already deleted?)")
                return True  # Consider this a success since the goal is achieved

            return False
        except ParamValidationError as e:
            logger.error(f"Parameter validation error deleting file: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting file from S3: {str(e)}")
            return False

    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3.

        Args:
            s3_key: The S3 key (path) of the file

        Returns:
            True if file exists, False otherwise
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot check file existence")
            return False

        if not s3_key:
            logger.error("No S3 key provided for existence check")
            return False

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available for existence check")
            return False

        try:
            client = self.s3_client
            assert client is not None  # ensured by _ensure_s3_client
            client.head_object(Bucket=bucket_name, Key=s3_key)
            return True

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404" or error_code == "NoSuchKey":
                return False
            else:
                error_message = e.response["Error"]["Message"]
                logger.error(
                    f"Error checking if file exists in S3: {s3_key} - {error_code}: {error_message}"
                )
                return False
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {str(e)}")
            return False

    def get_pdf(self, s3_key: str) -> bytes | None:
        """
        Download a file from S3 and return its bytes.

        Args:
            s3_key: The S3 key (path) of the file

        Returns:
            The file contents as bytes, or None if download fails
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot download file")
            return None

        if not s3_key:
            logger.error("No S3 key provided for download")
            return None

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available for download")
            return None

        try:
            client = self.s3_client
            assert client is not None  # ensured by _ensure_s3_client
            file_obj = BytesIO()
            client.download_fileobj(bucket_name, s3_key, file_obj)
            file_obj.seek(0)
            return file_obj.read()

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            logger.error(
                f"Failed to download file from S3: {s3_key} - {error_code}: {error_message}"
            )
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading file from S3: {str(e)}")
            return None


# Global S3 service instance
s3_service = S3Service()
