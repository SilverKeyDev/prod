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

class SellerIntel(BaseModel):
    reasons: List[SellerReason] = Field(default_factory=list, description="Why the seller might be moving.")
    stated_reason_notes: Optional[str] = Field(default=None, description="Any free-text notes from the listing agent.")
    time_pressure: Optional[str] = Field(default=None, description="E.g., 'needs to close in 30 days', 'double mortgage'.")
    days_on_market: Optional[int] = Field(default=None, ge=0)
    price_reductions_count: int = Field(default=0, ge=0)
    competing_offers_count: Optional[int] = Field(default=None, ge=0)
    competing_offers_above_ask: Optional[bool] = None

    intel_sources: List[str] = Field(
        default_factory=list,
        description="Where this intel came from (MLS history, Redfin/Zillow, county records, listing agent call)."
    )


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


class MarketData(BaseModel):
    subject_address: Optional[str] = None
    ask_price: Optional[Decimal] = Field(default=None, ge=0)
    comps: List[Comp] = Field(default_factory=list)
    price_per_sqft_trend_notes: Optional[str] = None
    pending_sales_notes: Optional[str] = None
    supply_demand_summary: Optional[str] = Field(
        default=None, description="Low inventory/high demand vs high inventory/long DOM, etc."
    )


class PersonalPriorities(BaseModel):
    max_price: Decimal = Field(..., ge=0)
    desired_closing_date: Optional[str] = Field(default=None, description="Target close date, ISO format if known.")
    inclusions: List[str] = Field(default_factory=list, description="Items you want included (appliances, fixtures).")
    exclusions: List[str] = Field(default_factory=list)
    condition_tolerance: str = Field(
        default="standard",
        description="Free-text: 'as-is with minor repairs', 'needs new roof credit', etc."
    )
    financing: FinancingType = FinancingType.CONVENTIONAL
    financing_notes: Optional[str] = None
    walk_away_conditions: List[str] = Field(
        default_factory=list,
        description="Explicit situations you will walk away (e.g., 'appraisal gap > $15k', 'fail sewer scope')."
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
        
        # Get preferred home features as inclusions
        preferred_features = parse_json_field(user_preferences.get('preferred_home_features', []))
        inclusions = preferred_features[:5]  # Limit to top 5 features
        
        # Get deal breakers as walk away conditions
        deal_breakers = parse_json_field(user_preferences.get('deal_breakers', []))
        walk_away_conditions = [f"Property has: {breaker}" for breaker in deal_breakers]
        
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
            'inclusions': inclusions,
            'walk_away_conditions': walk_away_conditions,
            'financing': financing,
            'condition_tolerance': condition_tolerance,
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


class OfferStructure(BaseModel):
    offer_price: Decimal = Field(..., ge=0)
    earnest_money: Optional[Decimal] = Field(default=None, ge=0)
    contingencies: List[Contingency] = Field(
        default_factory=lambda: [Contingency.INSPECTION, Contingency.APPRAISAL, Contingency.FINANCING]
    )
    contingency_deadlines_days: Dict[Contingency, int] = Field(
        default_factory=lambda: {Contingency.INSPECTION: 7, Contingency.APPRAISAL: 14, Contingency.FINANCING: 21}
    )
    closing_timeline_days: Optional[int] = Field(default=None, ge=7)
    rent_back_days: int = Field(default=0, ge=0, description="Optional seller rent-back period after closing.")
    inclusions: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    concessions_requested: List[str] = Field(default_factory=list, description="Credits, warranties, repairs, etc.")
    escalation: EscalationClause = Field(default_factory=EscalationClause)
    offer_expiration_hours: int = Field(default=48, ge=2, le=168)
    
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
        inclusions = personal_priorities.inclusions
        
        # Apply any overrides
        data = {
            'offer_price': personal_priorities.max_price * Decimal('0.95'),  # Start at 95% of max
            'earnest_money': earnest_money,
            'contingencies': contingencies,
            'contingency_deadlines_days': deadlines,
            'closing_timeline_days': closing_days,
            'inclusions': inclusions,
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
    anchors_with_comps: List[str] = Field(default_factory=list, description="Talking points tied to comps.")
    give_to_get_trades: List[Tuple[str, str]] = Field(
        default_factory=list, description="Pairs like ('shorter inspection', '$3k seller credit')."
    )
    use_silence: bool = True
    limit_rounds_to: int = Field(default=2, ge=1, le=5)
    time_pressure: str = Field(default="offer_expires_in_48h", description="How you'll apply gentle time pressure.")
    custom_tactics: List[TacticItem] = Field(default_factory=list)
    
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
        
        # Create standard give-to-get trades based on user flexibility
        renovation_pref = user_preferences.get('renovation_preference', 'minor')
        give_to_get_trades = []
        
        if renovation_pref in ['major', 'complete']:
            give_to_get_trades.append(("accept property as-is", "price reduction"))
            give_to_get_trades.append(("waive repair requests", "seller credit"))
        
        if user_preferences.get('commute_tolerance', 30) > 45:
            give_to_get_trades.append(("flexible closing date", "price concession"))
        
        # Apply any overrides
        data = {
            'limit_rounds_to': limit_rounds,
            'use_silence': use_silence,
            'time_pressure': time_pressure,
            'give_to_get_trades': give_to_get_trades,
            **overrides
        }
        
        return cls(**data)


class CounterofferPlan(BaseModel):
    pre_approved_letter_ready: bool = True
    concessions_you_can_make: List[str] = Field(
        default_factory=list, description="Pre-decided concessions you're willing to move on."
    )
    non_negotiables: List[str] = Field(default_factory=list, description="Hard limits not to cross.")
    escalation_rules_notes: Optional[str] = None
    emotion_control_notes: str = Field(
        default="Keep communication factual; avoid revealing urgency or personal constraints."
    )


# ---------- Compact, High-Impact Add-ons (kept minimal) ----------

class PriceMechanics(BaseModel):
    """Minimal price mechanics to avoid surprises."""
    appraisal_gap_cover: Optional[Decimal] = Field(
        default=None, ge=0,
        description="Max $ buyer will cover if appraisal < price (beyond this, renegotiate/cancel per contract)."
    )
    escalation_net_of_credits: bool = Field(
        default=True, description="Escalation compares NET price (excludes seller credits)."
    )
    escalate_against_cash_or_noncontingent: Optional[bool] = Field(
        default=None, description="If True, escalation can compete with cash/non-contingent offers."
    )
    escalation_proof_definition: Optional[str] = Field(
        default=None, description="What proof is sufficient, e.g., 'signed price page + proof of funds'."
    )
    tie_breaker_rule: Optional[str] = Field(
        default=None, description="How to resolve identical net offers (e.g., earlier close wins)."
    )


class InspectionPlan(BaseModel):
    """Lightweight inspection & remedy lane."""
    allowed_tests: List[str] = Field(
        default_factory=lambda: ["general", "sewer", "roof", "HVAC"],
        description="Pre-authorized inspections."
    )
    single_item_credit_threshold: Optional[Decimal] = Field(default=None, ge=0)
    cumulative_credit_threshold: Optional[Decimal] = Field(default=None, ge=0)
    hoa_review_days: Optional[int] = Field(default=None, ge=1, description="Days to review HOA docs if applicable.")
    title_acceptability_rules: List[str] = Field(
        default_factory=list,
        description="Short rules like 'no undisclosed easements' or 'no active litigation in HOA'."
    )


class TimelineFlex(BaseModel):
    """Simple timing flexibility without clutter."""
    close_on_or_before: Optional[str] = Field(default=None, description="ISO date; seller may pull forward by X days.")
    seller_pull_forward_days: Optional[int] = Field(default=None, ge=0)
    seller_notice_days: Optional[int] = Field(default=None, ge=0, description="Notice required to change close date.")
    rent_back_menu: List[str] = Field(
        default_factory=list,
        description="e.g., ['0 days', 'up to 15 days at PITI/day']"
    )


class ProofAndLender(BaseModel):
    """What the listing side needs to feel safe."""
    fully_underwritten: Optional[bool] = Field(
        default=None, description="True if DU/LP + underwriter-reviewed (TBD UW). Stronger than pre-approval."
    )
    lender_weekend_availability: Optional[str] = Field(default=None, description="e.g., 'Sat 9–5 / Sun on-call'.")
    funds_verification_plan: Optional[str] = Field(
        default=None, description="What you'll share and when (redacted balances, VOD letter cadence)."
    )


class OfferPackaging(BaseModel):
    """Keep offer packaging crisp and consistent."""
    include_comp_onepager: bool = True
    include_lender_intro: bool = True
    inclusions_exclusions_sheet: bool = True
    comms_cadence: Optional[str] = Field(default=None, description="Pre-/post-submission call schedule.")
    backup_offer_policy: Optional[str] = Field(default=None, description="Whether you'll submit as backup and for how long.")

class MarketTiming(BaseModel):
    seasonality_notes: Optional[str] = Field(
        default=None, description="Seasonal or cyclical factors affecting leverage."
    )
    macro_trend_notes: Optional[str] = Field(
        default=None, description="Interest rate trajectory, inventory changes, pricing momentum."
    )
    ideal_submission_window: Optional[str] = Field(
        default=None, description="Optimal offer submission timing (e.g., mid-week before weekend showings)."
    )
    urgency_window_days: Optional[int] = Field(
        default=None, description="Days before/after a key date when leverage is maximized."
    )


# ---------- Root Strategy ----------

class NegotiationStrategy(BaseModel):
    seller_intel: SellerIntel
    market_data: MarketData
    personal_priorities: PersonalPriorities
    offer_structure: OfferStructure
    initial_offer_approach: InitialOfferApproach
    negotiation_tactics: NegotiationTactics
    counteroffer_plan: CounterofferPlan
    market_timing: MarketTiming = MarketTiming()
    price_mechanics: PriceMechanics = PriceMechanics()
    inspection_plan: InspectionPlan = InspectionPlan()
    timeline_flex: TimelineFlex = TimelineFlex()
    proof_and_lender: ProofAndLender = ProofAndLender()
    offer_packaging: OfferPackaging = OfferPackaging()
    
    @classmethod
    def from_user_preferences(
        cls,
        user_preferences: Dict[str, Any],
        seller_intel: SellerIntel,
        market_data: MarketData,
        initial_offer_approach: InitialOfferApproach,
        counteroffer_plan: CounterofferPlan,
        **overrides
    ) -> "NegotiationStrategy":
        """Create a personalized NegotiationStrategy from user preferences"""
        
        # Create personalized components
        personal_priorities = PersonalPriorities.from_user_preferences(user_preferences)
        offer_structure = OfferStructure.from_user_preferences(personal_priorities, user_preferences)
        negotiation_tactics = NegotiationTactics.from_user_preferences(user_preferences)
        
        # Customize price mechanics based on user financial profile
        price_mechanics = PriceMechanics()
        down_payment = user_preferences.get('down_payment', 0)
        home_budget = user_preferences.get('home_budget', 500000)
        if down_payment > home_budget * 0.2:
            # User has substantial down payment, can cover appraisal gaps
            price_mechanics.appraisal_gap_cover = Decimal(str(min(25000, down_payment * 0.1)))
        
        # Customize inspection plan based on user renovation tolerance
        inspection_plan = InspectionPlan()
        renovation_pref = user_preferences.get('renovation_preference', 'minor')
        if renovation_pref == 'none':
            inspection_plan.allowed_tests = ["general", "sewer", "roof", "HVAC", "electrical", "plumbing"]
            inspection_plan.single_item_credit_threshold = Decimal('1000')
        elif renovation_pref in ['major', 'complete']:
            inspection_plan.allowed_tests = ["general", "sewer"]
            inspection_plan.single_item_credit_threshold = Decimal('10000')
        
        # Customize timeline flexibility based on user constraints
        timeline_flex = TimelineFlex()
        if user_preferences.get('has_buyers_agent') == 'yes':
            timeline_flex.seller_pull_forward_days = 7
            timeline_flex.seller_notice_days = 3
        
        # Customize proof and lender based on user financial status
        proof_and_lender = ProofAndLender()
        if user_preferences.get('credit_score_range') in ['740_799', '800_plus']:
            proof_and_lender.fully_underwritten = True
        
        # Apply any overrides and create strategy
        data = {
            'seller_intel': seller_intel,
            'market_data': market_data,
            'personal_priorities': personal_priorities,
            'offer_structure': offer_structure,
            'initial_offer_approach': initial_offer_approach,
            'negotiation_tactics': negotiation_tactics,
            'counteroffer_plan': counteroffer_plan,
            'price_mechanics': price_mechanics,
            'inspection_plan': inspection_plan,
            'timeline_flex': timeline_flex,
            'proof_and_lender': proof_and_lender,
            **overrides
        }
        
        return cls(**data)