"""
Service functions for managing agent-client conversations
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from ..auth.current_user import get_current_user
from ...models.user import User
from ...models.agent_conversation import AgentConversation
from ...models.chat_history import ChatHistory
from ... import db

logger = logging.getLogger(__name__)


def get_conversations(user_id: str, is_agent: bool) -> List[Dict]:
    """
    Get all conversations for a user (agent or client)
    
    Args:
        user_id: The ID of the user
        is_agent: Whether the user is an agent
        
    Returns:
        List of conversation dictionaries with metadata
    """
    try:
        if is_agent:
            # Get all conversations where user is the agent
            conversations = AgentConversation.query.filter_by(agent_id=user_id).all()
        else:
            # Get all conversations where user is the client
            conversations = AgentConversation.query.filter_by(client_id=user_id).all()
        
        result = []
        for conv in conversations:
            # Get the other party's info
            if is_agent:
                other_party = User.query.filter_by(id=conv.client_id).first()
                other_party_name = other_party.name if other_party else "Unknown"
                other_party_email = other_party.email if other_party else ""
            else:
                other_party = User.query.filter_by(id=conv.agent_id).first()
                other_party_name = other_party.name if other_party else "Unknown"
                other_party_email = other_party.email if other_party else ""
            
            # Get last message
            last_message_obj = ChatHistory.query.filter_by(
                conversation_id=conv.id
            ).order_by(ChatHistory.timestamp.desc()).first()
            
            conv_dict = {
                'id': conv.id,
                'agent_id': conv.agent_id,
                'client_id': conv.client_id,
                'client_name': other_party_name if not is_agent else (User.query.filter_by(id=conv.client_id).first().name if User.query.filter_by(id=conv.client_id).first() else ""),
                'client_email': other_party_email if not is_agent else (User.query.filter_by(id=conv.client_id).first().email if User.query.filter_by(id=conv.client_id).first() else ""),
                'last_message': last_message_obj.message if last_message_obj else None,
                'last_message_at': last_message_obj.timestamp.isoformat() if last_message_obj and last_message_obj.timestamp else None,
                'created_at': conv.created_at.isoformat() if conv.created_at else None,
                'updated_at': conv.updated_at.isoformat() if conv.updated_at else None,
            }
            result.append(conv_dict)
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching conversations for user {user_id}: {e}", exc_info=True)
        raise


def get_conversation(conversation_id: str) -> Optional[Dict]:
    """
    Get a specific conversation by ID
    
    Args:
        conversation_id: The ID of the conversation
        
    Returns:
        Conversation dictionary or None if not found
    """
    try:
        conv = AgentConversation.query.filter_by(id=conversation_id).first()
        if not conv:
            return None
        
        return {
            'id': conv.id,
            'agent_id': conv.agent_id,
            'client_id': conv.client_id,
            'created_at': conv.created_at.isoformat() if conv.created_at else None,
            'updated_at': conv.updated_at.isoformat() if conv.updated_at else None,
            'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None,
        }
        
    except Exception as e:
        logger.error(f"Error fetching conversation {conversation_id}: {e}", exc_info=True)
        raise


def create_conversation(agent_id: str, client_id: str) -> Dict:
    """
    Create a new conversation between an agent and client
    
    Args:
        agent_id: The ID of the agent
        client_id: The ID of the client
        
    Returns:
        Created conversation dictionary
    """
    try:
        # Check if conversation already exists
        existing = AgentConversation.query.filter_by(
            agent_id=agent_id,
            client_id=client_id
        ).first()
        
        if existing:
            return existing.to_dict()
        
        # Verify agent and client exist
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found or not an agent")
        
        client = User.query.filter_by(id=client_id).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        # Verify client is assigned to agent
        if agent.client_ids:
            try:
                import json
                client_ids = json.loads(agent.client_ids) if isinstance(agent.client_ids, str) else agent.client_ids
                if client_id not in client_ids:
                    raise ValueError(f"Client {client_id} is not assigned to agent {agent_id}")
            except:
                # If parsing fails, check comma-separated
                if client_id not in agent.client_ids.split(','):
                    raise ValueError(f"Client {client_id} is not assigned to agent {agent_id}")
        
        # Create conversation
        conversation = AgentConversation(
            agent_id=agent_id,
            client_id=client_id
        )
        db.session.add(conversation)
        db.session.commit()
        
        return conversation.to_dict()
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating conversation: {e}", exc_info=True)
        raise


def get_conversation_history(conversation_id: str) -> Dict:
    """
    Get chat history for a conversation
    
    Args:
        conversation_id: The ID of the conversation
        
    Returns:
        Dictionary with messages array and conversation info
    """
    try:
        conversation = AgentConversation.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Get all messages for this conversation
        messages = ChatHistory.query.filter_by(
            conversation_id=conversation_id
        ).order_by(ChatHistory.timestamp.asc()).all()
        
        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg.id,
                'conversation_id': msg.conversation_id,
                'sender_id': msg.sender_id,
                'role': msg.role,
                'message': msg.message,
                'shared_home_id': msg.shared_home_id,
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else None,
            })
        
        return {
            'messages': message_list,
            'conversation': conversation.to_dict(),
        }
        
    except Exception as e:
        logger.error(f"Error fetching conversation history for {conversation_id}: {e}", exc_info=True)
        raise


def send_message(conversation_id: str, sender_id: str, message: str, role: str, shared_home_id: Optional[str] = None) -> Dict:
    """
    Send a message in a conversation
    
    Args:
        conversation_id: The ID of the conversation
        sender_id: The ID of the user sending the message
        message: The message content
        role: The role of the sender ('user' for client, 'agent' for agent)
        shared_home_id: Optional ID of a shared home/property
        
    Returns:
        Dictionary with message_id
    """
    try:
        conversation = AgentConversation.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Verify sender is part of the conversation
        if sender_id != conversation.agent_id and sender_id != conversation.client_id:
            raise ValueError(f"User {sender_id} is not part of conversation {conversation_id}")
        
        # Create message
        chat_message = ChatHistory(
            user_id=sender_id,
            conversation_id=conversation_id,
            sender_id=sender_id,
            role=role,
            message=message,
            shared_home_id=shared_home_id,
            timestamp=datetime.utcnow()
        )
        
        # Update conversation's last_message_at
        conversation.last_message_at = datetime.utcnow()
        conversation.updated_at = datetime.utcnow()
        
        db.session.add(chat_message)
        db.session.commit()
        
        return {
            'message_id': chat_message.id,
        }
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error sending message: {e}", exc_info=True)
        raise
