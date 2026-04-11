"""
Signature provider interfaces and implementations.

This module defines the signature provider protocol that can be implemented
by various signature services (e.g., DocuSign, HelloSign, etc.).
"""

from .base import (
    NoOpSignatureProvider,
    SignatureProvider,
    SignatureRecipient,
    SignatureRequest,
    signature_provider,
)

__all__ = [
    "SignatureProvider",
    "SignatureRequest",
    "SignatureRecipient",
    "NoOpSignatureProvider",
    "signature_provider",
]
