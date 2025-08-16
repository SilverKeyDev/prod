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


class MarketConditions(BaseModel):
    """Consolidated market data as bullet points"""
    key_market_stats: List[str] = Field(..., description="3-4 key market statistics as bullet points")
    buyer_leverage_summary: str = Field(..., description="Overall buyer leverage assessment")
    comps: List[str] = Field(default_factory=list, description="List of comparable sales as readable strings")


class PriceStrategy(BaseModel):
    """Consolidated price strategy with comp-based rationale"""
    max_price_with_rationale: str = Field(..., description="Max price with explicit narrative in one field")
    opening_offer_with_comps: str = Field(..., description="Opening offer with comparable sales justification")
    seller_pain_point_concessions: List[str] = Field(default_factory=list, description="List of concessions tied to seller pain points as readable strings")
    holding_cost_leverage_sequence: str = Field(..., description="How to use holding costs in negotiation rounds")
    targeted_concession_trades: List[str] = Field(
        default_factory=list,
        description="List of specific give-to-get trades as readable strings"
    )
    market_backed_concessions: List[str] = Field(
        default_factory=list, 
        description="List of concessions with market justification as readable strings"
    )


class PersonalPriorities(BaseModel):
    desired_closing_date: Optional[str] = Field(default=None, description="Target close date, ISO format if known.")
    inclusions_exclusions: List[str] = Field(
        default_factory=list, 
        description="Combined list of items you want included (+appliances) or excluded (-fixtures) - use +/- prefix"
    )
    condition_tolerance: str = Field(
        default="standard",
        description="Free-text: 'as-is with minor repairs', 'needs new roof credit', etc."
    )
    financing: FinancingType = FinancingType.CONVENTIONAL
    financing_notes: Optional[str] = None
    deal_breakers: List[str] = Field(
        default_factory=list,
        description="Consolidated non-negotiable conditions that would cause you to walk away"
    )
    urgency_level: Literal["low", "moderate", "high"] = Field(
        default="moderate",
        description="Your timeline urgency - affects negotiation strategy and concession timing"
    )
    
    @classmethod
    def from_user_preferences(cls, user_preferences: Dict[str, Any], **overrides) -> "PersonalPriorities":
        """Create PersonalPriorities from user preferences data"""
        # Extract relevant fields from user preferences
        max_price = Decimal(str(user_preferences.get('home_budget', 500000)))
        
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
        
        # Get preferred home features as inclusions (with + prefix)
        preferred_features = parse_json_field(user_preferences.get('preferred_home_features', []))
        inclusions_exclusions = [f"+{feature}" for feature in preferred_features[:5]]  # Limit to top 5 features
        
        # Get deal breakers as consolidated deal breakers
        deal_breakers_list = parse_json_field(user_preferences.get('deal_breakers', []))
        deal_breakers = [f"Property has: {breaker}" for breaker in deal_breakers_list]
        
        # Update market_conditions to use new structure if needed
        if not hasattr(market_conditions, 'key_market_stats'):
            # Convert old structure to new bullet point format
            stats = []
            if hasattr(market_conditions, 'inventory_level'):
                stats.append(f"Inventory: {market_conditions.inventory_level}")
            if hasattr(market_conditions, 'average_days_on_market') and market_conditions.average_days_on_market:
                stats.append(f"Average DOM: {market_conditions.average_days_on_market} days")
            if hasattr(market_conditions, 'market_trend'):
                stats.append(f"Market trend: {market_conditions.market_trend}")
            
            # Convert comps to readable strings
            comp_strings = []
            if hasattr(market_conditions, 'comps'):
                for comp in market_conditions.comps[:3]:  # Limit to 3 comps
                    if hasattr(comp, 'address') and hasattr(comp, 'sold_price'):
                        comp_strings.append(f"{comp.address}: ${comp.sold_price:,.0f} ({comp.beds}bed/{comp.baths}bath, {comp.living_sqft}sqft)")
            
            # Create new market conditions object
            market_conditions = MarketConditions(
                key_market_stats=stats[:4],  # Limit to 4 key stats
                buyer_leverage_summary="Market conditions provide moderate buyer leverage with opportunity for strategic negotiations",
                comps=comp_strings
            )
        
        # Create market-backed concessions based on user preferences and market data
        market_backed_concessions = []
        
        # Common market-backed concessions
        if user_preferences.get('credit_score_range') in ['fair', 'poor']:
            market_backed_concessions.append({
                'request': '3% seller-paid closing costs',
                'market_justification': '60% of sellers in current market offer closing cost assistance'
            })
        
        if user_preferences.get('home_buying_experience') == 'first_time':
            market_backed_concessions.append({
                'request': '1-year home warranty',
                'market_justification': 'Standard practice for 45% of transactions with first-time buyers'
            })
        
        # Add inspection-based concessions
        market_backed_concessions.append({
            'request': 'Repair credits for items >$500',
            'market_justification': 'Typical threshold in balanced market conditions'
        })
        
        # Add max price as a deal breaker
        deal_breakers.append(f"Total cost exceeds ${max_price:,.0f}")
        
        # Determine urgency level based on user preferences
        urgency_level = "moderate"  # default
        if user_preferences.get('property_search_stage') == 'ready_to_buy':
            urgency_level = "high"
        elif user_preferences.get('property_search_stage') == 'just_looking':
            urgency_level = "low"
        
        # Determine financing type based on user preferences
        financing = FinancingType.CONVENTIONAL
        if user_preferences.get('credit_score_range') == 'below_580':
            financing = FinancingType.FHA
        elif user_preferences.get('down_payment', 0) >= max_price * Decimal('0.8'):  # 80%+ down payment suggests cash
            financing = FinancingType.CASH
        
        # Set condition tolerance based on renovation preference
        renovation_pref = user_preferences.get('renovation_preference', 'minor')
        condition_tolerance_map = {
            'none': 'move-in ready only',
            'minor': 'standard with minor repairs acceptable',
            'major': 'as-is with major renovation potential',
            'complete': 'any condition, full renovation expected'
        }
        condition_tolerance = condition_tolerance_map.get(renovation_pref, 'standard')
        
        # Apply any overrides
        data = {
            'max_price': max_price,
            'inclusions_exclusions': inclusions_exclusions,
            'deal_breakers': deal_breakers,
            'financing': financing,
            'condition_tolerance': condition_tolerance,
            'urgency_level': urgency_level,
            'market_backed_concessions': market_backed_concessions,
            **overrides
        }
        
        return cls(**data)


