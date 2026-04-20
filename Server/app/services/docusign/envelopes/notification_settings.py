"""
DocuSign envelope notification (reminders + expirations) for create and update calls.
"""

from __future__ import annotations

from docusign_esign import EnvelopeNotificationRequest, Expirations, Notification, Reminders
from flask import current_app

from app.schemas.generated import (
    DocuSignEnvelopeNotificationInput,
    DocusignUpdateEnvelopeNotificationRequest,
)


def _truthy_str(value: bool | None, default: bool) -> str:
    chosen = default if value is None else value
    return "true" if chosen else "false"


def _cfg_int(key: str, default: int) -> int:
    raw = current_app.config.get(key, default)
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def _cfg_bool(key: str, default: bool) -> bool:
    raw = current_app.config.get(key, default)
    if isinstance(raw, bool):
        return raw
    if raw is None:
        return default
    return str(raw).lower() == "true"


def build_notification_for_envelope_create(
    override: DocuSignEnvelopeNotificationInput | None,
) -> Notification:
    """
    Build Notification for EnvelopeDefinition (envelope create / send).

    When override.use_account_defaults is true, only that flag is set and DocuSign
    account defaults apply for reminders/expirations.
    """
    if override and override.use_account_defaults is True:
        return Notification(use_account_defaults="true")

    use_account = _cfg_bool("DOCUSIGN_ENVELOPE_USE_ACCOUNT_NOTIFICATION_DEFAULTS", False)
    if use_account:
        return Notification(use_account_defaults="true")

    rem_on = _cfg_bool("DOCUSIGN_ENVELOPE_REMINDER_ENABLED", True)
    rem_delay = _cfg_int("DOCUSIGN_ENVELOPE_REMINDER_DELAY_DAYS", 3)
    rem_freq = _cfg_int("DOCUSIGN_ENVELOPE_REMINDER_FREQUENCY_DAYS", 2)
    ex_on = _cfg_bool("DOCUSIGN_ENVELOPE_EXPIRE_ENABLED", True)
    ex_after = _cfg_int("DOCUSIGN_ENVELOPE_EXPIRE_AFTER_DAYS", 30)
    ex_warn = _cfg_int("DOCUSIGN_ENVELOPE_EXPIRE_WARN_DAYS", 2)

    if override and override.reminders:
        r = override.reminders
        if r.reminder_enabled is not None:
            rem_on = r.reminder_enabled
        if r.reminder_delay is not None:
            rem_delay = int(r.reminder_delay)
        if r.reminder_frequency is not None:
            rem_freq = int(r.reminder_frequency)

    if override and override.expirations:
        e = override.expirations
        if e.expire_enabled is not None:
            ex_on = e.expire_enabled
        if e.expire_after is not None:
            ex_after = int(e.expire_after)
        if e.expire_warn is not None:
            ex_warn = int(e.expire_warn)

    reminders = Reminders(
        reminder_enabled=_truthy_str(None, rem_on),
        reminder_delay=str(rem_delay),
        reminder_frequency=str(rem_freq),
    )
    expirations = Expirations(
        expire_enabled=_truthy_str(None, ex_on),
        expire_after=str(ex_after),
        expire_warn=str(ex_warn),
    )
    return Notification(
        use_account_defaults="false",
        reminders=reminders,
        expirations=expirations,
    )


def build_envelope_notification_request_for_update(
    body: DocusignUpdateEnvelopeNotificationRequest,
) -> EnvelopeNotificationRequest:
    """Build EnvelopeNotificationRequest for PUT envelope notification settings."""
    if body.use_account_defaults is True:
        return EnvelopeNotificationRequest(use_account_defaults="true")

    rem_on = _cfg_bool("DOCUSIGN_ENVELOPE_REMINDER_ENABLED", True)
    rem_delay = _cfg_int("DOCUSIGN_ENVELOPE_REMINDER_DELAY_DAYS", 3)
    rem_freq = _cfg_int("DOCUSIGN_ENVELOPE_REMINDER_FREQUENCY_DAYS", 2)
    ex_on = _cfg_bool("DOCUSIGN_ENVELOPE_EXPIRE_ENABLED", True)
    ex_after = _cfg_int("DOCUSIGN_ENVELOPE_EXPIRE_AFTER_DAYS", 30)
    ex_warn = _cfg_int("DOCUSIGN_ENVELOPE_EXPIRE_WARN_DAYS", 2)

    if body.reminders:
        r = body.reminders
        if r.reminder_enabled is not None:
            rem_on = r.reminder_enabled
        if r.reminder_delay is not None:
            rem_delay = int(r.reminder_delay)
        if r.reminder_frequency is not None:
            rem_freq = int(r.reminder_frequency)

    if body.expirations:
        e = body.expirations
        if e.expire_enabled is not None:
            ex_on = e.expire_enabled
        if e.expire_after is not None:
            ex_after = int(e.expire_after)
        if e.expire_warn is not None:
            ex_warn = int(e.expire_warn)

    reminders = Reminders(
        reminder_enabled=_truthy_str(None, rem_on),
        reminder_delay=str(rem_delay),
        reminder_frequency=str(rem_freq),
    )
    expirations = Expirations(
        expire_enabled=_truthy_str(None, ex_on),
        expire_after=str(ex_after),
        expire_warn=str(ex_warn),
    )
    return EnvelopeNotificationRequest(
        use_account_defaults="false",
        reminders=reminders,
        expirations=expirations,
    )
