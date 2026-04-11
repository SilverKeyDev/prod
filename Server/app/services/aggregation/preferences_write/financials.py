"""Financial preference writes."""

from typing import Any

from app import db
from app.models import UserFinancials


def write_financials_from_payload(user_id: str, data: dict[str, Any]) -> UserFinancials:
    """Write UserFinancials from preferences payload."""
    fin = UserFinancials.query.filter_by(user_id=user_id).first()
    if fin is None:
        fin = UserFinancials(user_id=user_id)
        db.session.add(fin)
    if "home_budget_min" in data and data["home_budget_min"] is not None:
        fin.home_budget_min = float(data["home_budget_min"])
    if "home_budget_max" in data and data["home_budget_max"] is not None:
        fin.home_budget_max = float(data["home_budget_max"])
    if "gross_income" in data and data["gross_income"] is not None:
        fin.gross_income = float(data["gross_income"])
    if "down_payment" in data and data["down_payment"] is not None:
        fin.down_payment = float(data["down_payment"])
    if "credit_score_range" in data:
        fin.credit_score_range = (
            str(data["credit_score_range"]) if data["credit_score_range"] is not None else None
        )
    return fin
