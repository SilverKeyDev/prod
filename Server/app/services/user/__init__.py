"""User-related services (account lifecycle, etc.)."""

from app.services.user.delete_user import delete_user_and_all_related_data

__all__ = ["delete_user_and_all_related_data"]
