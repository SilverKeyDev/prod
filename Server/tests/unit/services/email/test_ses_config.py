"""Unit tests for shared SES configuration (SIL-46)."""


from app.services.email import ses_config


def test_default_sender_uses_verified_domain():
    assert ses_config.SES_DEFAULT_SENDER_EMAIL == "noreply@usesilverkey.com"
    assert ses_config.SES_SENDING_DOMAIN == "usesilverkey.com"


def test_get_ses_sender_email_honors_override(monkeypatch):
    monkeypatch.setenv("SES_SENDER_EMAIL", "dev-test@usesilverkey.com")
    assert ses_config.get_ses_sender_email() == "dev-test@usesilverkey.com"


def test_get_ses_sender_email_falls_back_without_override(monkeypatch):
    monkeypatch.delenv("SES_SENDER_EMAIL", raising=False)
    assert ses_config.get_ses_sender_email() == ses_config.SES_DEFAULT_SENDER_EMAIL


def test_get_ses_region_defaults_to_us_east_2(monkeypatch):
    monkeypatch.delenv("AWS_REGION", raising=False)
    monkeypatch.delenv("AWS_DEFAULT_REGION", raising=False)
    assert ses_config.get_ses_region() == "us-east-2"


def test_get_ses_region_prefers_aws_region(monkeypatch):
    monkeypatch.setenv("AWS_REGION", "us-west-2")
    assert ses_config.get_ses_region() == "us-west-2"


def test_cognito_reply_to_defaults_to_support(monkeypatch):
    monkeypatch.delenv("SES_REPLY_TO_EMAIL", raising=False)
    assert ses_config.cognito_reply_to_address() == "support@usesilverkey.com"


def test_app_links_base_url_production(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    assert ses_config.app_links_base_url() == "https://usesilverkey.com"


def test_app_links_base_url_development(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "development")
    assert ses_config.app_links_base_url() == "http://localhost:5173"
