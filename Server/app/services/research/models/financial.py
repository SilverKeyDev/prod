from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class Affordability(BaseModel):
    """Affordability, taxes, long-term costs, projected value"""
    affordability_rating: str = Field(..., description="Overall affordability score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    monthly_payment: str = Field(..., description="Estimated monthly mortgage payment for typical home in the area. Extremely brief.")
    property_taxes: str = Field(..., description="Annual property tax rates and typical amounts. Extremely brief.")
    long_term_costs: str = Field(..., description="Long-term cost considerations including maintenance, HOA, insurance. Extremely brief.")
    projected_value: str = Field(..., description="Property value trends and projected appreciation/depreciation. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        income = user_preferences.get("gross_income", 'middle') if user_preferences else 'middle'
        budget_min = user_preferences.get("home_budget_min") if user_preferences else None
        budget_max = user_preferences.get("home_budget_max") if user_preferences else None
        
        if budget_min and budget_max:
            price_range = f"${int(budget_min):,}-${int(budget_max):,}"
        else:
            price_range = '$300,000-$500,000'
        
        return {
            "affordability_rating": "8.7",
            "monthly_payment": f"$3,200/month for median home in {price_range} with 20% down, 30-year fixed at 6.5%",
            "property_taxes": "1.2% effective rate, approximately $7,200/year for median home value",
            "long_term_costs": "Annual maintenance ~$4,000, HOA $200/month, insurance $1,500/year. Total annual costs ~$15,000",
            "projected_value": "Values increased 8% last year, strong market with low inventory, projected 5-7% annual growth"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        gross_income = user_preferences.get("gross_income", '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        budget_min = user_preferences.get("home_budget_min") if user_preferences else None
        budget_max = user_preferences.get("home_budget_max") if user_preferences else None
        if budget_min and budget_max:
            home_budget = f"${int(budget_min):,}-${int(budget_max):,}"
        else:
            home_budget = '$300,000-$500,000'
        
        return {
            "affordability_rating": "Overall affordability score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's financial priorities and constraints.",
            "monthly_payment": f"Estimated monthly mortgage payment for typical home in the area. Extremely brief. Consider user's income ({gross_income}) and budget ({home_budget}).",
            "property_taxes": "Annual property tax rates and typical amounts. Extremely brief. Relate to user's financial capacity.",
            "long_term_costs": "Long-term cost considerations including maintenance, HOA fees, insurance, and utilities. Extremely brief. Frame in context of user's budget.",
            "projected_value": "Property value trends and projected appreciation/depreciation. Extremely brief. Consider market conditions and user's investment timeline."
        }
