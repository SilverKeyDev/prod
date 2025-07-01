import boto3
import logging
from botocore.exceptions import ClientError, NoCredentialsError, ParamValidationError
from flask import current_app
import os
from typing import Optional, Tuple
from io import BytesIO
import traceback

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = None
        self._initialize_s3_client()
    
    def _initialize_s3_client(self):
        """Initialize the S3 client with credentials from config"""
        try:
            config = current_app.config
            logger.info("Initializing S3 client...")
            
            # Check if we have AWS credentials
            aws_access_key = config.get('AWS_ACCESS_KEY_ID')
            aws_secret_key = config.get('AWS_SECRET_ACCESS_KEY')
            
            if not aws_access_key or not aws_secret_key:
                logger.warning("AWS credentials not found in config. S3 operations will fail.")
                logger.warning(f"AWS_ACCESS_KEY_ID present: {bool(aws_access_key)}")
                logger.warning(f"AWS_SECRET_ACCESS_KEY present: {bool(aws_secret_key)}")
                return
            
            s3_region = config.get('S3_REGION', 'us-east-1')
            bucket_name = config.get('S3_BUCKET_NAME_PDFS')
            
            logger.info(f"Creating S3 client with region: {s3_region}")
            logger.info(f"Target bucket: {bucket_name}")
            
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=s3_region
            )
            
            # Test the connection and bucket access
            logger.info("Testing S3 connection and bucket access...")
            self.s3_client.head_bucket(Bucket=bucket_name)
            logger.info(f"S3 client initialized successfully for bucket: {bucket_name}")
            
        except NoCredentialsError as e:
            logger.error("AWS credentials not found or invalid")
            logger.error(f"NoCredentialsError details: {str(e)}")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"S3 client initialization failed with ClientError")
            logger.error(f"Error code: {error_code}")
            logger.error(f"Error message: {error_message}")
            
            if error_code == '404':
                logger.error(f"S3 bucket {config.get('S3_BUCKET_NAME_PDFS')} not found")
            elif error_code == '403':
                logger.error("Access denied to S3 bucket - check IAM permissions")
            elif error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket {config.get('S3_BUCKET_NAME_PDFS')} does not exist")
            
            self.s3_client = None
        except Exception as e:
            logger.error(f"Unexpected error initializing S3 client: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.s3_client = None
    
    def upload_pdf(self, file_data: bytes, filename: str, content_type: str = 'application/pdf') -> Optional[str]:
        """
        Upload a PDF file to S3
        
        Args:
            file_data: The PDF file data as bytes
            filename: The filename to use in S3
            content_type: The content type (default: application/pdf)
            
        Returns:
            The S3 key (path) of the uploaded file, or None if upload failed
        """
        if not self.s3_client:
            logger.error("S3 client not initialized - cannot upload PDF")
            return None
        
        if not file_data:
            logger.error("No file data provided for upload")
            return None
        
        if not filename:
            logger.error("No filename provided for upload")
            return None
        
        try:
            config = current_app.config
            bucket_name = config['S3_BUCKET_NAME_PDFS']
            
            logger.info(f"Uploading PDF to S3: bucket={bucket_name}, key={filename}, size={len(file_data)} bytes")
            
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
            
            logger.info(f"Successfully uploaded PDF to S3: {filename}")
            return filename
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to upload PDF to S3: {filename}")
            logger.error(f"ClientError code: {error_code}")
            logger.error(f"ClientError message: {error_message}")
            
            if error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket {bucket_name} does not exist")
            elif error_code == 'AccessDenied':
                logger.error("Access denied to S3 bucket - check IAM permissions")
            elif error_code == 'InvalidAccessKeyId':
                logger.error("Invalid AWS access key ID")
            elif error_code == 'SignatureDoesNotMatch':
                logger.error("AWS signature mismatch - check secret access key")
            
            return None
        except ParamValidationError as e:
            logger.error(f"Parameter validation error uploading PDF: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading PDF to S3: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def generate_presigned_url(self, s3_key: str, operation: str = 'get_object') -> Optional[str]:
        """
        Generate a presigned URL for downloading a PDF from S3
        
        Args:
            s3_key: The S3 key (path) of the file
            operation: The S3 operation (default: get_object for downloads)
            
        Returns:
            The presigned URL, or None if generation failed
        """
        if not self.s3_client:
            logger.error("S3 client not initialized - cannot generate presigned URL")
            return None
        
        if not s3_key:
            logger.error("No S3 key provided for presigned URL generation")
            return None
        
        try:
            config = current_app.config
            bucket_name = config['S3_BUCKET_NAME_PDFS']
            expiration = config['S3_PRESIGNED_URL_EXPIRATION']
            
            logger.info(f"Generating presigned URL: bucket={bucket_name}, key={s3_key}, expiration={expiration}s")
            
            # Generate presigned URL
            presigned_url = self.s3_client.generate_presigned_url(
                operation,
                Params={
                    'Bucket': bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            
            logger.info(f"Successfully generated presigned URL for {s3_key}")
            logger.debug(f"Presigned URL: {presigned_url[:100]}...")  # Log first 100 chars for debugging
            return presigned_url
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to generate presigned URL for {s3_key}")
            logger.error(f"ClientError code: {error_code}")
            logger.error(f"ClientError message: {error_message}")
            
            if error_code == 'NoSuchKey':
                logger.error(f"S3 object {s3_key} does not exist in bucket {bucket_name}")
            elif error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket {bucket_name} does not exist")
            elif error_code == 'AccessDenied':
                logger.error("Access denied to S3 bucket - check IAM permissions")
            
            return None
        except ParamValidationError as e:
            logger.error(f"Parameter validation error generating presigned URL: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def delete_pdf(self, s3_key: str) -> bool:
        """
        Delete a PDF file from S3
        
        Args:
            s3_key: The S3 key (path) of the file to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        if not self.s3_client:
            logger.error("S3 client not initialized - cannot delete PDF")
            return False
        
        if not s3_key:
            logger.error("No S3 key provided for deletion")
            return False
        
        try:
            config = current_app.config
            bucket_name = config['S3_BUCKET_NAME_PDFS']
            
            logger.info(f"Deleting PDF from S3: bucket={bucket_name}, key={s3_key}")
            
            self.s3_client.delete_object(
                Bucket=bucket_name,
                Key=s3_key
            )
            
            logger.info(f"Successfully deleted PDF from S3: {s3_key}")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Failed to delete PDF from S3: {s3_key}")
            logger.error(f"ClientError code: {error_code}")
            logger.error(f"ClientError message: {error_message}")
            
            if error_code == 'NoSuchKey':
                logger.warning(f"S3 object {s3_key} does not exist (already deleted?)")
                return True  # Consider this a success since the goal is achieved
            elif error_code == 'NoSuchBucket':
                logger.error(f"S3 bucket {bucket_name} does not exist")
            elif error_code == 'AccessDenied':
                logger.error("Access denied to S3 bucket - check IAM permissions")
            
            return False
        except ParamValidationError as e:
            logger.error(f"Parameter validation error deleting PDF: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting PDF from S3: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3
        
        Args:
            s3_key: The S3 key (path) of the file
            
        Returns:
            True if file exists, False otherwise
        """
        if not self.s3_client:
            logger.error("S3 client not initialized - cannot check file existence")
            return False
        
        if not s3_key:
            logger.error("No S3 key provided for existence check")
            return False
        
        try:
            config = current_app.config
            bucket_name = config['S3_BUCKET_NAME_PDFS']
            
            logger.debug(f"Checking if file exists in S3: bucket={bucket_name}, key={s3_key}")
            
            self.s3_client.head_object(Bucket=bucket_name, Key=s3_key)
            logger.debug(f"File exists in S3: {s3_key}")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404' or error_code == 'NoSuchKey':
                logger.debug(f"File does not exist in S3: {s3_key}")
                return False
            else:
                error_message = e.response['Error']['Message']
                logger.error(f"Error checking if file exists in S3: {s3_key}")
                logger.error(f"ClientError code: {error_code}")
                logger.error(f"ClientError message: {error_message}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False

# Global S3 service instance
s3_service = S3Service() 


def get_pdf(self, s3_key: str) -> Optional[bytes]:
    """
    Download a PDF file from S3 and return its bytes
    
    Args:
        s3_key: The S3 key (path) of the file
        
    Returns:
        The file contents as bytes, or None if download fails
    """
    if not self.s3_client:
        logger.error("S3 client not initialized - cannot download PDF")
        return None
    
    if not s3_key:
        logger.error("No S3 key provided for download")
        return None
    
    try:
        config = current_app.config
        bucket_name = config['S3_BUCKET_NAME_PDFS']
        
        logger.info(f"Downloading PDF from S3: bucket={bucket_name}, key={s3_key}")
        
        file_obj = BytesIO()
        self.s3_client.download_fileobj(bucket_name, s3_key, file_obj)
        file_obj.seek(0)
        
        logger.info(f"Successfully downloaded PDF from S3: {s3_key}")
        return file_obj.read()
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"Failed to download PDF from S3: {s3_key}")
        logger.error(f"ClientError code: {error_code}")
        logger.error(f"ClientError message: {error_message}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error downloading PDF from S3: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None
