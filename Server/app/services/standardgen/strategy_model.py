from __future__ import annotations

from decimal import Decimal
from enum import Enum
from typing import List, Optional, Dict, Literal, Tuple, Any
from pydantic import BaseModel, Field, field_validator, computed_field
import json


# ---------- Enums ----------

class SellerReason(str, Enum):
    RELOCATION = "relocation"
    UPSIZING = "upsizing"
    DOWNSIZING = "downsizing"
    DIVORCE = "divorce"
    ESTATE_SALE = "estate_sale"
    FINANCIAL_DISTRESS = "financial_distress"
    INVESTMENT_OFFLOAD = "investment_offload"
    UNKNOWN = "unknown"


class MarketCondition(str, Enum):
    HOT_SELLERS = "hot_sellers_market"
    BALANCED = "balanced"
    BUYERS = "buyers_market"
    STALE_LISTING = "stale_listing"


class FinancingType(str, Enum):
    CASH = "cash"
    CONVENTIONAL = "conventional"
    FHA = "fha"
    VA = "va"
    OTHER = "other"


class Contingency(str, Enum):
    INSPECTION = "inspection"
    FINANCING = "financing"
    APPRAISAL = "appraisal"
    HOME_SALE = "home_sale"
    TITLE = "title"
    OTHER = "other"


# ---------- Core Sections ----------

class Comp(BaseModel):
    address: str
    sold_price: Decimal = Field(..., ge=0)
    sold_date: str = Field(..., description="ISO date, e.g. 2025-06-30")
    beds: Optional[float] = None
    baths: Optional[float] = None
    living_sqft: Optional[int] = Field(default=None, ge=0)
    lot_sqft: Optional[int] = Field(default=None, ge=0)
    condition_notes: Optional[str] = None
    adjustments_notes: Optional[str] = None


class PriceSection(BaseModel):
    """Price + credits/terms, inspection plan, timeline, strength"""
    max_price: Decimal = Field(..., description="Maximum price willing to pay")
    opening_offer: Decimal = Field(..., description="Initial offer amount")
    price_rationale: str = Field(..., description="Justification for opening offer based on comps")
    credits_and_terms: List[str] = Field(default_factory=list, description="Requested seller credits and terms")
    inspection_plan: str = Field(..., description="Inspection strategy and repair tolerance")
    timeline: str = Field(..., description="Proposed closing timeline")
    offer_strength: str = Field(..., description="What makes this offer strong")


class CounterSection(BaseModel):
    """Counteroffer strategy and tactics"""
    max_rounds: int = Field(default=3, ge=1, le=5)
    concessions_you_can_make: List[str] = Field(
        default_factory=list,
        description="What you're willing to give up in negotiations"
    )
    escalation_strategy: str = Field(
        default="No escalation - use comp-based rationale and holding cost pressure instead",
        description="When/how to escalate your offer, if at all"
    )
    emotion_control_notes: str = Field(
        default="Stay calm, cite comps and market data, avoid emotional attachment",
        description="Reminders to stay objective and data-driven"
    )


class MarketSection(BaseModel):
    """Local market with comps + national snapshot"""
    local_market_stats: List[str] = Field(..., description="3-4 key local market statistics")
    buyer_leverage: str = Field(..., description="Overall buyer leverage assessment")
    comps: List[str] = Field(default_factory=list, description="List of comparable sales as readable strings")
    national_snapshot: str = Field(..., description="Brief national market context")


class CopyPasteSection(BaseModel):
    """Ready-to-send offer blurb"""
    offer_text: str = Field(..., description="Complete offer text ready to send")
    key_talking_points: List[str] = Field(default_factory=list, description="Key points to emphasize when presenting")


