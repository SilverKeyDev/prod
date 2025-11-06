import os
from typing import Dict, Iterable, List, Tuple, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError


def _get_ses_client():
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    if not region:
        raise RuntimeError("AWS_REGION (or AWS_DEFAULT_REGION) environment variable is required for SES.")
    return boto3.client("ses", region_name=region)


def send_test_emails_via_ses(recipients: Iterable[str]) -> List[str]:
    """
    Send a simple test email with subject/body 'test' to each recipient individually.
    Returns a list of SES MessageId strings for successfully sent emails.
    """
    sender = "noreply@usesilverkey.com"
    if not sender:
        raise RuntimeError("SES_SENDER_EMAIL environment variable is required.")

    ses = _get_ses_client()
    message_ids: List[str] = []
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
            print(f"Failed to send to {recipient}: {exc}")
    return message_ids


def send_personalized_emails_via_ses(
    messages: List[Tuple[str, str, str, Optional[str]]]
) -> List[str]:
    """
    Send personalized emails via SES.
    messages: List of tuples (recipient_email, subject, body_text, html_body)
             html_body is optional - if provided, email will be sent as HTML with text fallback
    Returns list of MessageIds for successful sends.
    """
    sender = "noreply@usesilverkey.com"
    if not sender:
        raise RuntimeError("SES_SENDER_EMAIL environment variable is required.")

    ses = _get_ses_client()
    message_ids: List[str] = []
    for message_tuple in messages:
        # Support both old format (3 items) and new format (4 items)
        if len(message_tuple) == 3:
            to_address, subject, body_text = message_tuple
            html_body = None
        else:
            to_address, subject, body_text, html_body = message_tuple
        
        if not to_address:
            continue
        try:
            # Build message body
            if html_body:
                # Send as HTML with text fallback
                body = {
                    "Text": {"Data": body_text or "", "Charset": "UTF-8"},
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                }
            else:
                # Plain text only (backward compatible)
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
            print(f"Failed to send to {to_address}: {exc}")
    return message_ids


