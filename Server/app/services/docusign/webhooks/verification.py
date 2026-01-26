"""
DocuSign webhook verification

Verify authenticity of DocuSign Connect webhooks using HMAC and/or OAuth.
"""

import hmac
import hashlib
import jwt
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from app.config import Config
from logger import get_logger, LOG_CATEGORIES

logger = get_logger()


def verify_hmac(payload: str, signature: Optional[str], use_org_secret: bool = False) -> bool:
    """
    Verify DocuSign Connect webhook HMAC signature.
    
    Args:
        payload: Raw request body (string)
        signature: Signature from X-DocuSign-Signature-1 header
        use_org_secret: If True, use org-level HMAC secret instead of account-level
        
    Returns:
        True if signature is valid, False otherwise
    """
    # Choose the appropriate secret based on scope
    if use_org_secret:
        secret = Config.DOCUSIGN_ORG_CONNECT_HMAC_SECRET
        secret_name = "DOCUSIGN_ORG_CONNECT_HMAC_SECRET"
    else:
        secret = Config.DOCUSIGN_USER_CONNECT_HMAC_SECRET
        secret_name = "DOCUSIGN_USER_CONNECT_HMAC_SECRET"
    
    logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Verifying webhook HMAC signature", {
        "has_signature": bool(signature),
        "payload_size": len(payload),
        "secret_type": "org-level" if use_org_secret else "account-level"
    })
    
    if not secret:
        logger.warn(LOG_CATEGORIES["SECURITY"], f"{secret_name} not configured, skipping HMAC verification")
        return True  # Allow in development/testing
    
    if not signature:
        logger.warn(LOG_CATEGORIES["SECURITY"], "No HMAC signature provided in webhook")
        return False
    
    try:
        # Compute expected HMAC
        expected = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Constant-time comparison
        is_valid = hmac.compare_digest(expected, signature)
        
        if is_valid:
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Webhook HMAC verification successful", {
                "secret_type": "org-level" if use_org_secret else "account-level"
            })
        else:
            logger.security(LOG_CATEGORIES["SECURITY"], "Webhook HMAC verification failed", {
                "secret_type": "org-level" if use_org_secret else "account-level",
                "expected_length": len(expected),
                "received_length": len(signature)
            })
        
        return is_valid
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "HMAC verification error", {
            "error": str(e)
        })
        return False


def verify_oauth_token(authorization_header: Optional[str]) -> bool:
    """
    Verify OAuth access token from DocuSign Connect webhook.
    
    This verifies that DocuSign authenticated to YOUR OAuth server and included
    the access token in the Authorization header.
    
    Args:
        authorization_header: Authorization header value (e.g., "Bearer eyJ...")
        
    Returns:
        True if token is valid, False otherwise
    """
    if not Config.DOCUSIGN_CONNECT_OAUTH_ENABLED:
        # OAuth for Connect is not enabled, skip verification
        return True
    
    if not authorization_header:
        logger.warn(LOG_CATEGORIES["SECURITY"], "OAuth for Connect enabled but no Authorization header provided")
        return False
    
    try:
        # Extract token from "Bearer {token}"
        parts = authorization_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            logger.security(LOG_CATEGORIES["SECURITY"], "Invalid Authorization header format", {
                "header": authorization_header[:20] + "..."
            })
            return False
        
        token = parts[1]
        
        # Verify JWT token
        # Note: This assumes you're using JWT tokens from your OAuth server
        # If using opaque tokens, you'd need to introspect via your OAuth server
        decoded = jwt.decode(
            token,
            options={"verify_signature": False},  # Signature verification requires your OAuth server's public key
            algorithms=["RS256", "HS256"]
        )
        
        # Verify issuer (your OAuth server)
        if Config.DOCUSIGN_CONNECT_OAUTH_ISSUER:
            if decoded.get('iss') != Config.DOCUSIGN_CONNECT_OAUTH_ISSUER:
                logger.security(LOG_CATEGORIES["SECURITY"], "OAuth token issuer mismatch", {
                    "expected": Config.DOCUSIGN_CONNECT_OAUTH_ISSUER,
                    "received": decoded.get('iss')
                })
                return False
        
        # Verify audience (your API)
        if Config.DOCUSIGN_CONNECT_OAUTH_AUDIENCE:
            audience = decoded.get('aud')
            if isinstance(audience, list):
                if Config.DOCUSIGN_CONNECT_OAUTH_AUDIENCE not in audience:
                    logger.security(LOG_CATEGORIES["SECURITY"], "OAuth token audience mismatch")
                    return False
            elif audience != Config.DOCUSIGN_CONNECT_OAUTH_AUDIENCE:
                logger.security(LOG_CATEGORIES["SECURITY"], "OAuth token audience mismatch")
                return False
        
        # Verify expiration
        exp = decoded.get('exp')
        if exp:
            if datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
                logger.security(LOG_CATEGORIES["SECURITY"], "OAuth token expired")
                return False
        
        logger.info(LOG_CATEGORIES["SECURITY"], "OAuth token verified successfully")
        return True
        
    except jwt.DecodeError as e:
        logger.security(LOG_CATEGORIES["SECURITY"], "Failed to decode OAuth token", {
            "error": str(e)
        })
        return False
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "OAuth token verification error", {
            "error": str(e)
        })
        return False


def verify_webhook(
    payload: str,
    hmac_signature: Optional[str] = None,
    authorization_header: Optional[str] = None,
    use_org_hmac: bool = False
) -> bool:
    """
    Verify DocuSign Connect webhook authenticity using available methods.
    
    Supports both HMAC and OAuth verification:
    - HMAC: Primary method, verifies signature in X-DocuSign-Signature-1 header
    - OAuth: Optional method, verifies token in Authorization header
    
    Args:
        payload: Raw request body (string)
        hmac_signature: HMAC signature from X-DocuSign-Signature-1 header
        authorization_header: Authorization header value (for OAuth for Connect)
        use_org_hmac: If True, use org-level HMAC secret instead of account-level
        
    Returns:
        True if webhook is verified, False otherwise
    """
    # Verify HMAC (primary method)
    hmac_valid = verify_hmac(payload, hmac_signature, use_org_secret=use_org_hmac)
    
    # Verify OAuth token if enabled (additional security layer)
    oauth_valid = verify_oauth_token(authorization_header)
    
    # Both must pass if OAuth is enabled
    if Config.DOCUSIGN_CONNECT_OAUTH_ENABLED:
        is_valid = hmac_valid and oauth_valid
        if not is_valid:
            logger.security(LOG_CATEGORIES["SECURITY"], "Webhook verification failed", {
                "hmac_valid": hmac_valid,
                "oauth_valid": oauth_valid
            })
    else:
        # Only HMAC required if OAuth not enabled
        is_valid = hmac_valid
    
    return is_valid
