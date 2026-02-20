"""DocuSign template API operations (list, get)."""

from collections.abc import Callable
from typing import Any

from docusign_esign import TemplatesApi
from docusign_esign.client.api_exception import ApiException

from logger import LOG_CATEGORIES, get_logger

logger = get_logger()


def _handle(handle_exception: Callable[[ApiException, str], None], e: ApiException, op: str):
    handle_exception(e, op)
    raise AssertionError("handle_exception must raise")


def list_templates(
    api_client, account_id: str, handle_exception: Callable[[ApiException, str], None]
) -> list[dict[str, Any]]:
    """List available templates."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Listing DocuSign templates",
            {"account_id": account_id},
        )
        templates_api = TemplatesApi(api_client)
        results = templates_api.list_templates(account_id=account_id)
        templates = []
        if results.envelope_templates:
            for tmpl in results.envelope_templates:
                templates.append(
                    {
                        "templateId": tmpl.template_id,
                        "name": tmpl.name,
                        "description": tmpl.description,
                        "shared": tmpl.shared,
                        "created": tmpl.created,
                    }
                )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Templates listed successfully",
            {"count": len(templates), "account_id": account_id},
        )
        return templates
    except ApiException as e:
        _handle(handle_exception, e, "list templates")
        return []


def get_template(
    api_client,
    account_id: str,
    template_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Get template details."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Getting template details",
            {"template_id": template_id, "account_id": account_id},
        )
        templates_api = TemplatesApi(api_client)
        template = templates_api.get(account_id=account_id, template_id=template_id)
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Template details retrieved",
            {"template_id": template_id, "template_name": template.name},
        )
        return {
            "templateId": template.template_id,
            "name": template.name,
            "description": template.description,
            "shared": template.shared,
        }
    except ApiException as e:
        _handle(handle_exception, e, "get template")
        return {}
