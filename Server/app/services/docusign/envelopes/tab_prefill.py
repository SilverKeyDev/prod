"""
Map SendAgreementRequest prefill payloads to DocuSign tab structures.
"""

from __future__ import annotations

from typing import Any

from docusign_esign import Checkbox, PrefillTabs, Text

from app.schemas.generated import (
    DocuSignEnvelopePrefillTabsInput,
    DocuSignParticipantTabPrefillInput,
    DocuSignPrefillCheckboxTabInput,
    DocuSignPrefillTextTabInput,
)


def _truthy_locked(selected: bool | None) -> str | None:
    if selected is None:
        return None
    return "true" if selected else "false"


def _text_tab_models_for_recipient(
    fields: list[DocuSignPrefillTextTabInput],
    recipient_id: str,
) -> list[Text]:
    out: list[Text] = []
    for f in fields:
        doc_id = f.document_id or "1"
        kwargs: dict[str, Any] = {
            "document_id": doc_id,
            "recipient_id": recipient_id,
            "tab_label": f.tab_label,
            "value": f.value or "",
        }
        if f.locked is not None:
            kwargs["locked"] = _truthy_locked(f.locked)
        if f.font_size:
            kwargs["font_size"] = f.font_size
        if f.anchor_string:
            kwargs["anchor_string"] = f.anchor_string
            if f.anchor_x_offset is not None:
                kwargs["anchor_x_offset"] = f.anchor_x_offset
            if f.anchor_y_offset is not None:
                kwargs["anchor_y_offset"] = f.anchor_y_offset
        else:
            kwargs["page_number"] = str(f.page_number or 1)
            kwargs["x_position"] = str(f.x_position if f.x_position is not None else 100)
            kwargs["y_position"] = str(f.y_position if f.y_position is not None else 200)
        out.append(Text(**kwargs))
    return out


def _checkbox_tab_models_for_recipient(
    fields: list[DocuSignPrefillCheckboxTabInput],
    recipient_id: str,
) -> list[Checkbox]:
    out: list[Checkbox] = []
    for f in fields:
        doc_id = f.document_id or "1"
        kwargs: dict[str, Any] = {
            "document_id": doc_id,
            "recipient_id": recipient_id,
            "tab_label": f.tab_label,
        }
        if f.selected is not None:
            kwargs["selected"] = _truthy_locked(f.selected)
        if f.locked is not None:
            kwargs["locked"] = _truthy_locked(f.locked)
        if f.anchor_string:
            kwargs["anchor_string"] = f.anchor_string
            if f.anchor_x_offset is not None:
                kwargs["anchor_x_offset"] = f.anchor_x_offset
            if f.anchor_y_offset is not None:
                kwargs["anchor_y_offset"] = f.anchor_y_offset
        else:
            kwargs["page_number"] = str(f.page_number or 1)
            kwargs["x_position"] = str(f.x_position if f.x_position is not None else 100)
            kwargs["y_position"] = str(f.y_position if f.y_position is not None else 220)
        out.append(Checkbox(**kwargs))
    return out


def _text_tab_models_prefill(fields: list[DocuSignPrefillTextTabInput]) -> list[Text]:
    out: list[Text] = []
    for f in fields:
        doc_id = f.document_id or "1"
        kwargs: dict[str, Any] = {
            "document_id": doc_id,
            "tab_label": f.tab_label,
            "value": f.value or "",
        }
        if f.locked is not None:
            kwargs["locked"] = _truthy_locked(f.locked)
        if f.font_size:
            kwargs["font_size"] = f.font_size
        if f.anchor_string:
            kwargs["anchor_string"] = f.anchor_string
            if f.anchor_x_offset is not None:
                kwargs["anchor_x_offset"] = f.anchor_x_offset
            if f.anchor_y_offset is not None:
                kwargs["anchor_y_offset"] = f.anchor_y_offset
        else:
            kwargs["page_number"] = str(f.page_number or 1)
            kwargs["x_position"] = str(f.x_position if f.x_position is not None else 100)
            kwargs["y_position"] = str(f.y_position if f.y_position is not None else 200)
        out.append(Text(**kwargs))
    return out


def _checkbox_tab_models_prefill(fields: list[DocuSignPrefillCheckboxTabInput]) -> list[Checkbox]:
    out: list[Checkbox] = []
    for f in fields:
        doc_id = f.document_id or "1"
        kwargs: dict[str, Any] = {
            "document_id": doc_id,
            "tab_label": f.tab_label,
        }
        if f.selected is not None:
            kwargs["selected"] = _truthy_locked(f.selected)
        if f.locked is not None:
            kwargs["locked"] = _truthy_locked(f.locked)
        if f.anchor_string:
            kwargs["anchor_string"] = f.anchor_string
            if f.anchor_x_offset is not None:
                kwargs["anchor_x_offset"] = f.anchor_x_offset
            if f.anchor_y_offset is not None:
                kwargs["anchor_y_offset"] = f.anchor_y_offset
        else:
            kwargs["page_number"] = str(f.page_number or 1)
            kwargs["x_position"] = str(f.x_position if f.x_position is not None else 100)
            kwargs["y_position"] = str(f.y_position if f.y_position is not None else 220)
        out.append(Checkbox(**kwargs))
    return out


def parse_tab_prefill_by_participant(
    rows: list[dict[str, Any]] | None,
) -> dict[str, dict[str, list[Text | Checkbox]]]:
    """Validate and group recipient tab prefill by participant id."""
    if not rows:
        return {}
    parsed: dict[str, dict[str, list[Text | Checkbox]]] = {}
    for raw in rows:
        item = DocuSignParticipantTabPrefillInput.model_validate(raw)
        texts = _text_tab_models_for_recipient(item.text_fields or [], item.participant_id)
        boxes = _checkbox_tab_models_for_recipient(item.checkboxes or [], item.participant_id)
        bucket = parsed.setdefault(item.participant_id, {"text": [], "checkbox": []})
        bucket["text"].extend(texts)
        bucket["checkbox"].extend(boxes)
    return parsed


def build_prefill_tabs_model(
    raw: dict[str, Any] | None,
) -> PrefillTabs | None:
    """Sender-level prefill tabs for envelope create (prefillTabs on envelope)."""
    if not raw:
        return None
    data = DocuSignEnvelopePrefillTabsInput.model_validate(raw)
    text_models = _text_tab_models_prefill(data.text_fields or [])
    cb_models = _checkbox_tab_models_prefill(data.checkboxes or [])
    if not text_models and not cb_models:
        return None
    return PrefillTabs(text_tabs=text_models or None, checkbox_tabs=cb_models or None)


def prefill_tabs_nonempty(prefill: PrefillTabs | None) -> bool:
    if prefill is None:
        return False
    tt = prefill.text_tabs
    ct = prefill.checkbox_tabs
    return bool(tt) or bool(ct)