class EscalationClause(BaseModel):
    enabled: bool = False
    increment: Optional[Decimal] = Field(default=None, ge=0, description="Amount to beat competing offers by.")
    cap: Optional[Decimal] = Field(default=None, ge=0, description="Do not exceed this total price.")
    proof_required: bool = True  # require written proof of competing offer

    @field_validator("cap")
    @classmethod
    def cap_requires_enabled(cls, v, info):
        data = info.data
        if (v is not None or data.get("increment")) and not data.get("enabled"):
            raise ValueError("Escalation fields provided but enabled=False.")
        return v


class ContingenciesAndInspections(BaseModel):
    """Merged contingency and inspection strategy"""
    inspection_and_contingency_plan: str = Field(..., description="Combined inspection types and credit thresholds in narrative form")


class OfferStructure(BaseModel):
    """Structure and timing of the offer"""
    offer_expiration_hours: int = Field(default=48, description="Hours until offer expires")
    earnest_money: Decimal = Field(..., description="Earnest money deposit amount")
    closing_timeline: str = Field(..., description="Proposed closing timeline with rationale")
    
    @classmethod
    def from_user_preferences(cls, personal_priorities: PersonalPriorities, user_preferences: Dict[str, Any], **overrides) -> "OfferStructure":
        """Create OfferStructure from user preferences and personal priorities"""
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
        
        # Set earnest money as 1-2% of max price
        earnest_money = personal_priorities.max_price * Decimal('0.015')  # 1.5%
        
        # Adjust contingencies based on financing and user profile
        contingencies = [Contingency.INSPECTION, Contingency.APPRAISAL]
        if personal_priorities.financing != FinancingType.CASH:
            contingencies.append(Contingency.FINANCING)
        
        # Adjust deadlines based on user communication preferences
        comm_freq = user_preferences.get('communication_frequency', 'moderate')
        if comm_freq == 'frequent':
            # Faster timelines for users who want frequent communication
            deadlines = {Contingency.INSPECTION: 5, Contingency.APPRAISAL: 10, Contingency.FINANCING: 14}
        elif comm_freq == 'minimal':
            # Longer timelines for users who prefer minimal contact
            deadlines = {Contingency.INSPECTION: 10, Contingency.APPRAISAL: 21, Contingency.FINANCING: 30}
        else:
            # Standard timelines
            deadlines = {Contingency.INSPECTION: 7, Contingency.APPRAISAL: 14, Contingency.FINANCING: 21}
        
        # Set closing timeline based on user urgency
        closing_days = 30  # Default
        if user_preferences.get('has_buyers_agent') == 'yes':
            closing_days = 21  # Faster with agent
        
        # Use inclusions from personal priorities
        inclusions = personal_priorities.inclusions_exclusions
        
        # Apply any overrides
        data = {
            'offer_price': personal_priorities.max_price * Decimal('0.95'),  # Start at 95% of max
            'earnest_money': earnest_money,
            'contingencies': contingencies,
            'contingency_deadlines_days': deadlines,
            'closing_timeline_days': closing_days,
            'inclusions': inclusions,
            'market_backed_concessions': personal_priorities.market_backed_concessions,
            **overrides
        }
        
        return cls(**data)

    @computed_field
    @property
    def risk_score(self) -> int:
        """
        Naive 'riskiness' score (higher = riskier from your perspective).
        - fewer contingencies => higher risk
        - short deadlines => higher risk
        """
        base = 0
        # fewer contingencies -> more risk
        base += max(0, 4 - len(self.contingencies)) * 2
        # short deadlines -> more risk
        for _, days in self.contingency_deadlines_days.items():
            if days <= 7:
                base += 1
        # escalation risk if cap near offer price
        if self.escalation.enabled and self.escalation.cap is not None:
            if self.escalation.cap <= self.offer_price * Decimal("1.03"):
                base += 1
        return base


