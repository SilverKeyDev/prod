from flask import Blueprint, request, jsonify
from jose.exceptions import ExpiredSignatureError, JWTError
import json
import logging

from ...services.auth import get_current_user, SecurityException
from ...utils.common_patterns import require_authenticated_user, require_agent_access, handle_exceptions_with_logging
from ...utils.security.security import security_error_response, SecurityError, rate_limit
from ...utils.security.secure_errors import SecureErrorHandler
from ...services.agent import (
    get_agent_clients,
    get_conversations,
    get_conversation,
    create_conversation,
    get_conversation_history,
    send_message as send_conversation_message,
    mark_messages_as_read,
    get_notification_counter,
    search_agents,
    search_clients,
    get_connection_requests,
    create_connection_request,
    respond_to_connection_request,
    get_agent_todos,
    create_todo,
    update_todo,
    delete_todo,
)

logger = logging.getLogger(__name__)

agent_bp = Blueprint('agent', __name__, url_prefix='/api/v1/agent')


@agent_bp.route('/clients', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def get_clients(user):
    """Get list of clients for authenticated agent"""
    clients = get_agent_clients(user.id)
    
    return jsonify({
        'success': True,
        'clients': clients
    })


@agent_bp.route('/chats', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_chats(user):
    """Get list of conversations for authenticated user (agent or client)"""
    # Optional client_id filter for agents
    client_id = request.args.get('client_id')
    
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in get_chats")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    # Get conversations - pass is_agent flag
    conversations = get_conversations(str(user.id), bool(user.is_agent))
    
    # Filter by client_id if provided (for agents)
    if client_id and user.is_agent:
        conversations = [c for c in conversations if c.get('client_id') == client_id]
    
    return jsonify({
        'success': True,
        'conversations': conversations
    })


@agent_bp.route('/chats', methods=['POST'])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def create_chat(user):
    """Create a new conversation between agent and client"""
    try:
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
        }), 201

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({
            'success': False,
            'error': 'Authentication required'
        }), 401

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e,
            {
                'function': 'create_chat',
                'user_id': user.id if user else 'unknown'
            }
        )



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
        
        # Validate user.id exists
        if not user.id:
            logger.error("User ID is None in get_chat_history")
            return jsonify({
                'success': False,
                'error': 'Invalid user session'
            }), 401
        
        history = get_conversation_history(conversation_id, user_id=str(user.id))
        
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
        shared_document_id = data.get('shared_document_id')  # Optional: ID of shared document
        
        # Debug logging for troubleshooting
        logger.info(f"[SEND_MESSAGE] Request data: conversation_id={conversation_id}, "
                   f"message_length={len(message) if message else 0}, "
                   f"has_shared_home={bool(shared_home_id)}, "
                   f"has_shared_document={bool(shared_document_id)}, "
                   f"user_id={user.id}, is_agent={user.is_agent}")
        
        if not conversation_id:
            logger.warning("[SEND_MESSAGE] Missing conversation_id")
            return jsonify({
                'success': False,
                'error': 'conversation_id is required'
            }), 400
        
        # Validate message type and content
        if message is None or not isinstance(message, str):
            logger.warning(f"[SEND_MESSAGE] Invalid message type: {type(message)}")
            return jsonify({
                'success': False,
                'error': 'message must be a string'
            }), 400
        
        # Allow empty message only if there's an attachment
        has_attachment = bool(shared_home_id or shared_document_id)
        if not message.strip() and not has_attachment:
            logger.warning("[SEND_MESSAGE] Empty message without attachment")
            return jsonify({
                'success': False,
                'error': 'message cannot be empty unless sharing a home or document'
            }), 400
        
        # Determine role based on user type
        role = 'agent' if user.is_agent else 'user'
        
        # If conversation doesn't exist yet, create it first
        if not conversation_id or conversation_id == "new":
            if not user.id:
                logger.error("User ID is None when creating conversation")
                return jsonify({
                    'success': False,
                    'error': 'Invalid user session'
                }), 401
            
            if user.is_agent:
                # Agent creating conversation with a client
                client_id = data.get('client_id')
                if not client_id:
                    return jsonify({
                        'success': False,
                        'error': 'client_id is required to create conversation'
                    }), 400
                
                conversation = create_conversation(str(user.id), str(client_id))
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
                
                conversation = create_conversation(str(agent_id), str(user.id))
                conversation_id = conversation['id']
        else:
            # Verify user has access to this conversation
            if not user.id:
                logger.error("User ID is None when checking conversation access")
                return jsonify({
                    'success': False,
                    'error': 'Invalid user session'
                }), 401
            
            conversation = get_conversation(conversation_id)
            if not conversation:
                return jsonify({
                    'success': False,
                    'error': 'Conversation not found'
                }), 404
            
            # Check if user is part of the conversation (convert to strings for comparison)
            if str(conversation['agent_id']) != str(user.id) and str(conversation['client_id']) != str(user.id):
                return jsonify({
                    'success': False,
                    'error': 'Access denied'
                }), 403
        
        # Validate user.id exists
        if not user.id:
            logger.error("User ID is None in send_message")
            return jsonify({
                'success': False,
                'error': 'Invalid user session'
            }), 401
        
        result = send_conversation_message(
            conversation_id,
            str(user.id),
            message,
            role,
            shared_home_id=shared_home_id,
            shared_document_id=shared_document_id
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
@handle_exceptions_with_logging
@require_agent_access
def search_clients_endpoint(user):
    """Search for clients (for agents)"""
    try:
        
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if len(query) < 2:
            return jsonify({
                'success': True,
                'clients': []
            })
        
        # Validate user.id exists
        if not user.id:
            logger.error("User ID is None in search_clients_endpoint")
            return jsonify({
                'success': False,
                'error': 'Invalid user session'
            }), 401
        
        clients = search_clients(query, user.id, limit)
        
        return jsonify({
            'success': True,
            'clients': clients
        })
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'search_clients',
            'user_id': getattr(user, 'id', 'unknown')
        })


