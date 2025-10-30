import os
from typing import Dict, Iterable, List, Tuple

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


def send_personalized_emails_via_ses(messages: List[Tuple[str, str, str]]) -> List[str]:
    """
    Send personalized emails via SES.
    messages: List of tuples (recipient_email, subject, body_text)
    Returns list of MessageIds for successful sends.
    """
    sender = "noreply@usesilverkey.com"
    if not sender:
        raise RuntimeError("SES_SENDER_EMAIL environment variable is required.")

    ses = _get_ses_client()
    message_ids: List[str] = []
    for to_address, subject, body_text in messages:
        if not to_address:
            continue
        try:
            resp = ses.send_email(
                Source=sender,
                Destination={"ToAddresses": [to_address]},
                Message={
                    "Subject": {"Data": subject or "", "Charset": "UTF-8"},
                    "Body": {"Text": {"Data": body_text or "", "Charset": "UTF-8"}},
                },
            )
            mid = resp.get("MessageId")
            if mid:
                message_ids.append(mid)
        except (ClientError, BotoCoreError) as exc:
            print(f"Failed to send to {to_address}: {exc}")
    return message_ids


