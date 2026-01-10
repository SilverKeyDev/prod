"""
Service functions for managing agent-client conversations
"""
import json
import sys
import os
from typing import List, Dict, Optional
from datetime import datetime, timezone
from ..auth.current_user import get_current_user
from ...models import User, AgentConnections, ChatHistory
from ... import db
from .connection_request_service import get_connection_requests

# Initialize centralized logger
server_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import log, LOG_CATEGORIES


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
        if not user_id:
            log.warn(LOG_CATEGORIES["API"], "get_conversations called with empty user_id")
            return []
        
        if is_agent:
            # Get all conversations where user is the agent
            conversations = AgentConnections.query.filter_by(agent_id=user_id).all()
        else:
            # Get all conversations where user is the client
            conversations = AgentConnections.query.filter_by(client_id=user_id).all()
        
        result = []
        for conv in conversations:
            # Get the client's info (always needed for client_name/client_email)
            client = User.query.filter_by(id=conv.client_id).first()
            client_name = client.name if client else "Unknown"
            client_email = client.email if client else ""
            
            # Get the agent's info (for display purposes)
            agent = User.query.filter_by(id=conv.agent_id).first()
            agent_name = agent.name if agent else "Unknown"
            agent_email = agent.email if agent else ""
            
            # Get last message
            last_message_obj = ChatHistory.query.filter_by(
                conversation_id=conv.id
            ).order_by(ChatHistory.timestamp.desc()).first()
            
            # Calculate unread count for this user
            unread_count = get_unread_count(conv.id, user_id)
            
            # Get last read timestamp for this user
            last_read = conv.get_last_read(user_id)
            
            # Helper function to format datetime as timezone-aware UTC ISO string
            def format_timestamp(dt):
                if not dt:
                    return None
                if dt.tzinfo is None:
                    # Naive datetime - assume UTC and make it timezone-aware
                    dt_aware = dt.replace(tzinfo=timezone.utc)
                else:
                    dt_aware = dt.astimezone(timezone.utc)
                return dt_aware.isoformat()
            
            conv_dict = {
                'id': conv.id,
                'agent_id': conv.agent_id,
                'client_id': conv.client_id,
                'client_name': client_name,
                'client_email': client_email,
                'agent_name': agent_name,
                'agent_email': agent_email,
                'last_message': last_message_obj.message if last_message_obj else None,
                'last_message_at': format_timestamp(last_message_obj.timestamp if last_message_obj else None),
                'created_at': format_timestamp(conv.created_at),
                'updated_at': format_timestamp(conv.updated_at),
                'unread_count': unread_count,
                'last_read_at': format_timestamp(last_read),
            }
            result.append(conv_dict)
        
        return result
        
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error fetching conversations for user {user_id}", e)
        raise


