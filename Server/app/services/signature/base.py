from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence


@dataclass(frozen=True)
class SignatureRecipient:
    id: str
    email: str
    name: str


@dataclass(frozen=True)
class SignatureRequest:
    agreement_id: str
    recipients: Sequence[SignatureRecipient]


class SignatureProvider(Protocol):
    """Interface for provider-agnostic agreement signature operations."""

    def create_signature_request(self, request: SignatureRequest) -> None:  # pragma: no cover - interface
        ...

    def get_signature_status(self, agreement_id: str) -> str:  # pragma: no cover - interface
        ...

    def get_signing_url(self, agreement_id: str, participant_id: str) -> str | None:  # pragma: no cover - interface
        ...

    def cancel_signature(self, agreement_id: str) -> None:  # pragma: no cover - interface
        ...


class NoOpSignatureProvider(SignatureProvider):
    """
    Temporary stub implementation used while the signing provider
    is being migrated from DocuSign to SkySlope.
    """

    def create_signature_request(self, request: SignatureRequest) -> None:
        raise NotImplementedError("Signature provider is not configured.")

    def get_signature_status(self, agreement_id: str) -> str:
        raise NotImplementedError("Signature provider is not configured.")

    def get_signing_url(self, agreement_id: str, participant_id: str) -> str | None:
        raise NotImplementedError("Signature provider is not configured.")

    def cancel_signature(self, agreement_id: str) -> None:
        raise NotImplementedError("Signature provider is not configured.")


signature_provider: SignatureProvider = NoOpSignatureProvider()

