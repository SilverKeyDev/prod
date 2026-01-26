"""
DocuSign recipient construction helpers

Build recipient objects for DocuSign envelopes.
"""

from typing import List, Dict, Any
from app.models import AgreementParticipant


def build_recipient_from_participant(participant: AgreementParticipant) -> Dict[str, Any]:
    """
    Build a DocuSign recipient object from an AgreementParticipant.
    
    Args:
        participant: AgreementParticipant model
        
    Returns:
        DocuSign recipient dictionary
    """
    recipient = {
        'email': participant.email,
        'name': participant.name,
        'recipientId': str(participant.id),  # Use our participant ID
        'routingOrder': str(participant.routing_order),
    }
    
    return recipient


def build_signers(participants: List[AgreementParticipant]) -> List[Dict[str, Any]]:
    """
    Build list of DocuSign signers from participants.
    
    Args:
        participants: List of AgreementParticipant models
        
    Returns:
        List of DocuSign signer dictionaries
    """
    signers = []
    
    for participant in participants:
        if participant.role == 'signer':
            signer = build_recipient_from_participant(participant)
            signers.append(signer)
    
    return signers


def build_carbon_copies(participants: List[AgreementParticipant]) -> List[Dict[str, Any]]:
    """
    Build list of DocuSign carbon copies from participants.
    
    Args:
        participants: List of AgreementParticipant models
        
    Returns:
        List of DocuSign carbon copy dictionaries
    """
    carbon_copies = []
    
    for participant in participants:
        if participant.role == 'carbon_copy':
            cc = build_recipient_from_participant(participant)
            carbon_copies.append(cc)
    
    return carbon_copies


def build_recipients_from_participants(participants: List[AgreementParticipant]) -> Dict[str, Any]:
    """
    Build complete recipients object from participants.
    
    Args:
        participants: List of AgreementParticipant models
        
    Returns:
        DocuSign recipients dictionary
    """
    recipients = {}
    
    signers = build_signers(participants)
    if signers:
        recipients['signers'] = signers
    
    carbon_copies = build_carbon_copies(participants)
    if carbon_copies:
        recipients['carbonCopies'] = carbon_copies
    
    return recipients


def validate_participants(participants: List[AgreementParticipant]) -> tuple[bool, str]:
    """
    Validate participants for DocuSign envelope creation.
    
    Args:
        participants: List of AgreementParticipant models
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not participants:
        return False, "At least one participant is required"
    
    # Must have at least one signer
    signers = [p for p in participants if p.role == 'signer']
    if not signers:
        return False, "At least one signer is required"
    
    # Check for duplicate emails in the same routing order
    routing_groups = {}
    for p in participants:
        key = (p.email, p.routing_order)
        if key in routing_groups:
            return False, f"Duplicate email {p.email} in routing order {p.routing_order}"
        routing_groups[key] = p
    
    return True, ""
