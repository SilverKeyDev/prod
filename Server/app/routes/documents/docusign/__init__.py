"""
DocuSign routes
"""

from flask import Blueprint, request, jsonify, session, redirect
import uuid

from app.services.auth import get_current_user
from app.services.docusign import (
    AgreementLifecycleService,
    RevisionService,
    DocusignOAuthService,
    WebhookProcessor,
    TemplateSyncService,
    verify_hmac,
    verify_webhook
)
from app.services.docusign.utils.permissions import (
    can_access_agreement,
    can_modify_agreement,
    can_send_agreement,
    can_void_agreement,
    can_get_signing_url,
    is_agent
)
from app.models import Agreement, AgreementParticipant, DocusignConnectEvent, DocusignTemplate
from app import db
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from logger import get_logger, LOG_CATEGORIES
from sqlalchemy.exc import IntegrityError

logger = get_logger()
log = logger  # Convenience alias for logging calls

# Main blueprint
docusign_bp = Blueprint("docusign", __name__, url_prefix="/api/v1/docusign")

# Webhook blueprint (separate path)
webhook_bp = Blueprint("docusign_webhooks", __name__, url_prefix="/api/v1/webhooks/docusign")


# Agreement endpoints

@docusign_bp.route("/agreements", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def create_agreement():
    """Create new agreement"""
    try:
        user = get_current_user()
        if not user or not is_agent(user):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Non-agent attempted to create agreement", {
                "user_id": user.id if user else None
            })
            return jsonify({'success': False, 'error': 'Agent access required'}), 403
        
        data = request.json
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating agreement", {
            "agent_id": user.id,
            "buyer_id": data.get('buyer_id'),
            "agreement_type": data.get('agreement_type'),
            "title": data.get('title')
        })
        
        # Validate required fields
        required_fields = ['title', 'agreement_type', 'buyer_id']
        for field in required_fields:
            if field not in data:
                log.warn(LOG_CATEGORIES["DOCUSIGN"], "Missing required field", {
                    "field": field,
                    "agent_id": user.id
                })
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        agreement = AgreementLifecycleService.create_agreement(
            agent_id=user.id,
            buyer_id=data['buyer_id'],
            title=data['title'],
            agreement_type=data['agreement_type'],
            property_address=data.get('property_address'),
            description=data.get('description')
        )
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement created successfully", {
            "agreement_id": agreement.id,
            "agent_id": user.id,
            "buyer_id": data['buyer_id'],
            "agreement_type": data['agreement_type']
        })
        
        return jsonify({
            'success': True,
            'agreement': agreement.to_dict(include_relationships=True)
        }), 201
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to create agreement", {
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to create agreement")


@docusign_bp.route("/agreements/<agreement_id>", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def get_agreement(agreement_id):
    """Get agreement details"""
    try:
        user = get_current_user()
        if not user:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated agreement access attempt", {
                "agreement_id": agreement_id
            })
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching agreement", {
            "agreement_id": agreement_id,
            "user_id": user.id
        })
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        if not can_access_agreement(user, agreement):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "User denied access to agreement", {
                "agreement_id": agreement_id,
                "user_id": user.id
            })
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement retrieved successfully", {
            "agreement_id": agreement_id,
            "user_id": user.id,
            "status": agreement.status
        })
        
        return jsonify({
            'success': True,
            'agreement': agreement.to_dict(include_relationships=True)
        }), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to get agreement", {
            "agreement_id": agreement_id,
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to get agreement")


@docusign_bp.route("/agreements", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def list_agreements():
    """List agreements for current user"""
    try:
        user = get_current_user()
        if not user:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated list agreements attempt")
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Listing agreements", {
            "user_id": user.id,
            "is_agent": is_agent(user)
        })
        
        # Get agreements where user is agent or buyer
        if is_agent(user):
            agreements = Agreement.query.filter_by(agent_id=user.id).all()
        else:
            agreements = Agreement.query.filter_by(buyer_id=user.id).all()
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Agreements listed successfully", {
            "user_id": user.id,
            "count": len(agreements),
            "is_agent": is_agent(user)
        })
        
        return jsonify({
            'success': True,
            'agreements': [a.to_dict() for a in agreements]
        }), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to list agreements", {
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to list agreements")


