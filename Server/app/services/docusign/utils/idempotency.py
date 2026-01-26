"""
DocuSign idempotency helpers

Generate idempotency keys for DocuSign operations.
"""

import hashlib
import json
from typing import List, Dict, Any


def generate_envelope_key(agreement_id: str, revision_id: str, participants: List[Dict[str, Any]]) -> str:
    """
    Generate an idempotency key for envelope creation.
    
    Args:
        agreement_id: Agreement ID
        revision_id: Revision ID
        participants: List of participant data
        
    Returns:
        Idempotency key (SHA-256 hash)
    """
    # Sort participants by email to ensure consistent ordering
    sorted_participants = sorted(participants, key=lambda p: p.get('email', ''))
    
    # Create a deterministic string
    data = {
        'agreement_id': agreement_id,
        'revision_id': revision_id,
        'participants': [
            {
                'email': p.get('email'),
                'role': p.get('role'),
                'routing_order': p.get('routing_order', 1)
            }
            for p in sorted_participants
        ]
    }
    
    # Generate SHA-256 hash
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()


def generate_webhook_key(envelope_id: str, event_type: str, timestamp: str) -> str:
    """
    Generate an idempotency key for webhook events.
    
    Args:
        envelope_id: DocuSign envelope ID
        event_type: Event type
        timestamp: Event timestamp
        
    Returns:
        Idempotency key
    """
    return f"{envelope_id}:{event_type}:{timestamp}"


def generate_file_hash(file_content: bytes) -> str:
    """
    Generate SHA-256 hash for file content.
    
    Args:
        file_content: File bytes
        
    Returns:
        SHA-256 hash (hex)
    """
    return hashlib.sha256(file_content).hexdigest()