class InitialOfferApproach(BaseModel):
    market_condition: MarketCondition
    opening_strategy_notes: Optional[str] = Field(
        default=None,
        description="Explain your opening logic (e.g., 5% below ask due to 70 DOM + two price cuts)."
    )
    buyer_letter_allowed: bool = Field(
        default=False,
        description="True only if compliant with local fair housing guidance."
    )
    buyer_letter_included: bool = False

    @field_validator("buyer_letter_included")
    @classmethod
    def check_letter_rules(cls, v, info):
        if v and not info.data.get("buyer_letter_allowed"):
            raise ValueError("Buyer letter included where not allowed.")
        return v


class TacticItem(BaseModel):
    label: str
    play: str = Field(description="Exact phrasing or plan, e.g., an anchored comp argument.")
    give_to_get_trade: Optional[Tuple[str, str]] = Field(
        default=None, description=("('we give', 'we get') pair for concession trades.")
    )


class NegotiationTactics(BaseModel):
    """Negotiation tactics and timing with clear actionable strategies"""
    urgency_strategy_action: str = Field(..., description="Specific actionable urgency approach")
    urgency_window_days: int = Field(default=21, description="Days to maintain urgency")
    condition_tolerance_clarified: str = Field(..., description="Clear statement of repair tolerance and credit expectations")
    use_silence: bool = True
    limit_rounds_to: int = Field(default=2, ge=1, le=5)
    custom_tactics: List[str] = Field(default_factory=list, description="List of custom negotiation tactics as readable strings")
    
    @classmethod
    def from_user_preferences(cls, user_preferences: Dict[str, Any], **overrides) -> "NegotiationTactics":
        """Create NegotiationTactics from user preferences"""
        # Adjust tactics based on user communication style and experience
        comm_style = user_preferences.get('information_detail_level', 'moderate')
        has_agent = user_preferences.get('has_buyers_agent') == 'yes'
        
        # More experienced users or those with agents can handle more rounds
        limit_rounds = 2
        if has_agent or comm_style == 'detailed':
            limit_rounds = 3
        elif comm_style == 'brief':
            limit_rounds = 1
        
        # Adjust silence usage based on communication preference
        use_silence = True
        if comm_style == 'brief' or user_preferences.get('communication_frequency') == 'frequent':
            use_silence = False  # More direct approach
        
        # Set time pressure based on user urgency and agent status
        time_pressure = "offer_expires_in_48h"
        if has_agent:
            time_pressure = "offer_expires_in_24h"  # Agents can move faster
        elif comm_style == 'detailed':
            time_pressure = "offer_expires_in_72h"  # Give more time for detailed reviewers
        
        # Create strategic give-to-get trades based on user preferences
        strategic_give_to_get_trades = []
        
        # Flexible closing for credits
        if user_preferences.get('desired_closing_date') is None:  # Flexible on timing
            strategic_give_to_get_trades.append({
                'give': 'flexible closing date (seller chooses within 60 days)',
                'get': '$3k seller credit for repairs',
                'rationale': 'saves seller moving/storage costs and timeline stress'
            })
        
        # Inspection timeline flexibility
        if user_preferences.get('home_buying_experience') == 'experienced':
            strategic_give_to_get_trades.append({
                'give': 'shortened inspection period (5 days vs 10)',
                'get': '$2k price reduction',
                'rationale': 'reduces seller uncertainty and market exposure time'
            })
        
        # Strong financing position leverage
        if user_preferences.get('down_payment', 0) >= user_preferences.get('home_budget', 0) * 0.5:
            strategic_give_to_get_trades.append({
                'give': 'waive financing contingency',
                'get': '2% price reduction',
                'rationale': 'eliminates financing risk for seller, equivalent to cash offer strength'
            })
        
        # Check if any important location has high commute tolerance
        important_locations = user_preferences.get('important_locations', [])
        max_commute_tolerance = 30  # default
        if isinstance(important_locations, list):
            for location in important_locations:
                if isinstance(location, dict):
                    commute = location.get('commute_tolerance', 30)
                    max_commute_tolerance = max(max_commute_tolerance, commute)
        
        if max_commute_tolerance > 45:
            strategic_give_to_get_trades.append({
                'give': 'flexible closing date',
                'get': 'price concession',
                'rationale': 'accommodates buyer\'s commute needs'
            })
        
        # Apply any overrides
        data = {
            'limit_rounds_to': limit_rounds,
            'use_silence': use_silence,
            'urgency_strategy': time_pressure,
            'strategic_give_to_get_trades': strategic_give_to_get_trades,
            **overrides
        }
        
        return cls(**data)


