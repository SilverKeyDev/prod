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
    opening_offer: Decimal = Field(..., description="Initial offer amount")
    price_rationale: str = Field(..., description="Justification for opening offer based on comps")
    credits_and_terms: List[str] = Field(default_factory=list, description="Requested seller credits and terms")
    inspection_plan: str = Field(..., description="Inspection strategy and repair tolerance")
    timeline: str = Field(..., description="Proposed closing timeline")
    offer_strength: str = Field(..., description="What makes this offer strong")


class MarketSection(BaseModel):
    """Local market with national snapshot"""
    local_market_stats: List[str] = Field(..., description="3-4 key local market statistics")
    buyer_leverage: str = Field(..., description="Overall buyer leverage assessment")
    national_snapshot: str = Field(..., description="Brief national market context")
    neighborhood_snapshot: str = Field(..., description="Brief neighborhood-specific market context")


class NegotiationStrategy(BaseModel):
    """Complete negotiation strategy with core sections"""
    price_section: PriceSection
    market_section: MarketSection
    
    @classmethod
    def from_user_preferences(
        cls,
        user_preferences: Dict[str, Any],
        market_data: Dict[str, Any],
        property_data: Optional[Dict[str, Any]] = None,
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
        
        # Extract key data with validation
        home_budget_max = user_preferences.get('home_budget_max', 500000)
        
        if not isinstance(home_budget_max, (int, float, str)):
            home_budget_max = 500000
        
        try:
            budget_max = Decimal(str(home_budget_max))
            if budget_max <= 0:
                budget_max = Decimal('500000')
        except (ValueError, TypeError):
            budget_max = Decimal('500000')
            
        opening_offer = budget_max * Decimal('0.95')  # Start at 95% of budget
        
        # Create sophisticated price rationale with specific comp comparisons
        def create_detailed_price_rationale(target_property: Optional[Dict], comps: List[Dict], opening_amount: Decimal) -> str:
            """Create detailed price rationale referencing specific comparable properties"""
            
            if not comps or len(comps) == 0:
                return f"Opening at ${opening_amount:,.0f} (95% of budget). Based on comparable sales in the area."
            
            # Extract target property details
            target_price = None
            target_beds = None
            target_baths = None
            target_sqft = None
            target_address = "this property"
            
            if target_property:
                target_price = target_property.get('price') or target_property.get('listPrice')
                target_beds = target_property.get('bedrooms') or target_property.get('beds')
                target_baths = target_property.get('bathrooms') or target_property.get('baths')
                target_sqft = target_property.get('livingArea') or target_property.get('sqft')
                target_address = target_property.get('address', 'this property')
            
            # Analyze comps and create detailed comparisons
            comp_analysis = []
            price_range = []
            
            for i, comp in enumerate(comps[:3]):  # Limit to top 3 comps
                if not isinstance(comp, dict):
                    continue
                    
                comp_address = comp.get('address', f'Comp {i+1}')
                comp_price = comp.get('sold_price', comp.get('price', 0))
                comp_beds = comp.get('beds', comp.get('bedrooms'))
                comp_baths = comp.get('baths', comp.get('bathrooms'))
                comp_sqft = comp.get('living_sqft', comp.get('sqft', comp.get('livingArea')))
                comp_date = comp.get('sold_date', comp.get('date'))
                
                if comp_price:
                    price_range.append(float(comp_price))
                
                # Create detailed comparison
                comparison_details = []
                
                if target_beds and comp_beds:
                    bed_diff = target_beds - comp_beds
                    if bed_diff > 0:
                        comparison_details.append(f"+{bed_diff:.0f} bed")
                    elif bed_diff < 0:
                        comparison_details.append(f"{bed_diff:.0f} bed")
                
                if target_baths and comp_baths:
                    bath_diff = target_baths - comp_baths
                    if bath_diff > 0:
                        comparison_details.append(f"+{bath_diff:.0f} bath")
                    elif bath_diff < 0:
                        comparison_details.append(f"{bath_diff:.0f} bath")
                
                if target_sqft and comp_sqft:
                    sqft_diff = target_sqft - comp_sqft
                    sqft_diff_pct = (sqft_diff / comp_sqft) * 100 if comp_sqft > 0 else 0
                    if abs(sqft_diff_pct) > 5:  # Only mention if >5% difference
                        if sqft_diff > 0:
                            comparison_details.append(f"+{sqft_diff_pct:.0f}% sqft")
                        else:
                            comparison_details.append(f"{sqft_diff_pct:.0f}% sqft")
                
                # Format comparison text
                comparison_text = ""
                if comparison_details:
                    comparison_text = f" ({', '.join(comparison_details)})"
                
                comp_analysis.append(f"• {comp_address}: ${comp_price:,.0f}{comparison_text}")
            
            # Calculate price range and positioning
            if price_range:
                min_price = min(price_range)
                max_price = max(price_range)
                avg_price = sum(price_range) / len(price_range)
                
                # Determine positioning relative to comps
                if target_price:
                    if opening_amount < min_price:
                        positioning = f"aggressive below-market positioning (${min_price - opening_amount:,.0f} below lowest comp)"
                    elif opening_amount > max_price:
                        positioning = f"above-market positioning (${opening_amount - max_price:,.0f} above highest comp)"
                    else:
                        positioning = f"competitive positioning within comp range"
                else:
                    positioning = f"strategic positioning at 95% of budget"
                
                rationale = f"Opening at ${opening_amount:,.0f} based on detailed comparable analysis:\n\n"
                rationale += f"COMPARABLE SALES ANALYSIS:\n"
                rationale += "\n".join(comp_analysis)
                rationale += f"\n\nPRICE POSITIONING: {positioning}\n"
                rationale += f"Comp range: ${min_price:,.0f} - ${max_price:,.0f} (avg: ${avg_price:,.0f})\n"
                rationale += f"Market rationale: Recent sales support this opening offer with {len(comps)} comparable properties analyzed."
                
                return rationale
            else:
                return f"Opening at ${opening_amount:,.0f} (95% of budget). Based on comparable sales in the area."
        
        # Get comps from market data
        comps = market_data.get('comps', [])
        
        # Create detailed price rationale
        detailed_rationale = create_detailed_price_rationale(property_data, comps, opening_offer)
        
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
        try:
            down_payment = float(down_payment) if down_payment is not None else 0
        except (ValueError, TypeError):
            down_payment = 0
            
        if down_payment > float(home_budget_max) * 0.2:
            offer_strength = "Strong down payment (>20%) with pre-approval eliminates financing risk"
        else:
            offer_strength = "Pre-approved financing with competitive down payment"
        
        price_section = PriceSection(
            opening_offer=opening_offer,
            price_rationale=detailed_rationale,
            offer_strength=offer_strength
        )
        
        # Create MarketSection
        local_stats = []
        if market_data.get('inventory_level'):
            local_stats.append(f"Inventory: {market_data['inventory_level']}")
        if market_data.get('average_days_on_market'):
            local_stats.append(f"Average DOM: {market_data['average_days_on_market']} days")
        if market_data.get('market_trend'):
            local_stats.append(f"Market trend: {market_data['market_trend']}")
        
        market_section = MarketSection(
            local_market_stats=local_stats[:4],  # Limit to 4 stats
            buyer_leverage="Market conditions provide moderate buyer leverage with opportunity for strategic negotiations",
            national_snapshot="National housing market showing signs of stabilization with regional variations",
            neighborhood_snapshot="Neighborhood market conditions reflect local trends and property characteristics"
        )
        
        # Apply any overrides
        data = {
            'price_section': price_section,
            'market_section': market_section,
            **overrides
        }
        
        return cls(**data)
    
    def validate_strategy(self) -> bool:
        """Validate that the strategy has all required components"""
        try:
            # Check that all sections exist
            if not self.price_section or not self.market_section:
                return False
            
            # Check that price section has required fields
            if not self.price_section.opening_offer:
                return False
                
            # Check that market section has some data
            if not self.market_section.local_market_stats:
                return False
                
            return True
        except Exception:
            return False
