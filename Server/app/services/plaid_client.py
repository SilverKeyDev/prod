# server/plaid_client.py
import os
from dotenv import load_dotenv
load_dotenv()

from plaid import Configuration, Environment
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.asset_report_create_request import AssetReportCreateRequest
from plaid.model.asset_report_get_request import AssetReportGetRequest
from plaid.model.asset_report_pdf_get_request import AssetReportPDFGetRequest
from plaid.model.statements_list_request import StatementsListRequest
from plaid.model.statements_download_request import StatementsDownloadRequest
from plaid.model.webhook_verification_key_get_request import WebhookVerificationKeyGetRequest

PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_COUNTRY_CODES = [CountryCode(x.strip()) for x in os.getenv("PLAID_COUNTRY_CODES", "US").split(",")]
PLAID_REDIRECT_URI = os.getenv("PLAID_REDIRECT_URI") or None
PLAID_WEBHOOK_BASE = os.getenv("PLAID_WEBHOOK_BASE") or None

# Check if Plaid credentials are configured
PLAID_CONFIGURED = bool(PLAID_CLIENT_ID and PLAID_SECRET)

if not PLAID_CONFIGURED:
    plaid = None  # Don't create the client if credentials are missing
else:
    _env_map = {
        "sandbox": Environment.Sandbox,
        "development": Environment.Sandbox,  # Use sandbox for development
        "production": Environment.Production,
    }

    if PLAID_ENV not in _env_map:
        raise ValueError(f"Invalid PLAID_ENV: {PLAID_ENV}. Must be one of: {list(_env_map.keys())}")

    base_url = _env_map[PLAID_ENV]

    config = Configuration(
        host=base_url,
        api_key={
            "clientId": PLAID_CLIENT_ID,
            "secret": PLAID_SECRET
        }
    )
    plaid = plaid_api.PlaidApi(config)


def create_link_token(user_id: str, client_name="SilverKey", products=("assets",)):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    # Build request parameters, only including webhook if it's set
    request_params = {
        "user": LinkTokenCreateRequestUser(client_user_id=user_id),
        "client_name": client_name,
        "products": [Products(p) for p in products],
        "country_codes": PLAID_COUNTRY_CODES,
        "language": "en",
    }
    
    # Only add redirect_uri if it's set
    if PLAID_REDIRECT_URI:
        request_params["redirect_uri"] = PLAID_REDIRECT_URI
    
    # Only add webhook if it's set
    if PLAID_WEBHOOK_BASE:
        request_params["webhook"] = PLAID_WEBHOOK_BASE
    
    request = LinkTokenCreateRequest(**request_params)
    return plaid.link_token_create(request)


def exchange_public_token(public_token: str):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    req = ItemPublicTokenExchangeRequest(public_token=public_token)
    return plaid.item_public_token_exchange(req)


def create_asset_report(access_tokens: list[str], days_requested: int = 60, webhook: str | None = PLAID_WEBHOOK_BASE):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    # Build request parameters
    request_params = {
        "access_tokens": access_tokens,
        "days_requested": days_requested,
    }
    
    # Only add options with webhook if webhook is set
    if webhook:
        request_params["options"] = {"webhook": webhook}
    
    req = AssetReportCreateRequest(**request_params)
    return plaid.asset_report_create(req)


def get_asset_report(asset_report_token: str):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    req = AssetReportGetRequest(asset_report_token=asset_report_token)
    return plaid.asset_report_get(req)


def get_asset_report_pdf(asset_report_token: str):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    req = AssetReportPDFGetRequest(asset_report_token=asset_report_token)
    # returns raw PDF bytes
    resp = plaid.asset_report_pdf_get(req, _preload_content=False)
    return resp.data


def list_statements(access_token: str, account_id: str | None = None):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    req = StatementsListRequest(access_token=access_token, account_ids=[account_id] if account_id else None)
    return plaid.statements_list(req)


def download_statement(access_token: str, statement_id: str):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    req = StatementsDownloadRequest(access_token=access_token, statement_id=statement_id)
    resp = plaid.statements_download(req, _preload_content=False)
    return resp.data


# (Optional) For signed webhook verification keys if you enable signed webhooks
def get_webhook_key(key_id: str):
    if not PLAID_CONFIGURED or plaid is None:
        raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set")
    
    req = WebhookVerificationKeyGetRequest(key_id=key_id)
    return plaid.webhook_verification_key_get(req)
