"""DocuSign template API operations (list, get, create, delete, edit view)."""

import base64
from collections.abc import Callable
from typing import Any

from docusign_esign import (
    ApiClient,
    Document,
    EnvelopeTemplate,
    Recipients,
    ReturnUrlRequest,
    Signer,
    TemplatesApi,
)
from docusign_esign.client.api_exception import ApiException

from logger import log


def _handle(handle_exception: Callable[[ApiException, str], None], e: ApiException, op: str):
    handle_exception(e, op)
    raise AssertionError("handle_exception must raise")


def _roles_from_envelope_template(template: Any) -> list[dict[str, Any]]:
    roles: list[dict[str, Any]] = []
    rec = getattr(template, "recipients", None)
    signers = getattr(rec, "signers", None) if rec else None
    if not signers:
        return roles
    for s in signers:
        ro = getattr(s, "routing_order", None)
        roles.append(
            {
                "role_name": getattr(s, "role_name", None) or "",
                "routing_order": int(ro) if ro not in (None, "") else None,
            }
        )
    return roles


def list_templates(
    api_client: ApiClient,
    account_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> list[dict[str, Any]]:
    """List available templates."""
    try:
        log.debug(
            "DOCUSIGN",
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
        log.info(
            "DOCUSIGN",
            "Templates listed successfully",
            {"count": len(templates), "account_id": account_id},
        )
        return templates
    except ApiException as e:
        _handle(handle_exception, e, "list templates")
        return []


def get_template(
    api_client: ApiClient,
    account_id: str,
    template_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Get template details including signer role names."""
    try:
        log.debug(
            "DOCUSIGN",
            "Getting template details",
            {"template_id": template_id, "account_id": account_id},
        )
        templates_api = TemplatesApi(api_client)
        template = templates_api.get(account_id=account_id, template_id=template_id)
        log.info(
            "DOCUSIGN",
            "Template details retrieved",
            {"template_id": template_id, "template_name": template.name},
        )
        return {
            "templateId": template.template_id,
            "name": template.name,
            "description": template.description,
            "shared": template.shared,
            "roles": _roles_from_envelope_template(template),
        }
    except ApiException as e:
        _handle(handle_exception, e, "get template")
        return {}


def create_template_from_pdfs(
    api_client: ApiClient,
    account_id: str,
    handle_exception: Callable[[ApiException, str], None],
    *,
    name: str,
    description: str | None,
    pdf_files: list[tuple[str, bytes]],
    role_names: list[str],
) -> dict[str, Any]:
    """Create a DocuSign envelope template with multiple PDFs and signer roles."""
    if len(role_names) < 1:
        raise ValueError("At least one role is required")
    if len(pdf_files) < 1:
        raise ValueError("At least one PDF is required")
    try:
        documents: list[Document] = []
        for i, (filename, content) in enumerate(pdf_files, start=1):
            doc_b64 = base64.b64encode(content).decode("utf-8")
            documents.append(
                Document(
                    document_base64=doc_b64,
                    name=filename,
                    file_extension="pdf",
                    document_id=str(i),
                )
            )
        signers: list[Signer] = []
        for i, role in enumerate(role_names, start=1):
            signers.append(
                Signer(
                    role_name=role,
                    recipient_id=str(i),
                    routing_order=str(i),
                )
            )
        envelope_template = EnvelopeTemplate(
            name=name,
            description=description or "",
            email_subject=name[:100] if name else "Please sign",
            status="created",
            documents=documents,
            recipients=Recipients(signers=signers),
        )
        templates_api = TemplatesApi(api_client)
        result = templates_api.create_template(
            account_id=account_id, envelope_template=envelope_template
        )
        tid = getattr(result, "template_id", None) if result else None
        log.info(
            "DOCUSIGN",
            "DocuSign template created",
            {"account_id": account_id, "template_id": tid},
        )
        return {"templateId": tid}
    except ApiException as e:
        _handle(handle_exception, e, "create template")
        return {}


def delete_template(
    api_client: ApiClient,
    account_id: str,
    template_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> None:
    """Delete a template (DocuSign account). SDK has no wrapper; use REST DELETE."""
    resource_path = "/v2.1/accounts/{accountId}/templates/{templateId}".replace("{format}", "json")
    try:
        api_client.call_api(
            resource_path,
            "DELETE",
            path_params={"accountId": account_id, "templateId": template_id},
            query_params=[],
            header_params={},
            body=None,
            post_params=[],
            files={},
            response_type=None,
            auth_settings=[],
            _preload_content=True,
        )
        log.info(
            "DOCUSIGN",
            "DocuSign template deleted",
            {"account_id": account_id, "template_id": template_id},
        )
    except ApiException as e:
        _handle(handle_exception, e, "delete template")


def create_template_edit_view(
    api_client: ApiClient,
    account_id: str,
    template_id: str,
    return_url: str,
    handle_exception: Callable[[ApiException, str], None],
) -> str:
    """Return a URL to DocuSign template editor UI."""
    try:
        templates_api = TemplatesApi(api_client)
        req = ReturnUrlRequest(return_url=return_url)
        view = templates_api.create_edit_view(
            account_id=account_id, template_id=template_id, return_url_request=req
        )
        url = getattr(view, "url", None) if view else None
        if not url:
            raise RuntimeError("DocuSign did not return template edit URL")
        log.info(
            "DOCUSIGN",
            "Template edit view created",
            {"account_id": account_id, "template_id": template_id},
        )
        return url
    except ApiException as e:
        _handle(handle_exception, e, "create template edit view")
        return ""


def get_template_role_name_set(
    api_client: ApiClient,
    account_id: str,
    template_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> set[str]:
    """Canonical signer role names for a template (for validation before send)."""
    detail = get_template(api_client, account_id, template_id, handle_exception)
    roles = detail.get("roles") or []
    return {
        str(r.get("role_name") or "").strip() for r in roles if (r.get("role_name") or "").strip()
    }
