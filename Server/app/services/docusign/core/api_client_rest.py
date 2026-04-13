"""DocuSign SDK: ``set_base_path`` does not set ``host``; REST calls use ``host`` (defaults to prod)."""

from docusign_esign import ApiClient


def configure_rest_api_root(api_client: ApiClient, account_base_uri: str) -> None:
    """
    Point ``ApiClient`` at an account REST root (e.g. ``https://demo.docusign.net/restapi``).

    ``account_base_uri`` is typically the account host from Apps & Keys or userinfo ``base_uri``
    (with or without a trailing ``/restapi``).
    """
    base = account_base_uri.rstrip("/")
    root = base if base.endswith("/restapi") else f"{base}/restapi"
    api_client.set_base_path(root)
    api_client.host = root