# Revision endpoints

@docusign_bp.route("/agreements/<agreement_id>/revisions", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def create_revision(agreement_id):
    """Create new revision"""
    try:
        user = get_current_user()
        if not user:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated revision creation attempt", {
                "agreement_id": agreement_id
            })
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        if not can_modify_agreement(user, agreement):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "User denied access to modify agreement", {
                "agreement_id": agreement_id,
                "user_id": user.id
            })
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get file from request
        if 'file' not in request.files:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Revision creation without file", {
                "agreement_id": agreement_id,
                "user_id": user.id
            })
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        file_content = file.read()
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating agreement revision", {
            "agreement_id": agreement_id,
            "user_id": user.id,
            "filename": file.filename,
            "file_size": len(file_content)
        })
        
        revision = RevisionService.create_revision(
            agreement_id=agreement_id,
            file_content=file_content,
            filename=file.filename,
            created_by=user.id,
            notes=request.form.get('notes')
        )
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement revision created successfully", {
            "agreement_id": agreement_id,
            "revision_id": revision.id,
            "user_id": user.id,
            "filename": file.filename
        })
        
        return jsonify({
            'success': True,
            'revision': revision.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to create revision", {
            "agreement_id": agreement_id,
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to create revision")


# Send/void endpoints

@docusign_bp.route("/agreements/<agreement_id>/send", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def send_agreement(agreement_id):
    """Send agreement for signature"""
    try:
        user = get_current_user()
        if not user:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated send agreement attempt", {
                "agreement_id": agreement_id
            })
            return jsonify({'error': 'Authentication required'}), 401
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        if not can_send_agreement(user, agreement):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "User denied access to send agreement", {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "agreement_status": agreement.status
            })
            return jsonify({'error': 'Access denied or invalid state'}), 403
        
        data = request.json or {}
        signing_method = data.get('signing_method', 'embedded')
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Sending agreement for signature", {
            "agreement_id": agreement_id,
            "user_id": user.id,
            "signing_method": signing_method,
            "agreement_status": agreement.status
        })
        
        task_id = AgreementLifecycleService.send_for_signature(
            agreement_id=agreement_id,
            signing_method=signing_method,
            actor_id=user.id
        )
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement send task enqueued", {
            "agreement_id": agreement_id,
            "user_id": user.id,
            "task_id": task_id,
            "signing_method": signing_method
        })
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'message': 'Agreement is being sent'
        }), 202
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to send agreement", {
            "agreement_id": agreement_id,
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to send agreement")


@docusign_bp.route("/agreements/<agreement_id>/void", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def void_agreement(agreement_id):
    """Void an agreement"""
    try:
        user = get_current_user()
        if not user:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated void agreement attempt", {
                "agreement_id": agreement_id
            })
            return jsonify({'error': 'Authentication required'}), 401
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        if not can_void_agreement(user, agreement):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "User denied access to void agreement", {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "agreement_status": agreement.status
            })
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.json or {}
        reason = data.get('reason', 'Voided by agent')
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Voiding agreement", {
            "agreement_id": agreement_id,
            "user_id": user.id,
            "reason": reason,
            "current_status": agreement.status
        })
        
        AgreementLifecycleService.void_agreement(
            agreement_id=agreement_id,
            reason=reason,
            actor_id=user.id
        )
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement voided successfully", {
            "agreement_id": agreement_id,
            "user_id": user.id,
            "reason": reason
        })
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to void agreement", {
            "agreement_id": agreement_id,
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to void agreement")


# Signing URL endpoint

