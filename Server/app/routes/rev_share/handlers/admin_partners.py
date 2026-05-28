"""Admin CRUD /api/v1/admin/partners."""

from __future__ import annotations

from flask import request

from app.services.rev_share.admin.checklist_steps import list_partner_eligible_checklist_steps
from app.services.rev_share.admin.partners_admin import (
    create_partner,
    delete_partner,
    get_partner,
    list_partners,
    update_partner,
)
from app.services.rev_share.link_provisioning import ensure_links_for_partner
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from logger import LOG_CATEGORIES, log


def _require_admin(user):
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin partners access",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response("Admin access required", status_code=403)
    return None


@handle_exceptions_with_logging
@require_authenticated_user
def list_admin_partners(user):
    denied = _require_admin(user)
    if denied:
        return denied
    return standardize_success_response({"data": {"partners": list_partners()}})


@handle_exceptions_with_logging
@require_authenticated_user
def get_admin_partner(user, partner_id: str):
    denied = _require_admin(user)
    if denied:
        return denied
    row = get_partner(partner_id)
    if not row:
        return standardize_error_response("partner_not_found", status_code=404)
    return standardize_success_response({"data": row})


@handle_exceptions_with_logging
@require_authenticated_user
def create_admin_partner(user):
    denied = _require_admin(user)
    if denied:
        return denied
    payload = request.get_json(silent=True) or {}
    row, err = create_partner(payload)
    if err:
        return standardize_error_response(err, status_code=400)
    return standardize_success_response({"data": row}, status_code=201)


@handle_exceptions_with_logging
@require_authenticated_user
def patch_admin_partner(user, partner_id: str):
    denied = _require_admin(user)
    if denied:
        return denied
    payload = request.get_json(silent=True) or {}
    row, err = update_partner(partner_id, payload)
    if err == "not_found":
        return standardize_error_response(err, status_code=404)
    if err:
        return standardize_error_response(err, status_code=400)
    return standardize_success_response({"data": row})


@handle_exceptions_with_logging
@require_authenticated_user
def delete_admin_partner(user, partner_id: str):
    denied = _require_admin(user)
    if denied:
        return denied
    if not delete_partner(partner_id):
        return standardize_error_response("partner_not_found", status_code=404)
    return standardize_success_response(message="Partner deleted")


@handle_exceptions_with_logging
@require_authenticated_user
def provision_admin_partner_links(user, partner_id: str):
    denied = _require_admin(user)
    if denied:
        return denied
    created = ensure_links_for_partner(partner_id)
    return standardize_success_response({"data": {"links_created": created}})


@handle_exceptions_with_logging
@require_authenticated_user
def list_checklist_steps(user):
    denied = _require_admin(user)
    if denied:
        return denied
    role = request.args.get("role", "buyer")
    if role not in ("buyer", "seller"):
        role = "buyer"
    return standardize_success_response(
        {"data": {"steps": list_partner_eligible_checklist_steps(role)}}
    )
