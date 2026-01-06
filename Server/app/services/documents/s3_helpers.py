"""
Helper functions for S3 operations and configuration.
Centralizes common S3 operations to reduce code duplication.
"""
from flask import current_app, has_app_context
from typing import Optional, Dict, List
import os
from botocore.exceptions import ClientError

from app.utils.security.app_logging import get_logger

logger = get_logger()


def get_bucket_name() -> Optional[str]:
    """
    Get S3 bucket name from Flask config or environment.
    
    Returns:
        Bucket name or None if not configured
    """
    bucket_name = None
    
    if has_app_context():
        try:
            config = current_app.config
            bucket_name = config.get('S3_BUCKET_NAME_PDFS')
        except Exception:
            pass
    
    # Fallback to default if not found
    if not bucket_name:
        bucket_name = 'pdf-storage-jkdsfiugew'
    
    return bucket_name


def get_presigned_url_expiration() -> int:
    """
    Get presigned URL expiration time from config or environment.
    
    Returns:
        Expiration time in seconds (default: 3600)
    """
    expiration = 3600  # 1 hour default
    
    if has_app_context():
        try:
            config = current_app.config
            expiration = config.get('S3_PRESIGNED_URL_EXPIRATION', 3600)
        except Exception:
            pass
    
    if not expiration:
        expiration = int(os.getenv('S3_PRESIGNED_URL_EXPIRATION', '3600'))
    
    return expiration


def list_s3_objects(s3_client, bucket_name: str, prefix: str) -> List[Dict]:
    """
    List S3 objects with a given prefix.
    
    Args:
        s3_client: Boto3 S3 client
        bucket_name: S3 bucket name
        prefix: Prefix to filter objects
        
    Returns:
        List of object dictionaries from S3 response
    """
    if not s3_client or not bucket_name:
        logger.warning("S3 client or bucket name not available for listing")
        return []
    
    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        return response.get("Contents", [])
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"S3 list_objects_v2 failed: {error_code} - {error_message}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error listing S3 objects: {str(e)}")
        return []


def build_s3_key_path(user_id: str, report_type: str, filename: str) -> str:
    """
    Build S3 key path for reports using the standard structure.
    
    Args:
        user_id: User ID
        report_type: Type of report (standard, comparison, marketing)
        filename: Filename
        
    Returns:
        S3 key path
    """
    return f"{user_id}/reports/{report_type}/{filename}"


def parse_s3_key_path(s3_key: str) -> Optional[Dict[str, str]]:
    """
    Parse S3 key path to extract components.
    
    Args:
        s3_key: S3 key path (e.g., "user_id/reports/type/filename.pdf")
        
    Returns:
        Dictionary with user_id, report_type, filename, or None if invalid
    """
    if not s3_key or '/' not in s3_key:
        return None
    
    parts = s3_key.split('/')
    if len(parts) >= 4 and parts[1] == 'reports':
        return {
            'user_id': parts[0],
            'report_type': parts[2],
            'filename': '/'.join(parts[3:])
        }
    
    return None


def get_json_key_from_pdf_key(pdf_key: str) -> Optional[str]:
    """
    Convert PDF S3 key to corresponding JSON key.
    
    Args:
        pdf_key: PDF S3 key (e.g., "user_id/reports/type/filename.pdf")
        
    Returns:
        JSON S3 key (e.g., "user_id/json/type/filename.json") or None
    """
    parsed = parse_s3_key_path(pdf_key)
    if not parsed:
        # Fallback for old flat structure
        if pdf_key.endswith('.pdf'):
            return pdf_key.replace('.pdf', '.json')
        return None
    
    # Remove .pdf extension and add .json
    filename = parsed['filename']
    if filename.endswith('.pdf'):
        filename_without_ext = filename[:-4]  # Remove .pdf
    else:
        filename_without_ext = filename
    
    return f"{parsed['user_id']}/json/{parsed['report_type']}/{filename_without_ext}.json"
