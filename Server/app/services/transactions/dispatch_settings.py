"""Resolve checklist dispatch settings by transaction spine id."""

from __future__ import annotations

from sqlalchemy import or_, select

from app import db
from app.models import ChecklistItemDispatchSetting, Transaction
from app.schemas import (
    ChecklistDispatchAutomationSetting,
    ChecklistDispatchChannel,
    ChecklistDispatchNoteMode,
    ChecklistDispatchRecipientScope,
    UpdateChecklistDispatchAutomationRequest,
)
from app.services.transactions.persistence import persist_transaction_session


def get_dispatch_setting_row(
    *,
    agent_user_id: str,
    transaction_id: str,
    category: str,
    item_id: int,
) -> ChecklistItemDispatchSetting | None:
    tx = db.session.scalar(select(Transaction).where(Transaction.id == str(transaction_id)))
    if tx is None:
        return None
    buyer_id = str(tx.buyer_id)
    return db.session.scalar(
        select(ChecklistItemDispatchSetting).where(
            ChecklistItemDispatchSetting.agent_user_id == str(agent_user_id),
            ChecklistItemDispatchSetting.category == str(category),
            ChecklistItemDispatchSetting.item_id == item_id,
            or_(
                ChecklistItemDispatchSetting.transaction_id == str(transaction_id),
                ChecklistItemDispatchSetting.client_user_id == buyer_id,
            ),
        )
    )


def new_dispatch_setting_row(
    *,
    agent_user_id: str,
    transaction_id: str,
    category: str,
    item_id: int,
) -> ChecklistItemDispatchSetting:
    tx = db.session.scalar(select(Transaction).where(Transaction.id == str(transaction_id)))
    if tx is None:
        raise ValueError("Transaction not found")
    return ChecklistItemDispatchSetting(
        agent_user_id=str(agent_user_id),
        client_user_id=str(tx.buyer_id),
        transaction_id=str(transaction_id),
        category=str(category),
        item_id=item_id,
    )


def row_to_setting_model(row: ChecklistItemDispatchSetting) -> ChecklistDispatchAutomationSetting:
    return ChecklistDispatchAutomationSetting(
        enabled=row.enabled,
        channel=ChecklistDispatchChannel(row.channel),
        recipientScope=ChecklistDispatchRecipientScope(row.recipient_scope),
        selectedClientIds=row.selected_client_ids,
        noteMode=ChecklistDispatchNoteMode(row.note_mode),
        noteBroadcast=row.note_broadcast,
        notesPerClient=row.notes_per_client if isinstance(row.notes_per_client, dict) else None,
        updatedAt=row.updated_at,
    )


def defaults_setting() -> ChecklistDispatchAutomationSetting:
    return ChecklistDispatchAutomationSetting(
        enabled=False,
        channel=ChecklistDispatchChannel.messaging,
        recipientScope=ChecklistDispatchRecipientScope.context_client,
        selectedClientIds=None,
        noteMode=ChecklistDispatchNoteMode.none,
        noteBroadcast=None,
        notesPerClient=None,
        updatedAt=None,
    )


def upsert_dispatch_setting(
    *,
    agent_user_id: str,
    transaction: Transaction,
    category: str,
    item_id: int,
    data: UpdateChecklistDispatchAutomationRequest,
) -> ChecklistDispatchAutomationSetting:
    row = get_dispatch_setting_row(
        agent_user_id=str(agent_user_id),
        transaction_id=str(transaction.id),
        category=str(category),
        item_id=item_id,
    )

    if row is None:
        row = new_dispatch_setting_row(
            agent_user_id=str(agent_user_id),
            transaction_id=str(transaction.id),
            category=str(category),
            item_id=item_id,
        )
        db.session.add(row)

    row.transaction_id = str(transaction.id)
    row.client_user_id = str(transaction.buyer_id)
    row.enabled = data.enabled
    row.channel = data.channel.value
    row.recipient_scope = data.recipientScope.value
    row.selected_client_ids = list(data.selectedClientIds) if data.selectedClientIds else None
    row.note_mode = data.noteMode.value
    row.note_broadcast = str(data.noteBroadcast) if data.noteBroadcast else None
    row.notes_per_client = dict(data.notesPerClient) if data.notesPerClient else None

    persist_transaction_session()
    return row_to_setting_model(row)
