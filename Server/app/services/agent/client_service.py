"""
Service functions for managing agent clients
"""
import json
import logging
from typing import List, Dict, Optional
from ..auth.current_user import get_current_user
from ...models import User

logger = logging.getLogger(__name__)


def get_agent_clients(agent_id: str) -> List[Dict]:
    """
    Get all clients for a specific agent
    
    Args:
        agent_id: The ID of the agent
        
    Returns:
        List of client dictionaries with id, name, email, phone, created_at
    """
    try:
        # Parse client_ids from agent's user record
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.warning(f"Agent {agent_id} not found or not an agent")
            return []
        
        if not agent.client_ids:
            return []
        
        # Parse client_ids (stored as JSON string or comma-separated string)
        try:
            if isinstance(agent.client_ids, str):
                # Try JSON first
                try:
                    client_id_list = json.loads(agent.client_ids)
                except json.JSONDecodeError:
                    # Fall back to comma-separated
                    client_id_list = [cid.strip() for cid in agent.client_ids.split(',') if cid.strip()]
            else:
                client_id_list = agent.client_ids if isinstance(agent.client_ids, list) else []
        except Exception as e:
            logger.error(f"Error parsing client_ids for agent {agent_id}: {e}")
            return []
        
        if not client_id_list:
            return []
        
        # Fetch client users
        clients = User.query.filter(User.id.in_(client_id_list)).all()
        
        # Format response
        client_list = []
        for client in clients:
            client_data = {
                'id': client.id,
                'name': client.name,
                'email': client.email,
                'phone': client.phone,
                'created_at': client.created_at.isoformat() if client.created_at else None
            }
            client_list.append(client_data)
        
        return client_list
        
    except Exception as e:
        logger.error(f"Error fetching clients for agent {agent_id}: {e}", exc_info=True)
        raise


def get_client_info(client_id: str) -> Optional[Dict]:
    """
    Get detailed information about a specific client
    
    Args:
        client_id: The ID of the client
        
    Returns:
        Client dictionary with details or None if not found
    """
    try:
        client = User.query.filter_by(id=client_id).first()
        if not client:
            return None
        
        return {
            'id': client.id,
            'name': client.name,
            'email': client.email,
            'phone': client.phone,
            'created_at': client.created_at.isoformat() if client.created_at else None,
            'is_active': client.is_active,
        }
        
    except Exception as e:
        logger.error(f"Error fetching client info for {client_id}: {e}", exc_info=True)
        raise
