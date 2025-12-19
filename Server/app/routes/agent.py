from flask import Blueprint, request, jsonify
from jose.exceptions import ExpiredSignatureError, JWTError
import json
import logging

from ..services.auth.current_user import get_current_user, SecurityException
from ..utils.security.security import security_error_response, SecurityError, rate_limit
from ..utils.security.secure_errors import SecureErrorHandler
from ..services.agent import (
    get_agent_clients,
    get_conversations,
    get_conversation,
    create_conversation,
    get_conversation_history,
    send_message as send_conversation_message,
    search_agents,
    search_clients,
    get_connection_requests,
    create_connection_request,
    respond_to_connection_request,
)

logger = logging.getLogger(__name__)

agent_bp = Blueprint('agent', __name__, url_prefix='/api/v1/agent')


@agent_bp.route('/clients', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
def get_clients():
    """Get list of clients for authenticated agent"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        if not user.is_agent:
            return jsonify({
                'success': False,
                'error': 'Only agents can access this endpoint'
            }), 403
        
        clients = get_agent_clients(user.id)
        
        return jsonify({
            'success': True,
            'clients': clients
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_clients',
            'user_id': 'unknown'
        })


@agent_bp.route('/chats', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
def get_chats():
    """Get list of conversations for authenticated user (agent or client)"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        # Optional client_id filter for agents
        client_id = request.args.get('client_id')
        
        # Get conversations - pass is_agent flag
        conversations = get_conversations(user.id, bool(user.is_agent))
        
        # Filter by client_id if provided (for agents)
        if client_id and user.is_agent:
            conversations = [c for c in conversations if c.get('client_id') == client_id]
        
        return jsonify({
            'success': True,
            'conversations': conversations
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_chats',
            'user_id': 'unknown'
        })


@agent_bp.route('/chats', methods=['POST'])
@rate_limit(max_requests=100, window_seconds=60)
def create_chat():
    """Create a new conversation between agent and client"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        if not user.is_agent:
            return jsonify({
                'success': False,
                'error': 'Only agents can create conversations'
            }), 403
        
        data = request.get_json(force=True)
        client_id = data.get('client_id')
        
        if not client_id:
            return jsonify({
                'success': False,
                'error': 'client_id is required'
            }), 400
        
        conversation = create_conversation(user.id, client_id)
        
        return jsonify({
            'success': True,
            'conversation': conversation
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'create_chat',
            'user_id': 'unknown'
        })


@agent_bp.route('/chats/<conversation_id>/history', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
def get_chat_history(conversation_id):
    """Get chat history for a specific conversation"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        # Verify user has access to this conversation
        conversation = get_conversation(conversation_id)
        if not conversation:
            return jsonify({
                'success': False,
                'error': 'Conversation not found'
            }), 404
        
        # Check if user is part of the conversation
        if conversation['agent_id'] != user.id and conversation['client_id'] != user.id:
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        history = get_conversation_history(conversation_id)
        
        return jsonify({
            'success': True,
            **history
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_chat_history',
            'user_id': 'unknown'
        })


@agent_bp.route('/chats/message', methods=['POST'])
@rate_limit(max_requests=100, window_seconds=60)
def send_message():
    """Send a message in a conversation"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        data = request.get_json(force=True)
        conversation_id = data.get('conversation_id')
        message = data.get('message')
        shared_home_id = data.get('shared_home_id')  # Optional: ID of shared home
        
        if not conversation_id:
            return jsonify({
                'success': False,
                'error': 'conversation_id is required'
            }), 400
        
        if not message or not isinstance(message, str):
            return jsonify({
                'success': False,
                'error': 'message is required and must be a string'
            }), 400
        
        # Determine role based on user type
        role = 'agent' if user.is_agent else 'user'
        
        # If conversation doesn't exist yet, create it first
        if not conversation_id or conversation_id == "new":
            if user.is_agent:
                # Agent creating conversation with a client
                client_id = data.get('client_id')
                if not client_id:
                    return jsonify({
                        'success': False,
                        'error': 'client_id is required to create conversation'
                    }), 400
                
                conversation = create_conversation(user.id, client_id)
                conversation_id = conversation['id']
            else:
                # Client creating conversation - need to get agent_id from user's agent_id field
                agent_id = None
                if user.agent_id:
                    try:
                        agent_ids = json.loads(user.agent_id) if isinstance(user.agent_id, str) else user.agent_id
                        agent_id = agent_ids[0] if isinstance(agent_ids, list) and len(agent_ids) > 0 else (agent_ids if isinstance(agent_ids, str) else None)
                    except:
                        # Fall back to comma-separated
                        agent_id = user.agent_id.split(',')[0] if user.agent_id else None
                
                if not agent_id:
                    return jsonify({
                        'success': False,
                        'error': 'No agent assigned. Please contact support.'
                    }), 400
                
                conversation = create_conversation(agent_id, user.id)
                conversation_id = conversation['id']
        else:
            # Verify user has access to this conversation
            conversation = get_conversation(conversation_id)
            if not conversation:
                return jsonify({
                    'success': False,
                    'error': 'Conversation not found'
                }), 404
            
            # Check if user is part of the conversation
            if conversation['agent_id'] != user.id and conversation['client_id'] != user.id:
                return jsonify({
                    'success': False,
                    'error': 'Access denied'
                }), 403
        
        result = send_conversation_message(
            conversation_id,
            user.id,
            message,
            role,
            shared_home_id=shared_home_id
        )
        
        logger.info(f"Message sent successfully in conversation {conversation_id} by user {user.id}")
        return jsonify({
            'success': True,
            'message_id': result['message_id']
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        logger.warning(f"Authentication error in send_message: {str(e)}")
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except ValueError as e:
        logger.warning(f"Validation error in send_message: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'send_message',
            'user_id': 'unknown'
        })


@agent_bp.route('/search-agents', methods=['GET'])
@rate_limit(max_requests=100, window_seconds=60)
def search_agents_endpoint():
    """Search for agents (for clients)"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if len(query) < 2:
            return jsonify({
                'success': True,
                'agents': []
            })
        
        agents = search_agents(query, limit)
        
        return jsonify({
            'success': True,
            'agents': agents
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'search_agents',
            'user_id': 'unknown'
        })


@agent_bp.route('/search-clients', methods=['GET'])
@rate_limit(max_requests=100, window_seconds=60)
def search_clients_endpoint():
    """Search for clients (for agents)"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        if not user.is_agent:
            return jsonify({
                'success': False,
                'error': 'Only agents can search for clients'
            }), 403
        
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if len(query) < 2:
            return jsonify({
                'success': True,
                'clients': []
            })
        
        clients = search_clients(query, user.id, limit)
        
        return jsonify({
            'success': True,
            'clients': clients
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'search_clients',
            'user_id': 'unknown'
        })


@agent_bp.route('/connection-requests', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
def get_connection_requests_endpoint():
    """Get connection requests for authenticated user"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        requests = get_connection_requests(user.id, bool(user.is_agent))
        
        return jsonify({
            'success': True,
            'requests': requests
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'get_connection_requests',
            'user_id': 'unknown'
        })


@agent_bp.route('/connection-requests', methods=['POST'])
@rate_limit(max_requests=50, window_seconds=60)
def create_connection_request_endpoint():
    """Create a connection request"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        data = request.get_json(force=True)
        agent_id = data.get('agent_id')
        client_id = data.get('client_id')
        message = data.get('message')
        
        if not agent_id or not client_id:
            return jsonify({
                'success': False,
                'error': 'agent_id and client_id are required'
            }), 400
        
        # Determine who is requesting
        if user.is_agent:
            if user.id != agent_id:
                return jsonify({
                    'success': False,
                    'error': 'Agent can only request connections for themselves'
                }), 403
            requested_by_agent = True
        else:
            if user.id != client_id:
                return jsonify({
                    'success': False,
                    'error': 'Client can only request connections for themselves'
                }), 403
            requested_by_agent = False
        
        request_obj = create_connection_request(agent_id, client_id, requested_by_agent, message)
        
        return jsonify({
            'success': True,
            'request': request_obj
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'create_connection_request',
            'user_id': 'unknown'
        })


@agent_bp.route('/connection-requests/<request_id>/respond', methods=['POST'])
@rate_limit(max_requests=50, window_seconds=60)
def respond_to_connection_request_endpoint(request_id):
    """Accept or reject a connection request"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        
        data = request.get_json(force=True)
        accept = data.get('accept', False)
        
        request_obj = respond_to_connection_request(
            request_id,
            user.id,
            bool(user.is_agent),
            accept
        )
        
        return jsonify({
            'success': True,
            'request': request_obj
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'respond_to_connection_request',
            'user_id': 'unknown'
        })
