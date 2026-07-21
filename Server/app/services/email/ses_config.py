"""Shared Amazon SES configuration for server-side email (SIL-46 foundation).

Cognito auth emails are configured in the Cognito user pool (AWS console / IaC).
Application sends (newsletter, transactional) use the same verified domain identity.
"""

import os

import boto3

from app.config.constants._constants_public_urls import (
    DEV_FRONTEND_ORIGIN,
    PUBLIC_PRODUCTION_ORIGIN,
)

# Verified sending domain for production mail (see documentation/guides/ses-cognito-onboarding.md)
SES_SENDING_DOMAIN = "usesilverkey.com"
SES_DEFAULT_SENDER_EMAIL = f"noreply@{SES_SENDING_DOMAIN}"


def get_ses_region() -> str:
    """SES region — defaults to SilverKey primary region."""
    return os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-2"


def get_ses_sender_email() -> str:
    """From address for server-side SES sends. Override only for non-prod smoke tests."""
    override = os.getenv("SES_SENDER_EMAIL", "").strip()
    return override or SES_DEFAULT_SENDER_EMAIL


def get_ses_client():
    """Boto3 SES client using the configured region."""
    return boto3.client("ses", region_name=get_ses_region())


def cognito_email_from_address() -> str:
    """Recommended Cognito 'from' when the user pool sends via SES."""
    return SES_DEFAULT_SENDER_EMAIL


def cognito_reply_to_address() -> str:
    """Optional reply-to for Cognito verification / password-reset mail."""
    return os.getenv("SES_REPLY_TO_EMAIL", "").strip() or f"jayce@{SES_SENDING_DOMAIN}"


def app_links_base_url() -> str:
    """Base URL embedded in auth email templates (verification links, etc.)."""
    flask_env = os.getenv("FLASK_ENV", "development")
    if flask_env == "production":
        return PUBLIC_PRODUCTION_ORIGIN
    return DEV_FRONTEND_ORIGIN
