from app.config import Config
from app.services.auth.core import cognito_service


def test_cognito_service_prefers_user_pool_region(monkeypatch):
    calls = []

    def fake_boto_client(service_name, *, region_name, config):
        calls.append(
            {
                "service_name": service_name,
                "region_name": region_name,
                "config": config,
            }
        )
        return object()

    monkeypatch.delenv("AWS_COGNITO_REGION", raising=False)
    monkeypatch.setattr(Config, "AWS_REGION", "us-east-1")
    monkeypatch.setattr(Config, "AWS_COGNITO_USER_POOL_ID", "us-east-2_testPool")
    monkeypatch.setattr(Config, "AWS_COGNITO_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(Config, "AWS_COGNITO_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setattr(cognito_service.boto3, "client", fake_boto_client)

    service = cognito_service.CognitoService()

    assert service.region == "us-east-2"
    assert calls[0]["service_name"] == "cognito-idp"
    assert calls[0]["region_name"] == "us-east-2"
