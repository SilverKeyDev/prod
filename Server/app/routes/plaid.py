"""
Plaid Routes
Handles Plaid Link integration for proof of funds and bank statements
"""

from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
from datetime import datetime
from jose.exceptions import ExpiredSignatureError, JWTError

from ..utils.auth import get_current_user, SecurityException
from ..utils.security import security_error_response, SecurityError, rate_limit
from ..utils.secure_errors import SecureErrorHandler
from ..models.plaid import PlaidItem, PlaidAssetReport
from .. import db
from ..services.plaid_client import (
    create_link_token,
    exchange_public_token,
    create_asset_report,
    get_asset_report,
    get_asset_report_pdf,
    list_statements,
    download_statement,
)

plaid_bp = Blueprint("plaid", __name__, url_prefix="/api/v1/plaid")


@plaid_bp.route("/link-token/create", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def route_link_token_create():
    """Create a Plaid Link token for frontend integration"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        # Get products from request body, default to assets for proof of funds
        body = request.get_json(silent=True) or {}
        products = body.get("products") or ["assets"]

        resp = create_link_token(user_id=user.id, products=tuple(products))
        return jsonify({
            "success": True,
            "data": resp.to_dict()
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except ValueError as e:
        # Handle Plaid configuration errors
        if "PLAID_CLIENT_ID" in str(e) or "PLAID_SECRET" in str(e):
            return jsonify({
                'success': False, 
                'error': 'PLAID_NOT_CONFIGURED',
                'message': 'Plaid integration is not configured. Please contact support.'
            }), 503
        else:
            return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_link_token_create',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/item/public_token/exchange", methods=["POST"])
@rate_limit(max_requests=20, window_seconds=60)
def route_public_token_exchange():
    """Exchange public token for access token and store securely"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        body = request.get_json() or {}
        public_token = body.get("public_token")
        if not public_token:
            return jsonify({
                'success': False,
                'error': 'MISSING_PUBLIC_TOKEN',
                'message': 'public_token is required'
            }), 400

        # Exchange public token for access token
        resp = exchange_public_token(public_token)
        data = resp.to_dict()
        access_token = data["access_token"]
        item_id = data["item_id"]

        # Check if item already exists
        existing_item = PlaidItem.query.filter_by(item_id=item_id).first()
        if existing_item:
            # Update existing item
            existing_item.access_token = access_token
            existing_item.status = 'active'
            existing_item.last_sync = datetime.utcnow()
            existing_item.updated_at = datetime.utcnow()
        else:
            # Create new item
            plaid_item = PlaidItem(
                user_id=user.id,
                item_id=item_id,
                access_token=access_token,
                status='active',
                linked_at=datetime.utcnow(),
                last_sync=datetime.utcnow()
            )
            db.session.add(plaid_item)

        db.session.commit()

        # Never return access_token to the client
        return jsonify({
            "success": True,
            "data": {"item_id": item_id}
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_public_token_exchange',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/assets/report/create", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def route_assets_report_create():
    """Create an asset report for proof of funds"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        # Get user's active Plaid items
        plaid_items = PlaidItem.query.filter_by(user_id=user.id, status='active').all()
        if not plaid_items:
            return jsonify({
                'success': False,
                'error': 'NO_LINKED_ITEMS',
                'message': 'No linked bank accounts found'
            }), 400

        body = request.get_json(silent=True) or {}
        days = int(body.get("days", 60))  # typical PoF window

        # Get access tokens from all active items
        access_tokens = [item.access_token for item in plaid_items]

        # Create asset report
        resp = create_asset_report(access_tokens, days_requested=days)
        data = resp.to_dict()
        asset_report_token = data["asset_report_token"]

        # Store report info in database
        asset_report = PlaidAssetReport(
            user_id=user.id,
            plaid_item_id=plaid_items[0].id,  # Reference to first item
            asset_report_token=asset_report_token,
            asset_report_id=data.get("asset_report_id"),
            status='pending',
            days_requested=days
        )
        db.session.add(asset_report)
        db.session.commit()

        return jsonify({
            "success": True,
            "data": {
                "asset_report_token": asset_report_token,
                "request_id": data.get("request_id")
            }
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_assets_report_create',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/assets/report/get", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def route_assets_report_get():
    """Get asset report data (JSON)"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        asset_report_token = request.args.get("asset_report_token")
        if not asset_report_token:
            return jsonify({
                'success': False,
                'error': 'MISSING_TOKEN',
                'message': 'asset_report_token is required'
            }), 400

        # Verify user owns this report
        report = PlaidAssetReport.query.filter_by(
            user_id=user.id,
            asset_report_token=asset_report_token
        ).first()
        if not report:
            return jsonify({
                'success': False,
                'error': 'REPORT_NOT_FOUND',
                'message': 'Asset report not found'
            }), 404

        resp = get_asset_report(asset_report_token)
        return jsonify({
            "success": True,
            "data": resp.to_dict()
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_assets_report_get',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/assets/report/pdf", methods=["GET"])
@rate_limit(max_requests=20, window_seconds=60)
def route_assets_report_pdf():
    """Get asset report as PDF"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        asset_report_token = request.args.get("asset_report_token")
        if not asset_report_token:
            return jsonify({
                'success': False,
                'error': 'MISSING_TOKEN',
                'message': 'asset_report_token is required'
            }), 400

        # Verify user owns this report
        report = PlaidAssetReport.query.filter_by(
            user_id=user.id,
            asset_report_token=asset_report_token
        ).first()
        if not report:
            return jsonify({
                'success': False,
                'error': 'REPORT_NOT_FOUND',
                'message': 'Asset report not found'
            }), 404

        pdf_bytes = get_asset_report_pdf(asset_report_token)
        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name="proof_of_funds.pdf",
        )
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_assets_report_pdf',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/statements/list", methods=["GET"])
@rate_limit(max_requests=50, window_seconds=60)
def route_statements_list():
    """List available bank statements"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        # Get user's active Plaid items
        plaid_items = PlaidItem.query.filter_by(user_id=user.id, status='active').all()
        if not plaid_items:
            return jsonify({
                'success': False,
                'error': 'NO_LINKED_ITEMS',
                'message': 'No linked bank accounts found'
            }), 400

        account_id = request.args.get("account_id")  # optional filter
        access_token = plaid_items[0].access_token  # Use first item's token

        resp = list_statements(access_token, account_id=account_id)
        return jsonify({
            "success": True,
            "data": resp.to_dict()
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_statements_list',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/statements/download", methods=["GET"])
@rate_limit(max_requests=20, window_seconds=60)
def route_statements_download():
    """Download a specific bank statement as PDF"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        # Get user's active Plaid items
        plaid_items = PlaidItem.query.filter_by(user_id=user.id, status='active').all()
        if not plaid_items:
            return jsonify({
                'success': False,
                'error': 'NO_LINKED_ITEMS',
                'message': 'No linked bank accounts found'
            }), 400

        statement_id = request.args.get("statement_id")
        if not statement_id:
            return jsonify({
                'success': False,
                'error': 'MISSING_STATEMENT_ID',
                'message': 'statement_id is required'
            }), 400

        access_token = plaid_items[0].access_token  # Use first item's token
        pdf = download_statement(access_token, statement_id)
        
        return send_file(
            BytesIO(pdf),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"statement_{statement_id}.pdf",
        )
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_statements_download',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/webhook", methods=["POST"])
def route_webhook():
    """Handle Plaid webhooks for asset report status updates"""
    try:
        # NOTE: In production, verify Plaid signature if using signed webhooks
        event = request.get_json() or {}
        
        # Handle asset report status updates
        if event.get('webhook_type') == 'ASSETS':
            asset_report_token = event.get('asset_report_token')
            if asset_report_token:
                report = PlaidAssetReport.query.filter_by(
                    asset_report_token=asset_report_token
                ).first()
                if report:
                    if event.get('webhook_code') == 'PRODUCT_READY':
                        report.status = 'ready'
                    elif event.get('webhook_code') == 'PRODUCT_ERROR':
                        report.status = 'error'
                    report.updated_at = datetime.utcnow()
                    db.session.commit()

        return jsonify({
            "success": True,
            "data": {"received": True}
        })
        
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_webhook',
            'user_id': 'webhook'
        })


@plaid_bp.route("/items", methods=["GET"])
@rate_limit(max_requests=50, window_seconds=60)
def route_get_items():
    """Get user's linked Plaid items"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        plaid_items = PlaidItem.query.filter_by(user_id=user.id).all()
        return jsonify({
            "success": True,
            "data": [item.to_dict() for item in plaid_items]
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_get_items',
            'user_id': getattr(user, 'id', 'unknown')
        })


@plaid_bp.route("/items/<item_id>/disconnect", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def route_disconnect_item(item_id):
    """Disconnect a Plaid item"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)

        plaid_item = PlaidItem.query.filter_by(
            user_id=user.id,
            item_id=item_id
        ).first()
        
        if not plaid_item:
            return jsonify({
                'success': False,
                'error': 'ITEM_NOT_FOUND',
                'message': 'Plaid item not found'
            }), 404

        # Update status to disconnected
        plaid_item.status = 'disconnected'
        plaid_item.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "success": True,
            "data": {"message": "Item disconnected successfully"}
        })
        
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(e, {
            'function': 'route_disconnect_item',
            'user_id': getattr(user, 'id', 'unknown')
        })