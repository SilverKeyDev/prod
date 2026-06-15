"""Write-side preference aggregation (API payload → normalized models)."""

from app.services.aggregation.write.preferences_aggregation_write import (
    write_preferences_from_payload,
)

__all__ = ["write_preferences_from_payload"]
