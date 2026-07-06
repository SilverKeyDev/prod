"""
Buyer-broker agreement review gate routes — SIL-183.

Routes:
  GET  /api/v1/transactions/{tx_id}/buyer-broker-review         — current status
  POST /api/v1/transactions/{tx_id}/buyer-broker-review/approve — agent approves after call
  POST /api/v1/transactions/{tx_id}/buyer-broker-review/request-meeting — agent requests meeting

All routes require the authenticated user to be the assigned agent on the transaction.
Audit events logged to buyer_broker_review_events for RESPA compliance.
LogPath: TRANSACTIONS.BBA_REVIEW
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import jsonify
from flask import request as req
from sqlalchemy import select

from app import db
from app.models.transactions.buyer_broker_review import BuyerBrokerReview, BuyerBrokerReviewEvent
from app.schemas import EmptyRequest
from app.services.transactions.access import resolve_authorized_transaction
from app.utils.common_patterns import (
    forbidden,
    handle_exceptions_with_logging,
    require_authenticated_user,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request
from logger import log

from .. import transactions_bp


def _get_or_create_review(transaction_id: str) -> BuyerBrokerReview:
    """Get existing review row or create pending_review for this transaction."""
    review = db.session.scalar(
        select(BuyerBrokerReview).where(BuyerBrokerReview.transaction_id == str(transaction_id))
    )
    if review is None:
        review = BuyerBrokerReview(
            transaction_id=str(transaction_id),
            status="pending_review",
        )
        db.session.add(review)
        db.session.flush()
    return review


def _log_event(
    review: BuyerBrokerReview,
    event_type: str,
    agent_id: str,
    note: str | None = None,
) -> None:
    event = BuyerBrokerReviewEvent(
        review_id=review.id,
        event_type=event_type,
        actor_agent_id=str(agent_id),
        note=note,
    )
    db.session.add(event)


def _review_payload(review: BuyerBrokerReview) -> dict:
    return {
        "review_id": review.id,
        "transaction_id": review.transaction_id,
        "status": review.status,
        "approved_by_agent_id": review.approved_by_agent_id,
        "approved_at": review.approved_at.isoformat() if review.approved_at else None,
        "meeting_requested_by_agent_id": review.meeting_requested_by_agent_id,
        "meeting_requested_at": (
            review.meeting_requested_at.isoformat() if review.meeting_requested_at else None
        ),
        "meeting_note": review.meeting_note,
        "agreement_sent_at": (
            review.agreement_sent_at.isoformat() if review.agreement_sent_at else None
        ),
    }


@transactions_bp.route("/<transaction_id>/buyer-broker-review", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_buyer_broker_review(user, transaction_id: str):
    """
    GET /api/v1/transactions/{tx_id}/buyer-broker-review
    Returns current BBA review status for buyer or agent on this transaction.
    Creates a pending_review row if none exists yet.
    """
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    review = _get_or_create_review(transaction_id)
    db.session.commit()

    log.info(
        "DOCUSIGN",
        "bba_review_fetched",
        {"transaction_id": transaction_id, "status": review.status},
    )
    return jsonify({"success": True, "data": _review_payload(review)}), 200


@transactions_bp.route("/<transaction_id>/buyer-broker-review/approve", methods=["POST"])
@rate_limit(max_requests=60, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
def approve_buyer_broker_review(user, transaction_id: str, data: EmptyRequest):
    """
    POST /api/v1/transactions/{tx_id}/buyer-broker-review/approve
    Agent attests they have spoken with the buyer and approves sending the BBA.
    Only the assigned agent on the transaction may call this.
    Transitions status: pending_review | meeting_requested → approved.
    """
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    if str(tx.primary_agent_id) != str(user.id):
        log.warning(
            "DOCUSIGN",
            "bba_approve_forbidden_not_agent",
            {"transaction_id": transaction_id, "user_id": str(user.id)},
        )
        return forbidden()

    review = _get_or_create_review(transaction_id)

    if review.status == "agreement_sent":
        return jsonify(
            {
                "success": False,
                "error": "Agreement already sent — cannot re-approve.",
            }
        ), 409

    from app.services.aggregation import get_preferences_dict_optional
    from app.services.transactions.bba_preferences_fingerprint import (
        compute_preferences_fingerprint,
    )

    now = datetime.now(timezone.utc)
    review.status = "approved"
    review.approved_by_agent_id = str(user.id)
    review.approved_at = now

    # Phase 2: store fingerprint of buyer's material preferences at approval time.
    buyer_prefs = get_preferences_dict_optional(str(tx.buyer_id))
    if buyer_prefs:
        review.approved_preferences_fingerprint = compute_preferences_fingerprint(buyer_prefs)

    body = req.get_json(silent=True) or {}
    note = body.get("note")

    _log_event(review, "approved", str(user.id), note=note)
    db.session.commit()

    log.info(
        "DOCUSIGN",
        "bba_approved",
        {"transaction_id": transaction_id, "agent_id": str(user.id)},
    )
    return jsonify({"success": True, "data": _review_payload(review)}), 200


@transactions_bp.route("/<transaction_id>/buyer-broker-review/request-meeting", methods=["POST"])
@rate_limit(max_requests=60, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
def request_buyer_broker_meeting(user, transaction_id: str, data: EmptyRequest):
    """
    POST /api/v1/transactions/{tx_id}/buyer-broker-review/request-meeting
    Agent records that they need a meeting before approving the BBA.
    Blocks DocuSign send until approve is subsequently called.
    Only the assigned agent on the transaction may call this.
    Transitions status: pending_review → meeting_requested.
    """
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    if str(tx.primary_agent_id) != str(user.id):
        log.warning(
            "DOCUSIGN",
            "bba_meeting_request_forbidden_not_agent",
            {"transaction_id": transaction_id, "user_id": str(user.id)},
        )
        return forbidden()

    review = _get_or_create_review(transaction_id)

    if review.status == "agreement_sent":
        return jsonify(
            {
                "success": False,
                "error": "Agreement already sent.",
            }
        ), 409

    body = req.get_json(silent=True) or {}
    note = body.get("note")

    now = datetime.now(timezone.utc)
    review.status = "meeting_requested"
    review.meeting_requested_by_agent_id = str(user.id)
    review.meeting_requested_at = now
    review.meeting_note = note

    _log_event(review, "meeting_requested", str(user.id), note=note)
    db.session.commit()

    log.info(
        "DOCUSIGN",
        "bba_meeting_requested",
        {"transaction_id": transaction_id, "agent_id": str(user.id), "note": note},
    )
    return jsonify({"success": True, "data": _review_payload(review)}), 200
