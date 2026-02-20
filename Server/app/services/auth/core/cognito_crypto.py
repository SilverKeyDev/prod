"""Cognito secret hash for client with secret."""

import base64
import hashlib
import hmac


def get_secret_hash(client_id: str, client_secret: str, username: str) -> str:
    """Generate secret hash for Cognito (client with secret)."""
    if not username:
        raise ValueError("Username cannot be None or empty")
    if not client_id:
        raise ValueError("AWS_COGNITO_CLIENT_ID is not set in environment variables")
    if not client_secret:
        raise ValueError("AWS_COGNITO_CLIENT_SECRET is not set in environment variables")
    message = username + client_id
    dig = hmac.new(
        client_secret.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    return base64.b64encode(dig).decode()
