"""Normalize Cognito CodeDeliveryDetails for API JSON / OpenAPI-aligned responses."""


def normalize_cognito_code_delivery(details: dict | None) -> dict:
    """Map AWS PascalCase keys to OpenAPI camelCase (deliveryMedium, destination, attributeName)."""
    if not details:
        return {}
    return {
        "deliveryMedium": details.get("DeliveryMedium"),
        "destination": details.get("Destination"),
        "attributeName": details.get("AttributeName"),
    }
