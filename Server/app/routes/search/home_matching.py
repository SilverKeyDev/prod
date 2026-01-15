from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ...celery.tasks import find_best_matches_task
from ...celery.celery_worker import celery
from ...utils.security.app_logging import get_logger
from ...home_matching.preprocessing.user_input_data import get_user_data_from_dict
from ...home_matching.preprocessing.home_input_data import format_homes_data_from_api

# Configure logging
logger = get_logger()

# Create blueprint
home_matching_bp = Blueprint('home_matching', __name__, url_prefix='/api/home-matching')

@home_matching_bp.route('/find-matches', methods=['POST'])
@login_required
def find_matches():
    """
    Start a background task to find the best home matches for a user.
    
    Expected JSON payload:
    {
        "user_data": {...},
        "homes_data": [...],
        "top_k": 10,
        "include_explanations": false,
        "method_weights": {"embedding": 0.4, "tabular": 0.4, "llm": 0.2},
        "embedding_provider": "sentence_transformer",
        "llm_provider": "openai"
    }
    
    Returns:
    {
        "success": true,
        "task_id": "task-uuid",
        "status": "Task started",
        "message": "Home matching task has been queued"
    }
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        # Validate required fields
        if 'user_data' not in data:
            return jsonify({
                'success': False,
                'error': 'user_data is required'
            }), 400
        
        if 'homes_data' not in data:
            return jsonify({
                'success': False,
                'error': 'homes_data is required'
            }), 400
        
        # Extract parameters with defaults
        user_data = data['user_data']
        homes_data = data['homes_data']
        top_k = data.get('top_k', 10)
        include_explanations = data.get('include_explanations', False)
        method_weights = data.get('method_weights')
        embedding_provider = data.get('embedding_provider', 'sentence_transformer')
        llm_provider = data.get('llm_provider', 'openai')
        
        # Validate data types
        if not isinstance(homes_data, list):
            return jsonify({
                'success': False,
                'error': 'homes_data must be a list'
            }), 400
        
        if len(homes_data) == 0:
            return jsonify({
                'success': False,
                'error': 'homes_data cannot be empty'
            }), 400
        
        # Add current user info to user_data if not present
        if 'user_id' not in user_data and current_user:
            user_data['user_id'] = str(current_user.id)
        
        # Format user data using the new module for consistency
        user_data = get_user_data_from_dict(user_data)
        
        # Format homes data using the new module for consistency
        homes_data = format_homes_data_from_api(homes_data)
        
        # Start the Celery task
        task = find_best_matches_task.delay(
            user_data=user_data,
            homes_data=homes_data,
            top_k=top_k,
            include_explanations=include_explanations,
            method_weights=method_weights,
            embedding_provider=embedding_provider,
            llm_provider=llm_provider
        )
                
        return jsonify({
            'success': True,
            'task_id': task.id,
            'status': 'PENDING',
            'message': 'Home matching task has been queued',
            'user_id': user_data.get('user_id'),
            'homes_count': len(homes_data),
            'top_k': top_k,
            'include_explanations': include_explanations
        }), 202
        
    except Exception as e:
        logger.error(f"Error starting home matching task: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to start matching task: {str(e)}'
        }), 500

@home_matching_bp.route('/task-status/<task_id>', methods=['GET'])
@login_required
def get_task_status(task_id: str):
    """
    Get the status of a home matching task.
    
    Returns:
    {
        "success": true,
        "task_id": "task-uuid",
        "status": "SUCCESS|PENDING|PROGRESS|FAILURE",
        "result": {...},
        "meta": {...}
    }
    """
    try:
        # Get task result
        task_result = celery.AsyncResult(task_id)
        
        response = {
            'success': True,
            'task_id': task_id,
            'status': task_result.status,
        }
        
        if task_result.status == 'PENDING':
            response['message'] = 'Task is waiting to be processed'
            
        elif task_result.status == 'PROGRESS':
            response['meta'] = task_result.info
            response['message'] = task_result.info.get('status', 'Task is in progress')
            
        elif task_result.status == 'SUCCESS':
            response['result'] = task_result.result
            response['message'] = 'Task completed successfully'
            
        elif task_result.status == 'FAILURE':
            response['error'] = str(task_result.info)
            response['message'] = 'Task failed'
            response['success'] = False
            
        else:
            response['message'] = f'Task status: {task_result.status}'
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting task status for {task_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get task status: {str(e)}'
        }), 500

# Error handlers for the blueprint
@home_matching_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': 'Invalid request data'
    }), 400

@home_matching_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Unauthorized',
        'message': 'Authentication required'
    }), 401

@home_matching_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500
