"""Checklist item document/form/dispatch URL rules on the transactions blueprint."""

from .. import transactions_bp
from .checklist_dispatch_automation import (
    get_checklist_dispatch_automation,
    put_checklist_dispatch_automation,
)
from .checklist_documents import (
    get_checklist_item_documents,
    link_agreement_to_checklist_item_route,
)
from .checklist_forms import download_form, get_checklist_item_forms, send_form

transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/documents",
    "get_checklist_item_documents",
    get_checklist_item_documents,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/documents",
    "link_agreement_to_checklist_item",
    link_agreement_to_checklist_item_route,
    methods=["POST"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/forms",
    "get_checklist_item_forms",
    get_checklist_item_forms,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/forms/<form_id>/download",
    "download_form",
    download_form,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/forms/<form_id>/send",
    "send_form",
    send_form,
    methods=["POST"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/dispatch-automation",
    "get_checklist_dispatch_automation",
    get_checklist_dispatch_automation,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/dispatch-automation",
    "put_checklist_dispatch_automation",
    put_checklist_dispatch_automation,
    methods=["PUT"],
)
