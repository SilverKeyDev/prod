"""
S3 Service for document storage and retrieval.
Handles all S3 operations with proper error handling and configuration management.
"""
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, ParamValidationError
from flask import current_app, has_app_context
import os
from typing import Optional
from io import BytesIO
import time

from app.utils.security.app_logging import get_logger
from .s3_helpers import get_bucket_name, get_presigned_url_expiration

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
        if (not force_retry and 
            self.initialization_attempted and 
            current_time - self._last_init_attempt < self._init_retry_delay):
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
                    aws_access_key = config.get('AWS_ACCESS_KEY_ID')
                    aws_secret_key = config.get('AWS_SECRET_ACCESS_KEY')
                    s3_region = config.get('AWS_REGION', 'us-east-2')
                except Exception:
                    pass
            
            # Fallback to environment variables
            if not aws_access_key or not aws_secret_key:
                aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
                aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
                s3_region = os.getenv('AWS_REGION', 'us-east-2')
            
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
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=s3_region
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
            
        except NoCredentialsError as e:
            logger.error("AWS credentials not found or invalid")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
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
    
    def upload_pdf(self, file_data: bytes, filename: str, content_type: str = 'application/pdf') -> Optional[str]:
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
            file_obj = BytesIO(file_data)
            self.s3_client.upload_fileobj(
                file_obj,
                bucket_name,
                filename,
                ExtraArgs={
                    'ContentType': content_type,
                    'ACL': 'private'  # Private access, use presigned URLs for access
                }
            )
            return filename
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to upload PDF to S3: {filename} - {error_code}: {error_message}")
            return None
        except ParamValidationError as e:
            logger.error(f"Parameter validation error uploading PDF: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading PDF to S3: {str(e)}")
            return None
    
    def upload_file(self, file_path: str, s3_key: str, content_type: Optional[str] = None) -> Optional[str]:
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
                extra_args['ContentType'] = content_type
            extra_args['ACL'] = 'private'
            
            self.s3_client.upload_file(
                file_path,
                bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            return s3_key
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to upload file to S3: {s3_key} - {error_code}: {error_message}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading file to S3: {str(e)}")
            return None
    
    def generate_presigned_url(self, s3_key: str, operation: str = 'get_object', download_filename: Optional[str] = None) -> Optional[str]:
        """
        Generate a presigned URL for downloading a file from S3.
        
        Args:
            s3_key: The S3 key (path) of the file
            operation: The S3 operation (default: 'get_object' for downloads)
            download_filename: Optional filename to force as the download name
            
        Returns:
            The presigned URL, or None if generation failed
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot generate presigned URL")
            return None
        
        if not s3_key:
            logger.error("No S3 key provided for presigned URL generation")
            return None
        
        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available")
            return None
        
        expiration = get_presigned_url_expiration()
        
        try:
            params = {
                'Bucket': bucket_name,
                'Key': s3_key,
            }
            
            if download_filename:
                params['ResponseContentDisposition'] = f'attachment; filename="{download_filename}"'
            
            presigned_url = self.s3_client.generate_presigned_url(
                operation,
                Params=params,
                ExpiresIn=expiration
            )
            return presigned_url
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to generate presigned URL for {s3_key}: {error_code} - {error_message}")
            return None
        except ParamValidationError as e:
            logger.error(f"Parameter validation error generating presigned URL: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {str(e)}")
            return None
    
    def generate_view_url(self, s3_key: str, operation: str = 'get_object') -> Optional[str]:
        """
        Generate a presigned URL for viewing a PDF inline in the browser.
        
        Args:
            s3_key: The S3 key (path) of the file
            operation: The S3 operation (default: 'get_object' for viewing)
            
        Returns:
            The presigned URL, or None if generation failed
        """
        if not self._ensure_s3_client():
            logger.error("S3 client not initialized - cannot generate view URL")
            return None
        
        if not s3_key:
            logger.error("No S3 key provided for view URL generation")
            return None
        
        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            logger.error("S3 bucket name not available")
            return None
        
        expiration = get_presigned_url_expiration()
        
        try:
            params = {
                'Bucket': bucket_name,
                'Key': s3_key,
                'ResponseContentDisposition': 'inline',
                'ResponseContentType': 'application/pdf',
                'ResponseCacheControl': 'public, max-age=3600',
                'ResponseContentEncoding': 'identity'
            }
            
            presigned_url = self.s3_client.generate_presigned_url(
                operation,
                Params=params,
                ExpiresIn=expiration,
            )
            return presigned_url
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to generate view URL for {s3_key}: {error_code} - {error_message}")
            return None
        except ParamValidationError as e:
            logger.error(f"Parameter validation error generating view URL: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating view URL: {str(e)}")
            return None
    
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
            self.s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to delete file from S3: {s3_key} - {error_code}: {error_message}")
            
            if error_code == 'NoSuchKey':
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
            self.s3_client.head_object(Bucket=bucket_name, Key=s3_key)
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404' or error_code == 'NoSuchKey':
                return False
            else:
                error_message = e.response['Error']['Message']
                logger.error(f"Error checking if file exists in S3: {s3_key} - {error_code}: {error_message}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {str(e)}")
            return False
    
    def get_pdf(self, s3_key: str) -> Optional[bytes]:
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
            file_obj = BytesIO()
            self.s3_client.download_fileobj(bucket_name, s3_key, file_obj)
            file_obj.seek(0)
            return file_obj.read()
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to download file from S3: {s3_key} - {error_code}: {error_message}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading file from S3: {str(e)}")
            return None


# Global S3 service instance
s3_service = S3Service()