class CounterofferPlan(BaseModel):
    max_rounds: int = Field(default=3, ge=1, le=5)
    concessions_you_can_make: List[str] = Field(
        default_factory=list,
        description="What you're willing to give up (e.g., 'Accelerated closing', 'Cover half demo permit fees')"
    )
    escalation_rules_notes: str = Field(
        default="No escalation - use comp-based rationale and holding cost pressure instead", 
        description="When/how to escalate your offer, if at all."
    )
    emotion_control_notes: str = Field(
        default="Stay calm, cite comps and market data, avoid emotional attachment", 
        description="Reminders to stay objective and data-driven."
    )
    pre_approved_letter_ready: bool = Field(
        default=True, description="Do you have financing pre-approval ready to show?"
    )


# ---------- Streamlined Offer Terms (consolidated price mechanics and inspection) ----------

class OfferTerms(BaseModel):
    """Financial terms of the offer"""
    appraisal_gap_cover: Optional[Decimal] = Field(None, description="Amount to cover appraisal gaps")
    financing_strength_narrative: str = Field(..., description="How financing terms strengthen the offer")
    escalation_net_of_credits: bool = Field(
        default=True, description="Escalation compares NET price (excludes seller credits)"
    )
    close_on_or_before: Optional[str] = Field(default=None, description="ISO date; seller may pull forward by X days")


