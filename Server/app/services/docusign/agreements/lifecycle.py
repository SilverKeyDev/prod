"""
Agreement lifecycle service (thin façade for backward compatibility).

This module provides the original AgreementLifecycleService class interface
while delegating to the split modules for implementation.
"""

from app.models import Agreement, AgreementParticipant

from .agreement_crud import create_agreement as _create_agreement
from .agreement_crud import get_agreement as _get_agreement
from .participant_operations import add_participant as _add_participant
from .participant_operations import remove_participant as _remove_participant
from .participant_operations import sync_signer_participant as _sync_signer_participant
from .participant_operations import (
    update_participant_routing_order as _update_participant_routing_order,
)
from .signature_flow import discard_agreement_as_agent as _discard_agreement_as_agent
from .signature_flow import send_for_signature as _send_for_signature
from .signature_flow import void_agreement as _void_agreement
from .signing_urls import get_sender_view_url as _get_sender_view_url
from .signing_urls import get_signing_url as _get_signing_url


class AgreementLifecycleService:
    """High-level agreement operations (façade)"""

    @staticmethod
    def _sync_signer_participant(
        agreement: Agreement, participant_user_id: str, actor_id: str
    ) -> bool:
        """
        Ensure selected user is the active signer participant (legacy single-signer method).

        Note: For new code, use add_participant() for multi-signer support.
        This method is kept for backward compatibility.

        Returns:
            True when participant rows were changed, else False.
        """
        return _sync_signer_participant(agreement, participant_user_id, actor_id)

    @staticmethod
    def add_participant(
        agreement_id: str,
        user_id: str,
        role: str = "signer",
        routing_order: int | None = None,
        actor_id: str | None = None,
    ) -> AgreementParticipant:
        """
        Add a participant to an agreement.

        Supports multiple signers with sequential routing. Each signer can have a
        different routing order, enabling workflows where signer 2 only receives the
        envelope after signer 1 completes.

        Args:
            agreement_id: Agreement ID
            user_id: User ID of participant
            role: Participant role ('signer', 'carbon_copy', 'agent', etc.)
            routing_order: Signing order (1 = first, 2 = second, etc.). Auto-assigned if None.
            actor_id: User adding the participant (optional, for validation)

        Returns:
            Created AgreementParticipant

        Raises:
            AgreementStateError: If agreement not in draft status or user not found
        """
        return _add_participant(agreement_id, user_id, role, routing_order, actor_id)

    @staticmethod
    def remove_participant(agreement_id: str, participant_id: str) -> None:
        """
        Remove a participant from an agreement.

        Can only remove participants from draft agreements.

        Args:
            agreement_id: Agreement ID
            participant_id: Participant ID to remove

        Raises:
            AgreementStateError: If agreement not in draft status or participant not found
        """
        _remove_participant(agreement_id, participant_id)

    @staticmethod
    def update_participant_routing_order(
        agreement_id: str, participant_id: str, new_routing_order: int
    ) -> AgreementParticipant:
        """
        Update the routing order of a participant.

        Changes the signing sequence for multi-signer workflows.
        Can only update participants in draft agreements.

        Args:
            agreement_id: Agreement ID
            participant_id: Participant ID
            new_routing_order: New routing order (1 = first, 2 = second, etc.)

        Returns:
            Updated AgreementParticipant

        Raises:
            AgreementStateError: If agreement not in draft or participant not found
        """
        return _update_participant_routing_order(agreement_id, participant_id, new_routing_order)

    @staticmethod
    def create_agreement(
        agent_id: str, buyer_id: str, title: str, agreement_type: str, **kwargs
    ) -> Agreement:
        """
        Create new agreement.

        Args:
            agent_id: Agent user ID
            buyer_id: Buyer user ID
            title: Agreement title
            agreement_type: Type (e.g., 'offer', 'inspection')
            **kwargs: Additional fields

        Returns:
            Created Agreement
        """
        return _create_agreement(agent_id, buyer_id, title, agreement_type, **kwargs)

    @staticmethod
    def get_agreement(agreement_id: str) -> Agreement:
        """Get agreement by ID"""
        return _get_agreement(agreement_id)

    @staticmethod
    def send_for_signature(
        agreement_id: str,
        signing_method: str,
        actor_id: str,
        participant_user_id: str | None = None,
    ):
        """
        Enqueue task to send agreement for signature.

        Args:
            agreement_id: Agreement ID
            signing_method: 'embedded' or 'email'
            actor_id: User initiating send
            participant_user_id: Optional selected signer user ID
        """
        return _send_for_signature(agreement_id, signing_method, actor_id, participant_user_id)

    @staticmethod
    def void_agreement(agreement_id: str, reason: str, actor_id: str):
        """
        Void an agreement.

        Args:
            agreement_id: Agreement ID
            reason: Void reason
            actor_id: User voiding
        """
        _void_agreement(agreement_id, reason, actor_id)

    @staticmethod
    def discard_agreement_as_agent(agreement_id: str, reason: str, actor_id: str):
        """
        Agent removes agreement from Saved for themselves and their client: voids when
        DocuSign allows, otherwise drops the shared library row only.
        """
        _discard_agreement_as_agent(agreement_id, reason, actor_id)

    @staticmethod
    def get_signing_url(agreement_id: str, participant_id: str) -> str:
        """
        Get embedded signing URL for participant.

        Args:
            agreement_id: Agreement ID
            participant_id: Participant ID

        Returns:
            Signing URL
        """
        return _get_signing_url(agreement_id, participant_id)

    @staticmethod
    def get_sender_view_url(agreement_id: str) -> str:
        """
        Get sender view URL for agreement owner (agent).

        Args:
            agreement_id: Agreement ID

        Returns:
            Sender view URL
        """
        return _get_sender_view_url(agreement_id)
