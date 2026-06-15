"""Shared assertions for rev-share route error envelopes."""


def assert_resource_not_found(response) -> dict:
    assert response.status_code == 404
    body = response.get_json()
    assert body["success"] is False
    assert body["error"] == "RESOURCE_NOT_FOUND"
    assert isinstance(body.get("message"), str)
    return body
