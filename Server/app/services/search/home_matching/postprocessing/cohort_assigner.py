"""
Cohort assignment logic for grouping users with similar characteristics.
"""

from typing import Any

from sqlalchemy import select

from app import db
from app.models import User
from app.services.aggregation import get_preferences_dict_optional
from app.utils.db.orm_lookup import get_model
from logger import log


class CohortAssigner:
    """Assigns users to cohorts based on demographics, preferences, and behavior."""

    # Default cohort for cold-start users
    DEFAULT_COHORT = "default"

    def __init__(self):
        pass

    def get_user_cohort(self, user_id: str) -> str:
        """
        Assign a user to a cohort based on their characteristics.

        Args:
            user_id: User ID to assign cohort for

        Returns:
            Cohort ID string
        """
        try:
            user = get_model(User, user_id)
            if not user:
                return self.DEFAULT_COHORT
            prefs = get_preferences_dict_optional(user_id)
            if not prefs:
                return self.DEFAULT_COHORT
            cohort_parts = []
            budget_min = prefs.get("home_budget_min")
            budget_max = prefs.get("home_budget_max")
            if budget_min and budget_max:
                avg_budget = (budget_min + budget_max) / 2
                if avg_budget < 200000:
                    cohort_parts.append("budget_low")
                elif avg_budget < 500000:
                    cohort_parts.append("budget_mid")
                elif avg_budget < 1000000:
                    cohort_parts.append("budget_high")
                else:
                    cohort_parts.append("budget_premium")

            age = prefs.get("age")
            if age:
                if age < 30:
                    cohort_parts.append("age_young")
                elif age < 45:
                    cohort_parts.append("age_mid")
                elif age < 60:
                    cohort_parts.append("age_senior")
                else:
                    cohort_parts.append("age_retired")

            ideal_zip = prefs.get("ideal_zip_code")
            if ideal_zip:
                # Use first 3 digits of zipcode for regional grouping
                zip_prefix = ideal_zip[:3] if len(ideal_zip) >= 3 else "unknown"
                cohort_parts.append(f"zip_{zip_prefix}")

            housing_type = prefs.get("housing_type")
            if housing_type:
                # Normalize housing type to simple categories
                housing_lower = housing_type.lower()
                if "condo" in housing_lower or "apartment" in housing_lower:
                    cohort_parts.append("type_condo")
                elif "townhouse" in housing_lower or "town" in housing_lower:
                    cohort_parts.append("type_townhouse")
                elif "single" in housing_lower or "house" in housing_lower:
                    cohort_parts.append("type_single")
                else:
                    cohort_parts.append("type_other")

            # If we have any cohort parts, combine them
            if cohort_parts:
                cohort_id = "_".join(cohort_parts)
                return cohort_id
            else:
                return self.DEFAULT_COHORT

        except Exception as e:
            log.error("ERRORS", f"Error assigning cohort for user {user_id}: {e}")
            return self.DEFAULT_COHORT

    def get_cohort_users(self, cohort_id: str) -> list:
        """
        Get all user IDs in a given cohort.

        Args:
            cohort_id: Cohort ID to get users for

        Returns:
            List of user IDs
        """
        try:
            if cohort_id == self.DEFAULT_COHORT:
                # For default cohort, return users without preferences or with minimal data
                users = db.session.scalars(
                    select(User).where(User.has_preferences.is_(False))
                ).all()
                return [str(u.id) for u in users]

            # For other cohorts, we'd need to query based on cohort characteristics
            # For now, return empty list - this can be optimized later
            # by storing cohort_id on User model or using a more efficient query
            return []

        except Exception as e:
            log.error("ERRORS", f"Error getting users for cohort {cohort_id}: {e}")
            return []

    def get_user_cohort_characteristics(self, user_id: str) -> dict[str, Any]:
        """
        Get the characteristics that define a user's cohort.

        Args:
            user_id: User ID

        Returns:
            Dictionary of cohort characteristics
        """
        try:
            user = get_model(User, user_id)
            if not user:
                return {}
            prefs = get_preferences_dict_optional(user_id)
            if not prefs:
                return {}
            characteristics = {}
            if prefs.get("home_budget_min") and prefs.get("home_budget_max"):
                characteristics["avg_budget"] = (
                    prefs["home_budget_min"] + prefs["home_budget_max"]
                ) / 2
            if prefs.get("age"):
                characteristics["age"] = prefs["age"]
            ideal_zip = prefs.get("ideal_zip_code")
            if ideal_zip:
                characteristics["zip_prefix"] = ideal_zip[:3] if len(ideal_zip) >= 3 else None
            if prefs.get("housing_type"):
                characteristics["housing_type"] = prefs["housing_type"]

            return characteristics

        except Exception as e:
            log.error("ERRORS", f"Error getting cohort characteristics for user {user_id}: {e}")
            return {}


# Global instance
cohort_assigner = CohortAssigner()
