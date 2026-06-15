"""Agreement ORM → OpenAPI `Agreement` schema (and nested participant/revision/event)."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any, cast

from app.schemas.generated import Agreement as AgreementSchema
from app.schemas.generated import AgreementEvent as AgreementEventSchema
from app.schemas.generated import AgreementParticipant as AgreementParticipantSchema
from app.schemas.generated import AgreementRevision as AgreementRevisionSchema
from app.utils.format.datetime import to_aware_utc_iso

if TYPE_CHECKING:
    from app.models.documents.agreement import Agreement as AgreementModel
    from app.models.documents.agreement_event import AgreementEvent as AgreementEventModel
    from app.models.documents.agreement_participant import (
        AgreementParticipant as AgreementParticipantModel,
    )
    from app.models.documents.agreement_revision import AgreementRevision as AgreementRevisionModel


def _event_metadata_dict(raw: str | None) -> dict[str, Any] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
        return {"value": parsed}
    except json.JSONDecodeError:
        return {"raw": raw}


class AgreementParticipantDTO:
    @staticmethod
    def from_orm(participant: AgreementParticipantModel) -> AgreementParticipantSchema:
        ro = participant.routing_order
        return AgreementParticipantSchema(
            id=participant.id,
            agreement_id=participant.agreement_id,
            user_id=participant.user_id,
            email=participant.email,
            name=participant.name,
            role=cast(Any, participant.role),
            docusign_recipient_id=participant.docusign_recipient_id,
            recipient_id=None,
            recipient_status=participant.recipient_status,
            status=None,
            routing_order=1 if ro is None else int(ro),
            signing_order=None,
            sent_at=to_aware_utc_iso(participant.sent_at),
            delivered_at=to_aware_utc_iso(participant.delivered_at),
            signed_at=to_aware_utc_iso(participant.signed_at),
            declined_at=to_aware_utc_iso(participant.declined_at),
            declined_reason=None,
            created_at=None,
            updated_at=None,
        )


class AgreementRevisionDTO:
    @staticmethod
    def from_orm(revision: AgreementRevisionModel) -> AgreementRevisionSchema:
        created = to_aware_utc_iso(revision.created_at) or ""
        return AgreementRevisionSchema(
            id=revision.id,
            agreement_id=revision.agreement_id,
            version_number=revision.version_number,
            filename=revision.filename,
            file_name=revision.filename,
            file_path=revision.file_path,
            s3_key=revision.file_path,
            file_size=revision.file_size,
            created_by=revision.created_by,
            notes=revision.notes,
            created_at=created,
            created_by_name=None,
            file_hash=revision.file_hash,
            mime_type=revision.mime_type,
            template_id=revision.template_id,
        )


class AgreementEventDTO:
    @staticmethod
    def from_orm(event: AgreementEventModel) -> AgreementEventSchema:
        return AgreementEventSchema(
            id=event.id,
            agreement_id=event.agreement_id,
            event_type=event.event_type,
            status=None,
            actor_id=event.actor_id,
            metadata=_event_metadata_dict(event.event_metadata),
            created_at=to_aware_utc_iso(event.created_at) or "",
            actor_name=None,
        )


def participant_payload(participant: AgreementParticipantModel) -> dict:
    return AgreementParticipantDTO.from_orm(participant).model_dump(mode="json")


def revision_payload(revision: AgreementRevisionModel) -> dict:
    return AgreementRevisionDTO.from_orm(revision).model_dump(mode="json")


class AgreementDTO:
    @staticmethod
    def from_orm(
        agreement: AgreementModel,
        *,
        include_relationships: bool = False,
    ) -> AgreementSchema:
        created_at = to_aware_utc_iso(agreement.created_at) or ""
        updated_at = to_aware_utc_iso(agreement.updated_at) or ""

        participants = None
        events = None
        revisions = None
        current_revision = None
        if include_relationships:
            if hasattr(agreement, "participants") and agreement.participants:
                participants = [
                    AgreementParticipantDTO.from_orm(p)
                    for p in list(cast(Any, agreement.participants))
                ]
            if hasattr(agreement, "events") and agreement.events:
                events = [
                    AgreementEventDTO.from_orm(e) for e in list(cast(Any, agreement.events))[:10]
                ]
            if hasattr(agreement, "revisions") and agreement.revisions:
                revisions = [
                    AgreementRevisionDTO.from_orm(r) for r in list(cast(Any, agreement.revisions))
                ]
            cur = agreement.current_revision
            if cur is not None:
                current_revision = AgreementRevisionDTO.from_orm(cur)

        return AgreementSchema(
            id=agreement.id,
            agent_id=agreement.agent_id,
            buyer_id=agreement.buyer_id,
            title=agreement.title,
            agreement_type=cast(Any, agreement.agreement_type),
            status=cast(Any, agreement.status),
            property_address=agreement.property_address,
            description=agreement.description,
            docusign_envelope_id=agreement.docusign_envelope_id,
            docusign_source_template_id=agreement.docusign_source_template_id,
            docusign_status=agreement.docusign_status,
            created_at=created_at,
            updated_at=updated_at,
            sent_at=to_aware_utc_iso(agreement.sent_at),
            completed_at=to_aware_utc_iso(agreement.completed_at),
            voided_at=to_aware_utc_iso(agreement.voided_at),
            current_revision_id=agreement.current_revision_id,
            signed_document_path=agreement.signed_document_path,
            certificate_path=agreement.certificate_path,
            participants=participants,
            revisions=revisions,
            events=events,
            current_revision=current_revision,
            agent_name=None,
            buyer_name=None,
            buyer_email=None,
        )
