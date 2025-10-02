import boto3
import logging
from botocore.exceptions import ClientError, NoCredentialsError, ParamValidationError
from flask import current_app, has_app_context
import os
from typing import Optional, Tuple
from io import BytesIO
import traceback
import time

from ..utils.app_logging import get_logger

logger = get_logger()

class S3Service:
    def __init__(self):
        self.s3_client = None
        self.bucket_name = None
        self.initialization_attempted = False
        self.initialization_successful = False
        self._last_init_attempt = 0
        self._init_retry_delay = 30  # seconds
        
        # Try initial initialization
        self._initialize_s3_client()
    
    def _log_initialization_context(self):
        """Log detailed context information for debugging initialization issues"""
      
        if has_app_context():
            try:
                current_app.config
            except Exception as e:
                logger.warning(f"   - Could not access Flask config: {e}")
    
    def _initialize_s3_client(self, force_retry=False):
        """Initialize the S3 client with credentials from config or environment"""
        current_time = time.time()
        
        # Prevent too frequent retry attempts
        if (not force_retry and 
            self.initialization_attempted and 
            current_time - self._last_init_attempt < self._init_retry_delay):
            return
        
        self._last_init_attempt = current_time
        self.initialization_attempted = True
        
        self._log_initialization_context()
        
        try:
            # Try to get credentials from Flask config first, then fall back to environment
            aws_access_key = None
            aws_secret_key = None
            s3_region = None
            bucket_name = None
            
            if has_app_context():
                try:
                    config = current_app.config
                    aws_access_key = config.get('AWS_ACCESS_KEY_ID')
                    aws_secret_key = config.get('AWS_SECRET_ACCESS_KEY')
                    s3_region = config.get('AWS_REGION', 'us-east-2')
                    bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                except Exception as e:
                    logger.warning(f"⚠️ Could not access Flask config: {e}")
            
            # Fallback to environment variables
            if not aws_access_key or not aws_secret_key:
                aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
                aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
                s3_region = os.getenv('AWS_REGION', 'us-east-2')
            
            # Validate credentials
            if not aws_access_key or not aws_secret_key:
                logger.error("❌ AWS credentials not found in config or environment")
                logger.error(f"   - AWS_ACCESS_KEY_ID: {'✅ Present' if aws_access_key else '❌ Missing'}")
                logger.error(f"   - AWS_SECRET_ACCESS_KEY: {'✅ Present' if aws_secret_key else '❌ Missing'}")
                logger.error("   - S3 operations will be disabled")
                return
            
            if not bucket_name:
                logger.error("❌ S3 bucket name not configured")
                logger.error("   - Set S3_BUCKET_NAME_PDFS in Flask config")
            
            # Create S3 client
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=s3_region
            )
            
            # Test the connection and bucket access
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Store bucket name for later use
            self.bucket_name = bucket_name
            self.initialization_successful = True
            
        except NoCredentialsError as e:
            logger.error("❌ AWS credentials not found or invalid")
            logger.error(f"   - NoCredentialsError details: {str(e)}")
            logger.error("   - Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"❌ S3 client initialization failed with ClientError")
            logger.error(f"   - Error code: {error_code}")
            logger.error(f"   - Error message: {error_message}")
            
            if error_code == '404':
                logger.error(f"   - S3 bucket '{bucket_name}' not found")
                logger.error("   - Verify bucket name and region")
            elif error_code == '403':
                logger.error("   - Access denied to S3 bucket")
                logger.error("   - Check IAM permissions for the AWS credentials")
            elif error_code == 'NoSuchBucket':
                logger.error(f"   - S3 bucket '{bucket_name}' does not exist")
                logger.error("   - Create the bucket or update configuration")
            elif error_code == 'InvalidAccessKeyId':
                logger.error("   - Invalid AWS Access Key ID")
            elif error_code == 'SignatureDoesNotMatch':
                logger.error("   - Invalid AWS Secret Access Key")
            
            self.s3_client = None
        except Exception as e:
            logger.error(f"❌ Unexpected error initializing S3 client: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            self.s3_client = None
    
    def _ensure_s3_client(self):
        """Ensure S3 client is initialized, with retry logic"""
        if self.s3_client is None and not self.initialization_successful:
            self._initialize_s3_client(force_retry=True)
        
        return self.s3_client is not None
    
    def upload_pdf(self, file_data: bytes, filename: str, content_type: str) -> Optional[str]:
        """
        Upload a PDF file to S3 with enhanced error handling and fallback
        
        Args:
            file_data: The PDF file data as bytes
            filename: The filename to use in S3
            content_type: The content type
            
        Returns:
            The S3 key (path) of the uploaded file, or None if upload failed
        """
        
        # Ensure S3 client is available
        if not self._ensure_s3_client():
            logger.error("❌ S3 client not initialized - cannot upload PDF")
            logger.error("   - Check AWS credentials and configuration")
            logger.error("   - PDF will not be uploaded to S3")
            return None
        
        # Validate input parameters
        if not file_data:
            logger.error("❌ No file data provided for upload")
            return None
        
        if not filename:
            logger.error("❌ No filename provided for upload")
            return None
        
        if len(file_data) == 0:
            logger.error("❌ File data is empty")
            return None
        
        try:
            # Use stored bucket name or get from Flask config
            bucket_name = self.bucket_name
            if not bucket_name:
                if has_app_context():
                    try:
                        config = current_app.config
                        bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                    except Exception:
                        pass
            
            if not bucket_name:
                logger.error("❌ S3 bucket name not available")
                return None
            
                        
            # Create a file-like object from bytes
            file_obj = BytesIO(file_data)
            
            # Upload to S3
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
            logger.error(f"❌ Failed to upload PDF to S3: {filename}")
            logger.error(f"   - ClientError code: {error_code}")
            logger.error(f"   - ClientError message: {error_message}")
            
            if error_code == 'NoSuchBucket':
                logger.error(f"   - S3 bucket '{bucket_name}' does not exist")
                logger.error("   - Create the bucket or verify configuration")
            elif error_code == 'AccessDenied':
                logger.error("   - Access denied to S3 bucket")
                logger.error("   - Check IAM permissions for the AWS credentials")
            elif error_code == 'InvalidAccessKeyId':
                logger.error("   - Invalid AWS access key ID")
            elif error_code == 'SignatureDoesNotMatch':
                logger.error("   - AWS signature mismatch - check secret access key")
            elif error_code == 'InvalidBucketName':
                logger.error(f"   - Invalid bucket name: {bucket_name}")
            elif error_code == 'EntityTooLarge':
                logger.error("   - File too large for S3 upload")
            
            return None
        except ParamValidationError as e:
            logger.error(f"❌ Parameter validation error uploading PDF: {str(e)}")
            logger.error("   - Check file data and parameters")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error uploading PDF to S3: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - Filename: {filename}")
            logger.error(f"   - Bucket: {bucket_name}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return None
    
    def generate_presigned_url(self, s3_key: str, operation: str = 'get_object', download_filename: Optional[str] = None) -> Optional[str]:
        """
        Generate a presigned URL for downloading a PDF from S3 with enhanced error handling.

        Args:
            s3_key: The S3 key (path) of the file
            operation: The S3 operation (default: 'get_object' for downloads)
            download_filename: Optional filename to force as the download name

        Returns:
            The presigned URL, or None if generation failed
        """        
        # Ensure S3 client is available
        if not self._ensure_s3_client():
            logger.error("❌ S3 client not initialized - cannot generate presigned URL")
            logger.error("   - Check AWS credentials and configuration")
            return None

        if not s3_key:
            logger.error("❌ No S3 key provided for presigned URL generation")
            return None

        try:
            # Use stored bucket name or get from Flask config
            bucket_name = self.bucket_name
            if not bucket_name:
                if has_app_context():
                    try:
                        config = current_app.config
                        bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                    except Exception:
                        pass
            
            # Get expiration from config or use default
            expiration = 3600  # 1 hour default
            if has_app_context():
                try:
                    config = current_app.config
                    expiration = config.get('S3_PRESIGNED_URL_EXPIRATION', 3600)
                except Exception:
                    pass
            
            if not expiration:
                expiration = int(os.getenv('S3_PRESIGNED_URL_EXPIRATION', '3600'))

            # Force download by setting Content-Disposition
            params = {
                'Bucket': bucket_name,
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="{download_filename}"',
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
            logger.error(f"❌ Failed to generate presigned URL for {s3_key}")
            logger.error(f"   - ClientError code: {error_code}")
            logger.error(f"   - ClientError message: {error_message}")

            if error_code == 'NoSuchKey':
                logger.error(f"   - S3 object '{s3_key}' does not exist in bucket '{bucket_name}'")
                logger.error("   - Verify the file was uploaded successfully")
            elif error_code == 'NoSuchBucket':
                logger.error(f"   - S3 bucket '{bucket_name}' does not exist")
                logger.error("   - Check bucket configuration")
            elif error_code == 'AccessDenied':
                logger.error("   - Access denied to S3 bucket")
                logger.error("   - Check IAM permissions for the AWS credentials")

            return None

        except ParamValidationError as e:
            logger.error(f"❌ Parameter validation error generating presigned URL: {str(e)}")
            logger.error("   - Check S3 key and operation parameters")
            return None

        except Exception as e:
            logger.error(f"❌ Unexpected error generating presigned URL: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - S3 Key: {s3_key}")
            logger.error(f"   - Operation: {operation}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return None
    
    def generate_view_url(self, s3_key: str, operation: str = 'get_object') -> Optional[str]:
        """
        Generate a presigned URL for viewing a PDF inline in the browser with enhanced error handling.

        Args:
            s3_key: The S3 key (path) of the file
            operation: The S3 operation (default: 'get_object' for viewing)

        Returns:
            The presigned URL, or None if generation failed
        """
        
        # Ensure S3 client is available
        if not self._ensure_s3_client():
            logger.error("❌ S3 client not initialized - cannot generate view URL")
            logger.error("   - Check AWS credentials and configuration")
            return None

        if not s3_key:
            logger.error("❌ No S3 key provided for view URL generation")
            return None

        try:
            # Use stored bucket name or get from Flask config
            bucket_name = self.bucket_name
            if not bucket_name:
                if has_app_context():
                    try:
                        config = current_app.config
                        bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                    except Exception:
                        pass
            
            # Get expiration from config or use default
            expiration = 3600  # 1 hour default
            if has_app_context():
                try:
                    config = current_app.config
                    expiration = config.get('S3_PRESIGNED_URL_EXPIRATION', 3600)
                except Exception:
                    pass
            
            if not expiration:
                expiration = int(os.getenv('S3_PRESIGNED_URL_EXPIRATION', '3600'))

            # For inline viewing, set Content-Disposition to inline
            params = {
                'Bucket': bucket_name,
                'Key': s3_key,
                'ResponseContentDisposition': 'inline',
                'ResponseContentType': 'application/pdf'
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
            logger.error(f"❌ Failed to generate view URL for {s3_key}")
            logger.error(f"   - ClientError code: {error_code}")
            logger.error(f"   - ClientError message: {error_message}")

            if error_code == 'NoSuchKey':
                logger.error(f"   - S3 object '{s3_key}' does not exist in bucket '{bucket_name}'")
                logger.error("   - Verify the file was uploaded successfully")
            elif error_code == 'NoSuchBucket':
                logger.error(f"   - S3 bucket '{bucket_name}' does not exist")
                logger.error("   - Check bucket configuration")
            elif error_code == 'AccessDenied':
                logger.error("   - Access denied to S3 bucket")
                logger.error("   - Check IAM permissions for the AWS credentials")

            return None

        except ParamValidationError as e:
            logger.error(f"❌ Parameter validation error generating view URL: {str(e)}")
            logger.error("   - Check S3 key and operation parameters")
            return None

        except Exception as e:
            logger.error(f"❌ Unexpected error generating view URL: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - S3 Key: {s3_key}")
            logger.error(f"   - Operation: {operation}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return None
    
    def delete_pdf(self, s3_key: str) -> bool:
        """
        Delete a PDF file from S3 with enhanced error handling and logging
        
        Args:
            s3_key: The S3 key (path) of the file to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        
        # Ensure S3 client is available
        if not self._ensure_s3_client():
            logger.error("❌ S3 client not initialized - cannot delete PDF")
            logger.error("   - Check AWS credentials and configuration")
            return False
        
        if not s3_key:
            logger.error("❌ No S3 key provided for deletion")
            return False
        
        try:
            # Use stored bucket name or get from Flask config
            bucket_name = self.bucket_name
            if not bucket_name:
                if has_app_context():
                    try:
                        config = current_app.config
                        bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                    except Exception:
                        pass
            
            if not bucket_name:
                logger.error("❌ S3 bucket name not available for deletion")
                return False
            
            self.s3_client.delete_object(
                Bucket=bucket_name,
                Key=s3_key
            )

            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"❌ Failed to delete PDF from S3: {s3_key}")
            logger.error(f"   - ClientError code: {error_code}")
            logger.error(f"   - ClientError message: {error_message}")
            
            if error_code == 'NoSuchKey':
                logger.warning(f"⚠️ S3 object '{s3_key}' does not exist (already deleted?)")
                return True  # Consider this a success since the goal is achieved
            elif error_code == 'NoSuchBucket':
                logger.error(f"   - S3 bucket '{bucket_name}' does not exist")
                logger.error("   - Check bucket configuration")
            elif error_code == 'AccessDenied':
                logger.error("   - Access denied to S3 bucket")
                logger.error("   - Check IAM permissions for the AWS credentials")
            
            return False
        except ParamValidationError as e:
            logger.error(f"❌ Parameter validation error deleting PDF: {str(e)}")
            logger.error("   - Check S3 key parameter")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error deleting PDF from S3: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - S3 Key: {s3_key}")
            logger.error(f"   - Bucket: {bucket_name}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return False
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3 with enhanced error handling and logging
        
        Args:
            s3_key: The S3 key (path) of the file
            
        Returns:
            True if file exists, False otherwise
        """
        
        # Ensure S3 client is available
        if not self._ensure_s3_client():
            logger.error("❌ S3 client not initialized - cannot check file existence")
            logger.error("   - Check AWS credentials and configuration")
            return False
        
        if not s3_key:
            logger.error("❌ No S3 key provided for existence check")
            return False
        
        try:
            # Use stored bucket name or get from Flask config
            bucket_name = self.bucket_name
            if not bucket_name:
                if has_app_context():
                    try:
                        config = current_app.config
                        bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                    except Exception:
                        pass
            
            if not bucket_name:
                logger.error("❌ S3 bucket name not available for existence check")
                return False
                        
            self.s3_client.head_object(Bucket=bucket_name, Key=s3_key)

            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404' or error_code == 'NoSuchKey':
                return False
            else:
                error_message = e.response['Error']['Message']
                logger.error(f"❌ Error checking if file exists in S3: {s3_key}")
                logger.error(f"   - ClientError code: {error_code}")
                logger.error(f"   - ClientError message: {error_message}")
                logger.error(f"   - Bucket: {bucket_name}")
                return False
        except Exception as e:
            logger.error(f"❌ Unexpected error checking file existence: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - S3 Key: {s3_key}")
            logger.error(f"   - Bucket: {bucket_name}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return False
    
    def get_pdf(self, s3_key: str) -> Optional[bytes]:
        """
        Download a PDF file from S3 and return its bytes with enhanced error handling
        
        Args:
            s3_key: The S3 key (path) of the file
            
        Returns:
            The file contents as bytes, or None if download fails
        """
        
        # Ensure S3 client is available
        if not self._ensure_s3_client():
            logger.error("❌ S3 client not initialized - cannot download PDF")
            logger.error("   - Check AWS credentials and configuration")
            return None
        
        if not s3_key:
            logger.error("❌ No S3 key provided for download")
            return None
        
        try:
            # Use stored bucket name or get from Flask config
            bucket_name = self.bucket_name
            if not bucket_name:
                if has_app_context():
                    try:
                        config = current_app.config
                        bucket_name = config.get('S3_BUCKET_NAME_PDFS')
                    except Exception:
                        pass
            
            if not bucket_name:
                logger.error("❌ S3 bucket name not available for download")
                return None
            
            
            file_obj = BytesIO()
            self.s3_client.download_fileobj(bucket_name, s3_key, file_obj)
            file_obj.seek(0)
            
            file_data = file_obj.read()
            
            return file_data
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"❌ Failed to download PDF from S3: {s3_key}")
            logger.error(f"   - ClientError code: {error_code}")
            logger.error(f"   - ClientError message: {error_message}")
            
            if error_code == 'NoSuchKey':
                logger.error(f"   - S3 object '{s3_key}' does not exist in bucket '{bucket_name}'")
                logger.error("   - Verify the file was uploaded successfully")
            elif error_code == 'NoSuchBucket':
                logger.error(f"   - S3 bucket '{bucket_name}' does not exist")
                logger.error("   - Check bucket configuration")
            elif error_code == 'AccessDenied':
                logger.error("   - Access denied to S3 bucket")
                logger.error("   - Check IAM permissions for the AWS credentials")
            
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error downloading PDF from S3: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - S3 Key: {s3_key}")
            logger.error(f"   - Bucket: {bucket_name}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return None
    
    def add_local_fallback_mechanism(self):
        """
        Add a local file fallback mechanism when S3 is not available
        """
        
        # Create local storage directory if it doesn't exist
        local_storage_dir = os.path.join(os.getcwd(), 'local_pdf_storage')
        os.makedirs(local_storage_dir, exist_ok=True)
        
        return local_storage_dir
    
    def save_pdf_locally(self, file_data: bytes, filename: str) -> Optional[str]:
        """
        Save PDF locally as fallback when S3 is not available
        
        Args:
            file_data: The PDF file data as bytes
            filename: The filename to use locally
            
        Returns:
            The local file path, or None if save failed
        """
        
        try:
            local_storage_dir = self.add_local_fallback_mechanism()
            local_file_path = os.path.join(local_storage_dir, filename)
            
            with open(local_file_path, 'wb') as f:
                f.write(file_data)
            
            return local_file_path
            
        except Exception as e:
            logger.error(f"❌ Failed to save PDF locally: {str(e)}")
            logger.error(f"   - Exception type: {type(e).__name__}")
            logger.error(f"   - Filename: {filename}")
            logger.error(f"   - Traceback: {traceback.format_exc()}")
            return None

# Global S3 service instance
s3_service = S3Service()
