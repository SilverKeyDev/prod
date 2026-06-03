"""DocuSign Connect webhook handler."""

import uuid

from flask import jsonify, request
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import DocusignConnectEvent
from app.schemas import DocusignWebhookPayload, SuccessResponse
from app.services.docusign import verify_webhook
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def register_webhook_routes(bp):
    @bp.route("/connect", methods=["POST"])
    @validate_request(DocusignWebhookPayload)
    @validate_response(SuccessResponse)
    def docusign_connect_webhook(data: DocusignWebhookPayload | None = None):
        try:
            payload = request.get_data(as_text=True)
            hmac_signature = request.headers.get("X-DocuSign-Signature-1")
            authorization_header = request.headers.get("Authorization")
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Received DocuSign webhook",
                {
                    "has_hmac": bool(hmac_signature),
                    "has_auth": bool(authorization_header),
                    "payload_size": len(payload),
                },
            )
            use_org_hmac = False
            if data is not None:
                extra = data.model_extra or {}
                if extra.get("organizationId") or extra.get("accountId") == "org-level-indicator":
                    use_org_hmac = True
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Verifying webhook authenticity",
                {"use_org_hmac": use_org_hmac},
            )
            if not verify_webhook(
                payload=payload,
                hmac_signature=hmac_signature,
                authorization_header=authorization_header,
                use_org_hmac=use_org_hmac,
            ):
                log.security(LOG_CATEGORIES["SECURITY"], "Webhook verification failed")
                return jsonify({"error": "Webhook verification failed"}), 401
            if data is None:
                return jsonify({"error": "Invalid payload"}), 400
            body = data.model_dump()
            envelope_id = data.envelopeId or (body.get("data") or {}).get(
                "envelopeSummary", {}
            ).get("envelopeId")
            event_type = data.event or body.get("eventType")
            event_timestamp = body.get("generatedDateTime") or body.get("generated")
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Parsed webhook data",
                {
                    "envelope_id": envelope_id,
                    "event_type": event_type,
                    "event_timestamp": event_timestamp,
                },
            )
            if not envelope_id or not event_type:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Invalid webhook payload",
                    {"has_envelope_id": bool(envelope_id), "has_event_type": bool(event_type)},
                )
                return jsonify({"error": "Invalid payload"}), 400
            event = DocusignConnectEvent(
                id=str(uuid.uuid4()),
                envelope_id=envelope_id,
                event_type=event_type,
                event_timestamp=event_timestamp,
                payload=payload,
                hmac_verified=True,
            )
            try:
                db.session.add(event)
                db.session.commit()
                log.info(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Webhook event stored",
                    {"event_id": event.id, "envelope_id": envelope_id, "event_type": event_type},
                )
            except IntegrityError:
                db.session.rollback()
                log.info(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Duplicate webhook event received",
                    {"envelope_id": envelope_id, "event_type": event_type},
                )
                return jsonify({"success": True, "duplicate": True}), 200
            from app.celery.tasks.docusign import process_webhook_task

            process_webhook_task.delay(event.id)  # pyright: ignore[reportFunctionMemberAccess]
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Webhook processing task enqueued",
                {"event_id": event.id, "envelope_id": envelope_id, "event_type": event_type},
            )
            return jsonify({"success": True}), 200
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Webhook processing failed", {"error": str(e)})
            return jsonify({"error": "Processing failed"}), 500