def get_conversation(conversation_id: str, user_id: str = None) -> Optional[Dict]:
    """
    Get a specific conversation by ID
    
    Args:
        conversation_id: The ID of the conversation
        user_id: Optional user ID to include last_read_at for that user
        
    Returns:
        Conversation dictionary or None if not found
    """
    try:
        conv = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conv:
            return None
        
        return conv.to_dict(user_id=user_id)
        
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error fetching conversation {conversation_id}", e)
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
        existing = AgentConnections.query.filter_by(
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
        conversation = AgentConnections(
            agent_id=agent_id,
            client_id=client_id
        )
        db.session.add(conversation)
        db.session.commit()
        
        return conversation.to_dict()
        
    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error creating conversation", e)
        raise


def get_conversation_history(conversation_id: str, user_id: str = None) -> Dict:
    """
    Get chat history for a conversation
    
    Args:
        conversation_id: The ID of the conversation
        user_id: Optional user ID to include read status for messages
        
    Returns:
        Dictionary with messages array and conversation info
    """
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Get all messages for this conversation
        messages = ChatHistory.query.filter_by(
            conversation_id=conversation_id
        ).order_by(ChatHistory.timestamp.asc()).all()
        
        message_list = []
        for msg in messages:
            # Determine the other participant's ID for read receipt display
            other_user_id = None
            if user_id and conversation:
                if str(user_id) == str(conversation.agent_id):
                    other_user_id = conversation.client_id
                elif str(user_id) == str(conversation.client_id):
                    other_user_id = conversation.agent_id
            
            # Get read status
            is_read = False
            read_at = None
            if other_user_id:
                is_read = msg.is_read_by(other_user_id)
                if msg.read_at:
                    try:
                        read_at_dict = msg.read_at if isinstance(msg.read_at, dict) else (json.loads(msg.read_at) if isinstance(msg.read_at, str) else {})
                        read_at = read_at_dict.get(other_user_id)
                    except:
                        pass
            
            # Format timestamp as timezone-aware UTC ISO string
            timestamp_str = None
            if msg.timestamp:
                # Convert naive datetime to timezone-aware UTC, then format
                if msg.timestamp.tzinfo is None:
                    # Naive datetime - assume UTC and make it timezone-aware
                    timestamp_aware = msg.timestamp.replace(tzinfo=timezone.utc)
                else:
                    timestamp_aware = msg.timestamp.astimezone(timezone.utc)
                timestamp_str = timestamp_aware.isoformat()
            
            message_dict = {
                'id': msg.id,
                'conversation_id': msg.conversation_id,
                'sender_id': msg.sender_id,
                'role': msg.role,
                'message': msg.message,
                'shared_home_id': msg.shared_home_id,
                'timestamp': timestamp_str,
                'is_read': is_read,
                'read_at': read_at,
            }
            message_list.append(message_dict)
        
        return {
            'messages': message_list,
            'conversation': conversation.to_dict(user_id=user_id),
        }
        
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error fetching conversation history for {conversation_id}", e)
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
        if not conversation_id:
            raise ValueError("conversation_id is required")
        if not sender_id:
            raise ValueError("sender_id is required")
        if not message:
            raise ValueError("message is required")
        
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Verify sender is part of the conversation
        if str(sender_id) != str(conversation.agent_id) and str(sender_id) != str(conversation.client_id):
            raise ValueError(f"User {sender_id} is not part of conversation {conversation_id}")
        
        # Create message with timezone-aware UTC timestamp
        chat_message = ChatHistory(
            user_id=sender_id,
            conversation_id=conversation_id,
            sender_id=sender_id,
            role=role,
            message=message,
            shared_home_id=shared_home_id,
            timestamp=datetime.now(timezone.utc)
        )
        
        # Update conversation's last_message_at with timezone-aware UTC timestamp
        now_utc = datetime.now(timezone.utc)
        conversation.last_message_at = now_utc
        conversation.updated_at = now_utc
        
        db.session.add(chat_message)
        db.session.commit()
        
        return {
            'message_id': chat_message.id,
        }
        
    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error sending message", e)
        raise


def get_unread_count(conversation_id: str, user_id: str) -> int:
    """
    Get the number of unread messages for a user in a conversation
    
    Args:
        conversation_id: The ID of the conversation
        user_id: The ID of the user
        
    Returns:
        Number of unread messages
    """
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            return 0
        
        # Get the last read timestamp for this user
        last_read = conversation.get_last_read(user_id)
        
        # Count messages sent by the other participant after last_read
        if str(user_id) == str(conversation.agent_id):
            # User is agent, count messages from client
            other_user_id = conversation.client_id
        elif str(user_id) == str(conversation.client_id):
            # User is client, count messages from agent
            other_user_id = conversation.agent_id
        else:
            return 0
        
        query = ChatHistory.query.filter_by(
            conversation_id=conversation_id,
            sender_id=other_user_id
        )
        
        if last_read:
            query = query.filter(ChatHistory.timestamp > last_read)
        
        unread_count = query.count()
        return unread_count
        
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error calculating unread count for conversation {conversation_id}, user {user_id}", e)
        return 0


def mark_messages_as_read(conversation_id: str, user_id: str) -> Dict:
    """
    Mark all messages in a conversation as read by a user
    
    Args:
        conversation_id: The ID of the conversation
        user_id: The ID of the user marking messages as read
        
    Returns:
        Dictionary with success status and count of marked messages
    """
    try:
        conversation = AgentConnections.query.filter_by(id=conversation_id).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Verify user is part of the conversation
        if str(user_id) != str(conversation.agent_id) and str(user_id) != str(conversation.client_id):
            raise ValueError(f"User {user_id} is not part of conversation {conversation_id}")
        
        # Get the other participant's ID (messages from them should be marked as read)
        if str(user_id) == str(conversation.agent_id):
            other_user_id = conversation.client_id
        else:
            other_user_id = conversation.agent_id
        
        # Get all unread messages from the other participant
        messages = ChatHistory.query.filter_by(
            conversation_id=conversation_id,
            sender_id=other_user_id
        ).all()
        
        marked_count = 0
        for msg in messages:
            if not msg.is_read_by(user_id):
                msg.mark_as_read(user_id)
                marked_count += 1
        
        # Update conversation's last_read_at for this user
        conversation.update_last_read(user_id)
        
        db.session.commit()
        
        return {
            'success': True,
            'marked_count': marked_count
        }
        
    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error marking messages as read", e)
        raise


def get_notification_counter(user_id: str, is_agent: bool) -> int:
    """
    Get total notification count (unread messages + pending connection requests)
    
    Args:
        user_id: The ID of the user
        is_agent: Whether the user is an agent
        
    Returns:
        Total count of unread messages and pending requests
    """
    try:
        if not user_id:
            log.warn(LOG_CATEGORIES["API"], "get_notification_counter called with empty user_id")
            return 0
        
        # Get all conversations for the user
        conversations = get_conversations(user_id, is_agent)
        
        # Sum unread counts from all conversations
        total_unread_messages = sum(conv.get('unread_count', 0) for conv in conversations)
        
        # Get pending connection requests
        connection_requests = get_connection_requests(user_id, is_agent)
        pending_requests_count = len([req for req in connection_requests if req.get('status') == 'pending'])
        
        # Return total count
        total_count = total_unread_messages + pending_requests_count
                
        return total_count
        
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error calculating notification counter for user {user_id}", e)
        return 0