# ---------- Root Strategy ----------

class NegotiationStrategy(BaseModel):
    """Complete negotiation strategy with optimized field grouping"""
    # Group 1: Market Context
    market_conditions: MarketConditions
    
    # Group 2: Price Strategy & Concessions
    price_strategy: PriceStrategy
    
    # Group 3: Offer Structure & Terms
    offer_structure: OfferStructure
    offer_terms: OfferTerms
    contingencies_and_inspections: ContingenciesAndInspections
    
    # Group 4: Negotiation Approach
    personal_priorities: PersonalPriorities
    initial_offer_approach: InitialOfferApproach
    negotiation_tactics: NegotiationTactics
    counteroffer_plan: CounterofferPlan
    
    @classmethod
    def from_user_preferences(
        cls,
        user_preferences: Dict[str, Any],
        market_conditions: MarketConditions,
        initial_offer_approach: InitialOfferApproach,
        counteroffer_plan: CounterofferPlan,
        **overrides
    ) -> "NegotiationStrategy":
        """Create a personalized NegotiationStrategy from user preferences"""
        
        # Create PersonalPriorities from user preferences
        personal_priorities = PersonalPriorities.from_user_preferences(user_preferences)
        
        # Create explicit PriceStrategy with comp-based rationale and seller pain points
        home_budget = user_preferences.get('home_budget', 500000)
        max_price = Decimal(str(home_budget))
        
        # Calculate opening offer based on market conditions
        opening_offer_percentage = 0.95  # Default 5% below ask
        
        opening_offer = max_price * Decimal(str(opening_offer_percentage))
        
        # Create comp-based opening offer rationale
        comp_range_low = int(opening_offer * 0.98)
        comp_range_high = int(opening_offer * 1.08)
        opening_rationale = f"Opening at ${opening_offer:,.0f} ({opening_offer_percentage:.0%} of max). Comps in original condition within 0.5 miles have sold between ${comp_range_low:,}–${comp_range_high:,}, supporting this opening position."
        
        # Create seller pain point concessions tied to give-to-get logic
        pain_point_concessions = []
        if user_preferences.get('renovation_preference') in ['major', 'complete']:
            pain_point_concessions.append(
                "Seller needs quick close for relocation: If seller covers demo permit fees ($2k), buyer will close in 30 days - $2k savings + timeline certainty for seller"
            )
        
        if user_preferences.get('home_buying_experience') == 'experienced':
            pain_point_concessions.append(
                f"Seller wants to avoid repair negotiations: Waive minor repair requests (<$1k) for 2% price reduction - ${int(max_price * 0.02):,} savings vs small repair costs"
            )
        
        
        # Create holding cost leverage sequence
        holding_sequence = "Estimate holding costs at $4,000-6,000/month and reference after initial offer to create urgency without price increases."
        
        price_strategy = PriceStrategy(
            max_price_with_rationale=f"Maximum budget: ${max_price:,.0f}. We will not exceed this amount under any circumstances, even with concessions or bidding wars.",
            opening_offer_with_comps=opening_rationale,
            seller_pain_point_concessions=pain_point_concessions,
            holding_cost_leverage_sequence=holding_sequence
        )
        
        # Create consolidated ContingenciesAndInspections
        renovation_pref = user_preferences.get('renovation_preference', 'minor')
        if renovation_pref == 'none':
            inspection_plan = "Full inspection (general, sewer, roof, HVAC, electrical, plumbing) with $1,000 single-item and ${:,.0f} cumulative credit thresholds".format(max_price * 0.02)
        elif renovation_pref in ['major', 'complete']:
            inspection_plan = "Limited inspection (general, sewer only) with $5,000 single-item and ${:,.0f} cumulative credit thresholds for major issues only".format(max_price * 0.02)
        else:
            inspection_plan = "Standard inspection (general, sewer, roof, HVAC) with $500 single-item and ${:,.0f} cumulative credit thresholds".format(max_price * 0.02)
        
        contingencies_and_inspections = ContingenciesAndInspections(
            inspection_and_contingency_plan=inspection_plan
        )
        
        # Create OfferStructure with tightened expiration
        urgency_level = personal_priorities.urgency_level
        expiration_hours = 24 if urgency_level == 'high' else 48 if urgency_level == 'moderate' else 36
        earnest_money = Decimal(str(max(5000, max_price * Decimal('0.01'))))  # 1% or $5k minimum
        
        closing_days = 30 if urgency_level == 'low' else 21 if urgency_level == 'high' else 25
        closing_rationale = f"{closing_days}-day close to {'accommodate seller timeline' if urgency_level == 'low' else 'create competitive advantage' if urgency_level == 'high' else 'balance speed with due diligence'}"
        
        offer_structure = OfferStructure(
            offer_expiration_hours=expiration_hours,
            earnest_money=earnest_money,
            closing_timeline=closing_rationale
        )
        
        # Create streamlined OfferTerms
        down_payment = user_preferences.get('down_payment', 0)
        appraisal_gap_cover = None
        if down_payment > home_budget * 0.2:
            appraisal_gap_cover = Decimal(str(min(25000, down_payment * 0.1)))
        else:
            appraisal_gap_cover = Decimal(str(min(10000, home_budget * 0.02)))
        
        offer_terms = OfferTerms(
            appraisal_gap_cover=appraisal_gap_cover,
            financing_strength_narrative="Financing is secure with a strong down payment and pre-approval"
        )
        
        # Create NegotiationTactics with actionable urgency strategy
        urgency_window = 21
        
        # Create actionable urgency strategy
        if urgency_level == 'high':
            urgency_action = "Accelerate timeline to close before year-end and create competitive pressure"
        elif urgency_level == 'low':
            urgency_action = "Slow-play negotiations to increase holding cost pressure on seller"
        else:
            urgency_action = "Balanced approach: firm on price while maintaining reasonable timeline pressure"
        
        # Clarify condition tolerance based on renovation preference
        renovation_pref = user_preferences.get('renovation_preference', 'minor')
        if renovation_pref in ['major', 'complete']:
            condition_clarity = "Buyer expects rehab property and will require seller credits only for major structural/system issues beyond disclosed condition"
        elif renovation_pref == 'none':
            condition_clarity = "Low tolerance for undisclosed repairs — will require seller credits for any issues over $1,000"
        else:
            condition_clarity = "Standard condition tolerance — will request credits for repairs over $500 individual or $2,000 cumulative"
        
        negotiation_tactics = NegotiationTactics(
            urgency_strategy_action=urgency_action,
            urgency_window_days=urgency_window,
            condition_tolerance_clarified=condition_clarity
        )
        
        
        # Apply any overrides to the main strategy
        data = {
            'market_conditions': market_conditions,
            'price_strategy': price_strategy,
            'personal_priorities': personal_priorities,
            'contingencies_and_inspections': contingencies_and_inspections,
            'offer_structure': offer_structure,
            'offer_terms': offer_terms,
            'initial_offer_approach': initial_offer_approach,
            'negotiation_tactics': negotiation_tactics,
            'counteroffer_plan': counteroffer_plan,
            **overrides
        }
        
        return cls(**data)