@docusign_bp.route("/agreements/<agreement_id>/signing-url", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def get_signing_url(agreement_id):
    """Get embedded signing URL"""
    try:
        user = get_current_user()
        if not user:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated signing URL request", {
                "agreement_id": agreement_id
            })
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        data = request.json or {}
        participant_id = data.get('participant_id')
        
        if not participant_id:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Signing URL request without participant_id", {
                "agreement_id": agreement_id,
                "user_id": user.id
            })
            return jsonify({'success': False, 'error': 'participant_id required'}), 400
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Generating signing URL", {
            "agreement_id": agreement_id,
            "participant_id": participant_id,
            "user_id": user.id
        })
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        participant = AgreementParticipant.query.get(participant_id)
        
        if not participant or participant.agreement_id != agreement_id:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Participant not found for signing URL", {
                "agreement_id": agreement_id,
                "participant_id": participant_id,
                "user_id": user.id
            })
            return jsonify({'success': False, 'error': 'Participant not found'}), 404
        
        if not can_get_signing_url(user, agreement, participant):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "User denied access to signing URL", {
                "agreement_id": agreement_id,
                "participant_id": participant_id,
                "user_id": user.id
            })
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        signing_url = AgreementLifecycleService.get_signing_url(
            agreement_id=agreement_id,
            participant_id=participant_id
        )
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Signing URL generated successfully", {
            "agreement_id": agreement_id,
            "participant_id": participant_id,
            "user_id": user.id,
            "participant_email": participant.email
        })
        
        return jsonify({
            'success': True,
            'signing_url': signing_url
        }), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to get signing URL", {
            "agreement_id": agreement_id,
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to get signing URL")


# OAuth endpoints

@docusign_bp.route("/oauth/start", methods=["GET"])
@rate_limit(max_requests=10, window_seconds=60)
def oauth_start():
    """Start DocuSign OAuth flow"""
    try:
        user = get_current_user()
        if not user or not is_agent(user):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Non-agent attempted OAuth start", {
                "user_id": user.id if user else None
            })
            return jsonify({'success': False, 'error': 'Agent access required'}), 403
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Starting DocuSign OAuth flow", {
            "user_id": user.id
        })
        
        auth_url, state = DocusignOAuthService.build_auth_url(user.id)
        
        # Store state in session
        session['docusign_oauth_state'] = state
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "OAuth flow started successfully", {
            "user_id": user.id,
            "state": state[:8] + "..."  # Log partial state for debugging
        })
        
        return jsonify({
            'success': True,
            'auth_url': auth_url
        }), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "OAuth start failed", {
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "OAuth start failed")