@agent_bp.route('/connection-requests', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_connection_requests_endpoint(user):
    """Get connection requests for authenticated user"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in get_connection_requests_endpoint")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    requests = get_connection_requests(user.id, bool(user.is_agent))
    
    return jsonify({
        'success': True,
        'requests': requests
    })


@agent_bp.route('/connection-requests', methods=['POST'])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def create_connection_request_endpoint(user):
    """Create a connection request"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in create_connection_request_endpoint")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    try:
        
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
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'create_connection_request',
            'user_id': getattr(user, 'id', 'unknown')
        })


@agent_bp.route('/connection-requests/<request_id>/respond', methods=['POST'])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def respond_to_connection_request_endpoint(user, request_id):
    """Accept or reject a connection request"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in respond_to_connection_request_endpoint")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    try:
        
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
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'respond_to_connection_request',
            'user_id': getattr(user, 'id', 'unknown')
        })


@agent_bp.route('/notification-counter', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_notification_counter_endpoint(user):
    """Get total notification count (unread messages + pending requests)"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in get_notification_counter")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    total_count = get_notification_counter(str(user.id), bool(user.is_agent))
    
    return jsonify({
        'success': True,
        'total_count': total_count
    })


@agent_bp.route('/chats/<conversation_id>/read', methods=['POST'])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def mark_chat_as_read(user, conversation_id):
    """Mark all messages in a conversation as read"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in mark_chat_as_read")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    try:
        # Verify user has access to this conversation
        conversation = get_conversation(conversation_id)
        if not conversation:
            return jsonify({
                'success': False,
                'error': 'Conversation not found'
            }), 404
        
        # Check if user is part of the conversation
        if str(conversation['agent_id']) != str(user.id) and str(conversation['client_id']) != str(user.id):
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        result = mark_messages_as_read(conversation_id, str(user.id))
        
        return jsonify({
            'success': True,
            **result
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'mark_chat_as_read',
            'user_id': getattr(user, 'id', 'unknown')
        })


@agent_bp.route('/todos', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def get_todos(user):
    """Get list of todos for authenticated agent"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in get_todos")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    include_completed = request.args.get('include_completed', 'false').lower() == 'true'
    todos = get_agent_todos(str(user.id), include_completed=include_completed)
    
    return jsonify({
        'success': True,
        'todos': todos
    })


@agent_bp.route('/todos', methods=['POST'])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def create_todo_endpoint(user):
    """Create a new todo"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in create_todo_endpoint")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    try:
        
        data = request.get_json(force=True)
        title = data.get('title')
        due_date_str = data.get('due_date')
        priority = data.get('priority', 'medium')
        todo_type = data.get('type', 'manual')
        client_id = data.get('client_id')
        description = data.get('description')
        
        if not title:
            return jsonify({
                'success': False,
                'error': 'title is required'
            }), 400
        
        if not due_date_str:
            return jsonify({
                'success': False,
                'error': 'due_date is required'
            }), 400
        
        try:
            from datetime import datetime
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Invalid due_date format: {str(e)}'
            }), 400
        
        todo = create_todo(
            agent_id=str(user.id),
            title=title,
            due_date=due_date,
            priority=priority,
            todo_type=todo_type,
            client_id=client_id,
            description=description
        )
        
        return jsonify({
            'success': True,
            'todo': todo
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'create_todo',
            'user_id': getattr(user, 'id', 'unknown')
        })


@agent_bp.route('/todos/<todo_id>', methods=['PUT'])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def update_todo_endpoint(user, todo_id):
    """Update a todo"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in update_todo_endpoint")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    try:
        
        data = request.get_json(force=True)
        
        # Parse due_date if provided
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'priority' in data:
            update_data['priority'] = data['priority']
        if 'type' in data:
            update_data['type'] = data['type']
        if 'due_date' in data:
            try:
                from datetime import datetime
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                update_data['due_date'] = due_date
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Invalid due_date format: {str(e)}'
                }), 400
        if 'completed' in data:
            update_data['completed'] = bool(data['completed'])
        if 'client_id' in data:
            update_data['client_id'] = data['client_id']
        
        todo = update_todo(todo_id, str(user.id), **update_data)
        
        return jsonify({
            'success': True,
            'todo': todo
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
            'function': 'update_todo',
            'user_id': 'unknown'
        })


@agent_bp.route('/todos/<todo_id>', methods=['DELETE'])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def delete_todo_endpoint(user, todo_id):
    """Delete a todo"""
    # Validate user.id exists
    if not user.id:
        logger.error("User ID is None in delete_todo_endpoint")
        return jsonify({
            'success': False,
            'error': 'Invalid user session'
        }), 401
    
    try:
        delete_todo(todo_id, str(user.id))
        
        return jsonify({
            'success': True
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'delete_todo',
            'user_id': getattr(user, 'id', 'unknown')
        })
