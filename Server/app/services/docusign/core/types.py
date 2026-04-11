"""
Typed response shapes for DocuSign auth APIs.

Used to narrow SDK responses (Unknown/Any) so Pyright can validate
attribute access (access_token, expires_in, accounts, etc.).
"""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class JWTTokenResponse:
    """Response from request_jwt_user_token."""

    access_token: str
    expires_in: int


@dataclass(frozen=True)
class OAuthTokenResponse:
    """Response from generate_access_token (code exchange)."""

    access_token: str
    refresh_token: str
    expires_in: int
    scope: str


@dataclass(frozen=True)
class DocuSignAccount:
    """Single account from get_user_info().accounts."""

    account_id: str
    account_name: str | None
    base_uri: str


@dataclass(frozen=True)
class DocuSignUserInfo:
    """Response from get_user_info."""

    accounts: list[DocuSignAccount]


def parse_jwt_token_response(raw: Any) -> JWTTokenResponse:
    """Parse SDK JWT token response into a typed struct."""
    access_token = getattr(raw, "access_token", None)
    expires_in = getattr(raw, "expires_in", None)
    if access_token is None or expires_in is None:
        raise ValueError("Invalid JWT token response: missing access_token or expires_in")
    return JWTTokenResponse(access_token=str(access_token), expires_in=int(expires_in))


def parse_oauth_token_response(raw: Any) -> OAuthTokenResponse:
    """Parse SDK OAuth token response into a typed struct."""
    access_token = getattr(raw, "access_token", None)
    refresh_token = getattr(raw, "refresh_token", None)
    expires_in = getattr(raw, "expires_in", None)
    scope = getattr(raw, "scope", None)
    if access_token is None or refresh_token is None or expires_in is None or scope is None:
        raise ValueError(
            "Invalid OAuth token response: missing access_token, refresh_token, expires_in, or scope"
        )
    return OAuthTokenResponse(
        access_token=str(access_token),
        refresh_token=str(refresh_token),
        expires_in=int(expires_in),
        scope=str(scope),
    )


def parse_user_info(raw: Any) -> DocuSignUserInfo:
    """Parse SDK get_user_info response into a typed struct."""
    raw_accounts = getattr(raw, "accounts", None)
    if not raw_accounts:
        return DocuSignUserInfo(accounts=[])
    accounts = []
    for acc in raw_accounts:
        account_id = getattr(acc, "account_id", None)
        base_uri = getattr(acc, "base_uri", None)
        if account_id is None or base_uri is None:
            continue
        account_name = getattr(acc, "account_name", None)
        accounts.append(
            DocuSignAccount(
                account_id=str(account_id),
                account_name=str(account_name) if account_name is not None else None,
                base_uri=str(base_uri),
            )
        )
    return DocuSignUserInfo(accounts=accounts)