@docusign_bp.route("/oauth/callback", methods=["GET"])
@rate_limit(max_requests=10, window_seconds=60)
def oauth_callback():
    """Handle OAuth callback"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Received OAuth callback", {
            "has_code": bool(code),
            "has_state": bool(state),
            "state_prefix": state[:8] + "..." if state else None
        })
        
        # Verify state
        stored_state = session.get('docusign_oauth_state')
        if not stored_state or stored_state != state:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "OAuth state verification failed", {
                "has_stored_state": bool(stored_state),
                "states_match": stored_state == state if stored_state and state else False
            })
            return jsonify({'error': 'Invalid state'}), 400
        
        # Extract user ID and exchange code
        user_id = DocusignOAuthService.extract_user_id_from_state(state)
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Exchanging OAuth code for tokens", {
            "user_id": user_id
        })
        
        DocusignOAuthService.exchange_code_for_tokens(user_id, code)
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "OAuth flow completed successfully", {
            "user_id": user_id
        })
        
        # Redirect to frontend
        from app.config import get_frontend_url
        return redirect(f"{get_frontend_url()}/settings/docusign?connected=true")
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "OAuth callback failed", {
            "error": str(e)
        })
        from app.config import get_frontend_url
        return redirect(f"{get_frontend_url()}/settings/docusign?error=true")


# Webhook endpoint

@webhook_bp.route("/connect", methods=["POST"])
def docusign_connect_webhook():
    """Receive DocuSign Connect webhooks"""
    try:
        # Get raw payload and headers
        payload = request.get_data(as_text=True)
        hmac_signature = request.headers.get('X-DocuSign-Signature-1')
        authorization_header = request.headers.get('Authorization')
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Received DocuSign webhook", {
            "has_hmac": bool(hmac_signature),
            "has_auth": bool(authorization_header),
            "payload_size": len(payload)
        })
        
        # Determine if this is org-level or account-level webhook
        # Check for org-level indicators in the payload
        use_org_hmac = False
        try:
            data = request.json
            # If payload contains org-level identifiers, use org-level HMAC
            if data.get('organizationId') or data.get('accountId') in ['org-level-indicator']:
                use_org_hmac = True
        except:
            pass
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Verifying webhook authenticity", {
            "use_org_hmac": use_org_hmac
        })
        
        # Verify webhook authenticity (HMAC + OAuth if enabled)
        if not verify_webhook(
            payload=payload,
            hmac_signature=hmac_signature,
            authorization_header=authorization_header,
            use_org_hmac=use_org_hmac
        ):
            logger.security(LOG_CATEGORIES["SECURITY"], "Webhook verification failed")
            return jsonify({'error': 'Webhook verification failed'}), 401
        
        # Parse data
        data = request.json
        envelope_id = data.get('envelopeId') or data.get('data', {}).get('envelopeSummary', {}).get('envelopeId')
        event_type = data.get('event') or data.get('eventType')
        event_timestamp = data.get('generatedDateTime') or data.get('generated')
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Parsed webhook data", {
            "envelope_id": envelope_id,
            "event_type": event_type,
            "event_timestamp": event_timestamp
        })
        
        if not envelope_id or not event_type:
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Invalid webhook payload", {
                "has_envelope_id": bool(envelope_id),
                "has_event_type": bool(event_type)
            })
            return jsonify({'error': 'Invalid payload'}), 400
        
        # Store event
        event = DocusignConnectEvent(
            id=str(uuid.uuid4()),
            envelope_id=envelope_id,
            event_type=event_type,
            event_timestamp=event_timestamp,
            payload=payload,
            hmac_verified=True
        )
        
        try:
            db.session.add(event)
            db.session.commit()
            
            log.info(LOG_CATEGORIES["DOCUSIGN"], "Webhook event stored", {
                "event_id": event.id,
                "envelope_id": envelope_id,
                "event_type": event_type
            })
        except IntegrityError:
            # Duplicate event
            db.session.rollback()
            log.info(LOG_CATEGORIES["DOCUSIGN"], "Duplicate webhook event received", {
                "envelope_id": envelope_id,
                "event_type": event_type
            })
            return jsonify({'success': True, 'duplicate': True}), 200
        
        # Enqueue processing
        from app.celery.tasks.docusign import process_webhook_task
        process_webhook_task.delay(event.id)
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Webhook processing task enqueued", {
            "event_id": event.id,
            "envelope_id": envelope_id,
            "event_type": event_type
        })
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Webhook processing failed", {
            "error": str(e)
        })
        return jsonify({'error': 'Processing failed'}), 500


# Template endpoints

@docusign_bp.route("/templates", methods=["GET"])
@rate_limit(max_requests=50, window_seconds=60)
def list_templates():
    """List available templates"""
    try:
        user = get_current_user()
        if not user or not is_agent(user):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Non-agent attempted to list templates", {
                "user_id": user.id if user else None
            })
            return jsonify({'success': False, 'error': 'Agent access required'}), 403
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Listing DocuSign templates", {
            "user_id": user.id
        })
        
        templates = DocusignTemplate.query.filter_by(is_active=True).all()
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Templates listed successfully", {
            "user_id": user.id,
            "count": len(templates)
        })
        
        return jsonify({
            'success': True,
            'templates': [t.to_dict() for t in templates]
        }), 200
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to list templates", {
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to list templates")


@docusign_bp.route("/templates/sync", methods=["POST"])
@rate_limit(max_requests=5, window_seconds=60)
def sync_templates():
    """Sync templates from DocuSign"""
    try:
        user = get_current_user()
        if not user or not is_agent(user):
            log.warn(LOG_CATEGORIES["DOCUSIGN"], "Non-agent attempted to sync templates", {
                "user_id": user.id if user else None
            })
            return jsonify({'error': 'Agent access required'}), 403
        
        log.debug(LOG_CATEGORIES["DOCUSIGN"], "Starting template sync", {
            "user_id": user.id
        })
        
        from app.celery.tasks.docusign import sync_templates_task
        task = sync_templates_task.delay()
        
        log.info(LOG_CATEGORIES["DOCUSIGN"], "Template sync task enqueued", {
            "user_id": user.id,
            "task_id": task.id
        })
        
        return jsonify({
            'success': True,
            'task_id': task.id,
            'message': 'Template sync started'
        }), 202
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to sync templates", {
            "error": str(e)
        })
        return SecureErrorHandler.handle_error(e, "Failed to sync templates")