class NegotiationStrategy(BaseModel):
    """Complete negotiation strategy with 4 core sections"""
    price_section: PriceSection
    counter_section: CounterSection
    market_section: MarketSection
    
    @classmethod
    def from_user_preferences(
        cls,
        user_preferences: Dict[str, Any],
        market_data: Dict[str, Any],
        **overrides
    ) -> "NegotiationStrategy":
        """Create a personalized NegotiationStrategy from user preferences"""
        
        # Parse JSON fields safely
        def parse_json_field(field_value):
            if field_value is None:
                return []
            if isinstance(field_value, list):
                return field_value
            try:
                return json.loads(field_value) if isinstance(field_value, str) else []
            except (json.JSONDecodeError, TypeError):
                return []
        
        # Extract key data
        home_budget = user_preferences.get('home_budget', 500000)
        max_price = Decimal(str(home_budget))
        opening_offer = max_price * Decimal('0.95')  # Start at 95% of max
        
        # Create PriceSection
        renovation_pref = user_preferences.get('renovation_preference', 'minor')
        
        # Credits and terms based on user profile
        credits_and_terms = []
        if user_preferences.get('credit_score_range') in ['fair', 'poor']:
            credits_and_terms.append("3% seller-paid closing costs")
        if user_preferences.get('home_buying_experience') == 'first_time':
            credits_and_terms.append("1-year home warranty")
        credits_and_terms.append("Repair credits for items >$500")
        
        # Inspection plan based on renovation preference
        inspection_plans = {
            'none': 'Low tolerance for undisclosed repairs — will require seller credits for any issues over $1,000',
            'minor': 'Standard condition tolerance — will request credits for repairs over $500 individual or $2,000 cumulative',
            'major': 'Buyer expects rehab property and will require seller credits only for major structural/system issues beyond disclosed condition',
            'complete': 'Buyer expects rehab property and will require seller credits only for major structural/system issues beyond disclosed condition'
        }
        inspection_plan = inspection_plans.get(renovation_pref, inspection_plans['minor'])
        
        # Timeline based on urgency
        urgency_level = user_preferences.get('property_search_stage', 'moderate')
        if urgency_level == 'ready_to_buy':
            timeline = "21-day close to create competitive advantage"
        elif urgency_level == 'just_looking':
            timeline = "30-day close to accommodate seller timeline"
        else:
            timeline = "25-day close to balance speed with due diligence"
        
        # Offer strength
        down_payment = user_preferences.get('down_payment', 0)
        if down_payment > home_budget * 0.2:
            offer_strength = "Strong down payment (>20%) with pre-approval eliminates financing risk"
        else:
            offer_strength = "Pre-approved financing with competitive down payment"
        
        price_section = PriceSection(
            opening_offer=opening_offer,
            price_rationale=f"Opening at ${opening_offer:,.0f} (95% of max budget). Based on comparable sales in the area.",
            credits_and_terms=credits_and_terms,
            inspection_plan=inspection_plan,
            timeline=timeline,
            offer_strength=offer_strength
        )
        
        # Create CounterSection
        concessions_you_can_make = []
        if user_preferences.get('desired_closing_date') is None:
            concessions_you_can_make.append("Flexible closing date (seller chooses within 60 days)")
        if user_preferences.get('home_buying_experience') == 'experienced':
            concessions_you_can_make.append("Shortened inspection period (5 days vs 10)")
        if down_payment > home_budget * 0.5:
            concessions_you_can_make.append("Waive financing contingency")
        
        counter_section = CounterSection(
            max_rounds=3,
            concessions_you_can_make=concessions_you_can_make,
            escalation_strategy="No escalation - use comp-based rationale and holding cost pressure instead",
            emotion_control_notes="Stay calm, cite comps and market data, avoid emotional attachment"
        )
        
        # Create MarketSection
        local_stats = []
        if market_data.get('inventory_level'):
            local_stats.append(f"Inventory: {market_data['inventory_level']}")
        if market_data.get('average_days_on_market'):
            local_stats.append(f"Average DOM: {market_data['average_days_on_market']} days")
        if market_data.get('market_trend'):
            local_stats.append(f"Market trend: {market_data['market_trend']}")
        
        # Convert comps to readable strings
        comp_strings = []
        comps = market_data.get('comps', [])
        for comp in comps[:3]:  # Limit to 3 comps
            if isinstance(comp, dict) and comp.get('address') and comp.get('sold_price'):
                comp_strings.append(f"{comp['address']}: ${comp['sold_price']:,.0f}")
        
        market_section = MarketSection(
            local_market_stats=local_stats[:4],  # Limit to 4 stats
            buyer_leverage="Market conditions provide moderate buyer leverage with opportunity for strategic negotiations",
            comps=comp_strings,
            national_snapshot="National housing market showing signs of stabilization with regional variations"
        )
        
        # Create CopyPasteSection
        offer_text = f"""Subject: Offer for [Property Address]

Dear [Seller/Agent],

We are pleased to submit our offer for the above property:

OFFER DETAILS:
• Purchase Price: ${opening_offer:,.0f}
• Earnest Money: ${max(5000, max_price * Decimal('0.01')):,.0f}
• Closing Timeline: {timeline}
• Financing: Pre-approved conventional loan

KEY TERMS:
• Inspection period: 7 days
• Appraisal contingency: 14 days
• Closing costs: {credits_and_terms[0] if credits_and_terms else 'Standard'}

This offer reflects current market conditions and comparable sales in the area. We are committed buyers with strong financing and flexible timeline.

Please let us know if you have any questions.

Best regards,
[Buyer Name]"""

        key_talking_points = [
            f"Strong offer at ${opening_offer:,.0f} based on market comps",
            "Pre-approved financing eliminates risk",
            "Flexible timeline accommodates seller needs",
            "Competitive earnest money shows commitment"
        ]
        
        # Apply any overrides
        data = {
            'price_section': price_section,
            'counter_section': counter_section,
            'market_section': market_section,
            **overrides
        }
        
        return cls(**data)