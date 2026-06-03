"""Tests for partner logo URL helpers."""

from unittest.mock import Mock, patch

from app.services.rev_share.admin.partner_logo import (
    _SKIP_LOGO_UPDATE,
    coerce_logo_url_for_storage,
    enrich_partner_dict_logo,
    is_external_logo_reference,
    resolve_partner_logo_url,
)


def test_is_external_logo_reference():
    assert is_external_logo_reference("https://cdn.example/logo.png") is True
    assert is_external_logo_reference("integration-logos/slug/logo.png") is False


def test_coerce_logo_url_for_storage():
    assert (
        coerce_logo_url_for_storage("integration-logos/x/logo.png")
        == "integration-logos/x/logo.png"
    )
    assert coerce_logo_url_for_storage("https://expired.example/x") is _SKIP_LOGO_UPDATE
    assert coerce_logo_url_for_storage("") is None
    assert coerce_logo_url_for_storage(None) is None


def test_resolve_partner_logo_url_presigns_s3_key():
    with patch("app.services.documents.s3_service") as mock_s3:
        mock_s3.s3_client = Mock()
        mock_s3.generate_view_url = Mock(return_value="https://signed.example/logo.png")
        url = resolve_partner_logo_url("integration-logos/acme/logo.png", content_type="image/png")
        assert url == "https://signed.example/logo.png"
        mock_s3.generate_view_url.assert_called_once()
        call_kwargs = mock_s3.generate_view_url.call_args.kwargs
        assert call_kwargs.get("content_type") == "image/png"


def test_enrich_partner_dict_logo_replaces_key_with_presigned():
    with patch(
        "app.services.rev_share.admin.partner_logo.resolve_partner_logo_url",
        return_value="https://signed.example/logo.png",
    ):
        out = enrich_partner_dict_logo({"id": "p1", "logo_url": "integration-logos/acme/logo.png"})
        assert out["logo_url"] == "https://signed.example/logo.png"
