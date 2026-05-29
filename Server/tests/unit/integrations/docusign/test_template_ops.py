"""Unit tests for DocuSign template_ops (mocked SDK)."""

from unittest.mock import MagicMock, patch

import pytest
from docusign_esign.client.api_exception import ApiException

from app.services.docusign.core import template_ops


def _assert_handle(_exc: ApiException, _op: str) -> None:
    raise AssertionError("handle_exception should not run on success paths")


class TestGetTemplate:
    @patch("app.services.docusign.core.template_ops.TemplatesApi")
    def test_get_template_extracts_roles(self, mock_templates_api_cls):
        signer_a = MagicMock()
        signer_a.role_name = "Buyer"
        signer_a.routing_order = "1"
        signer_b = MagicMock()
        signer_b.role_name = "Agent"
        signer_b.routing_order = "2"
        rec = MagicMock()
        rec.signers = [signer_a, signer_b]
        tmpl = MagicMock()
        tmpl.template_id = "t-1"
        tmpl.name = "My template"
        tmpl.description = "d"
        tmpl.shared = False
        tmpl.recipients = rec
        mock_templates_api_cls.return_value.get.return_value = tmpl

        api_client = MagicMock()
        out = template_ops.get_template(api_client, "acc", "t-1", _assert_handle)

        assert out["templateId"] == "t-1"
        assert out["name"] == "My template"
        assert len(out["roles"]) == 2
        assert out["roles"][0]["role_name"] == "Buyer"
        assert out["roles"][0]["routing_order"] == 1
        assert out["roles"][1]["role_name"] == "Agent"


class TestGetTemplateRoleNameSet:
    @patch("app.services.docusign.core.template_ops.get_template")
    def test_normalizes_and_dedupes_by_strip(self, mock_get):
        mock_get.return_value = {
            "roles": [
                {"role_name": " Buyer ", "routing_order": 1},
                {"role_name": "Agent", "routing_order": 2},
            ]
        }
        s = template_ops.get_template_role_name_set(MagicMock(), "a", "tid", _assert_handle)
        assert s == {"Buyer", "Agent"}


class TestCreateTemplateFromPdfs:
    @patch("app.services.docusign.core.template_ops.TemplatesApi")
    def test_create_returns_template_id(self, mock_cls):
        result = MagicMock()
        result.template_id = "new-tid"
        mock_cls.return_value.create_template.return_value = result

        api_client = MagicMock()
        out = template_ops.create_template_from_pdfs(
            api_client,
            "acc",
            _assert_handle,
            name="N",
            description=None,
            pdf_files=[("a.pdf", b"%PDF-1.4")],
            role_names=["Signer1"],
        )
        assert out["templateId"] == "new-tid"
        et = mock_cls.return_value.create_template.call_args[1]["envelope_template"]
        assert et.name == "N"
        assert len(et.documents) == 1
        assert len(et.recipients.signers) == 1

    def test_requires_at_least_one_role(self):
        api_client = MagicMock()
        with pytest.raises(ValueError, match="At least one role"):
            template_ops.create_template_from_pdfs(
                api_client,
                "acc",
                _assert_handle,
                name="n",
                description=None,
                pdf_files=[("a.pdf", b"x")],
                role_names=[],
            )

    def test_requires_at_least_one_pdf(self):
        api_client = MagicMock()
        with pytest.raises(ValueError, match="At least one PDF"):
            template_ops.create_template_from_pdfs(
                api_client,
                "acc",
                _assert_handle,
                name="n",
                description=None,
                pdf_files=[],
                role_names=["A"],
            )


class TestDeleteTemplate:
    def test_uses_delete_on_api_client(self):
        api_client = MagicMock()
        template_ops.delete_template(api_client, "acc", "tid", _assert_handle)
        api_client.call_api.assert_called_once()
        args = api_client.call_api.call_args[0]
        assert args[1] == "DELETE"


class TestCreateTemplateEditView:
    @patch("app.services.docusign.core.template_ops.TemplatesApi")
    def test_returns_url(self, mock_cls):
        view = MagicMock()
        view.url = "https://ds.example/edit"
        mock_cls.return_value.create_edit_view.return_value = view
        api_client = MagicMock()
        url = template_ops.create_template_edit_view(
            api_client, "acc", "tid", "https://app/return", _assert_handle
        )
        assert url == "https://ds.example/edit"
