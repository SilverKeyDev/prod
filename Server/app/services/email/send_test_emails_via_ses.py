from collections.abc import Iterable

from botocore.exceptions import BotoCoreError, ClientError

from app.services.email.ses_config import get_ses_client, get_ses_sender_email
from logger import log


def send_test_emails_via_ses(recipients: Iterable[str]) -> list[str]:
    """
    Send a simple test email with subject/body 'test' to each recipient individually.
    Returns a list of SES MessageId strings for successfully sent emails.
    """
    sender = get_ses_sender_email()
    ses = get_ses_client()
    message_ids: list[str] = []
    for recipient in recipients:
        if not recipient:
            continue
        try:
            resp = ses.send_email(
                Source=sender,
                Destination={"ToAddresses": [recipient]},
                Message={
                    "Subject": {"Data": "test", "Charset": "UTF-8"},
                    "Body": {"Text": {"Data": "test", "Charset": "UTF-8"}},
                },
            )
            mid = resp.get("MessageId")
            if mid:
                message_ids.append(mid)
        except (ClientError, BotoCoreError) as exc:
            log.error(
                "ERRORS",
                "Failed to send test email",
                {"recipient": recipient, "error": str(exc)},
            )
    return message_ids


def send_personalized_emails_via_ses(
    messages: list[tuple[str, str, str, str | None]],
) -> list[str]:
    """
    Send personalized emails via SES.
    messages: List of tuples (recipient_email, subject, body_text, html_body)
             html_body may be None.
    Returns list of MessageIds for successful sends.
    """
    sender = get_ses_sender_email()
    ses = get_ses_client()
    message_ids: list[str] = []
    for message_tuple in messages:
        to_address = message_tuple[0]
        subject = message_tuple[1]
        body_text = message_tuple[2]
        html_body = message_tuple[3] if len(message_tuple) > 3 else None

        if not to_address:
            continue
        try:
            if html_body:
                body = {
                    "Text": {"Data": body_text or "", "Charset": "UTF-8"},
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                }
            else:
                body = {"Text": {"Data": body_text or "", "Charset": "UTF-8"}}

            resp = ses.send_email(
                Source=sender,
                Destination={"ToAddresses": [to_address]},
                Message={
                    "Subject": {"Data": subject or "", "Charset": "UTF-8"},
                    "Body": body,
                },
            )
            mid = resp.get("MessageId")
            if mid:
                message_ids.append(mid)
        except (ClientError, BotoCoreError) as exc:
            log.error(
                "ERRORS",
                "Failed to send personalized email",
                {"to_address": to_address, "error": str(exc)},
            )
    return message_ids
