"""PKCE (Proof Key for Code Exchange) utilities for SkySlope OAuth."""

import base64
import hashlib
import secrets


def generate_pkce() -> tuple[str, str]:
    """
    Generate PKCE code_verifier and code_challenge per RFC 7636.

    Returns:
        Tuple of (code_verifier, code_challenge).
        code_verifier: 43 random bytes, base64url-encoded.
        code_challenge: base64url(SHA256(code_verifier)).
    """
    raw_verifier = secrets.token_bytes(43)
    code_verifier = base64.urlsafe_b64encode(raw_verifier).rstrip(b"=").decode("ascii")
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge
