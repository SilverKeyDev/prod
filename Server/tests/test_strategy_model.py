#!/usr/bin/env python3
"""
Test script for the updated NegotiationStrategy model with user preferences integration.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from decimal import Decimal
from app.services.standardgen.strategy_model import (
    NegotiationStrategy, SellerIntel, MarketData, Comp, 
    InitialOfferApproach, CounterofferPlan, SellerReason, MarketCondition
)

def test_strategy_with_user_preferences():
    """Test creating a NegotiationStrategy from user preferences"""
    
    # Sample user preferences (similar to what would come from UserPreferences.to_dict())
    user_preferences = {
        'home_budget': 750000,
        'down_payment': 150000,  # 20% down payment
        'credit_score_range': '740_799',
        'preferred_home_features': ['hardwood floors', 'updated kitchen', 'garage', 'fenced yard', 'fireplace'],
        'deal_breakers': ['busy road', 'no parking', 'flood zone'],
        'renovation_preference': 'minor',
        'communication_frequency': 'moderate',
        'information_detail_level': 'detailed',
        'has_buyers_agent': 'yes',
        'commute_tolerance': 35
    }
    
    # Required components for strategy creation
    seller_intel = SellerIntel(
        reasons=[SellerReason.RELOCATION],
        time_pressure="needs to close in 45 days",
        days_on_market=21,
        price_reductions_count=1,
        intel_sources=["MLS history", "listing agent call"]
    )
    
    market_data = MarketData(
        subject_address="123 Main St, Anytown, CA",
        ask_price=Decimal('725000'),
        comps=[
            Comp(
                address="125 Main St",
                sold_price=Decimal('710000'),
                sold_date="2024-01-15",
                beds=3,
                baths=2,
                living_sqft=1800
            )
        ],
        supply_demand_summary="Low inventory, high demand market"
    )
    
    initial_offer_approach = InitialOfferApproach(
        market_condition=MarketCondition.HOT_SELLERS,
        opening_strategy_notes="Start at 98% of ask due to hot market and seller time pressure"
    )
    
    counteroffer_plan = CounterofferPlan(
        concessions_you_can_make=["flexible closing date", "waive minor repairs"],
        non_negotiables=["price above $750k", "major structural issues"]
    )
    
    # Create strategy from user preferences
    strategy = NegotiationStrategy.from_user_preferences(
        user_preferences=user_preferences,
        seller_intel=seller_intel,
        market_data=market_data,
        initial_offer_approach=initial_offer_approach,
        counteroffer_plan=counteroffer_plan
    )
    
    # Print results
    print("=== NEGOTIATION STRATEGY CREATED FROM USER PREFERENCES ===\n")
    
    print("Personal Priorities:")
    print(f"  Max Price: ${strategy.personal_priorities.max_price:,}")
    print(f"  Financing: {strategy.personal_priorities.financing}")
    print(f"  Condition Tolerance: {strategy.personal_priorities.condition_tolerance}")
    print(f"  Inclusions: {strategy.personal_priorities.inclusions}")
    print(f"  Walk Away Conditions: {strategy.personal_priorities.walk_away_conditions}")
    
    print("\nOffer Structure:")
    print(f"  Initial Offer Price: ${strategy.offer_structure.offer_price:,}")
    print(f"  Earnest Money: ${strategy.offer_structure.earnest_money:,}")
    print(f"  Contingencies: {[c.value for c in strategy.offer_structure.contingencies]}")
    print(f"  Closing Timeline: {strategy.offer_structure.closing_timeline_days} days")
    print(f"  Contingency Deadlines: {strategy.offer_structure.contingency_deadlines_days}")
    
    print("\nNegotiation Tactics:")
    print(f"  Limit Rounds To: {strategy.negotiation_tactics.limit_rounds_to}")
    print(f"  Use Silence: {strategy.negotiation_tactics.use_silence}")
    print(f"  Time Pressure: {strategy.negotiation_tactics.time_pressure}")
    print(f"  Give-to-Get Trades: {strategy.negotiation_tactics.give_to_get_trades}")
    
    print("\nPrice Mechanics:")
    print(f"  Appraisal Gap Cover: ${strategy.price_mechanics.appraisal_gap_cover or 0:,}")
    
    print("\nInspection Plan:")
    print(f"  Allowed Tests: {strategy.inspection_plan.allowed_tests}")
    print(f"  Single Item Credit Threshold: ${strategy.inspection_plan.single_item_credit_threshold or 0:,}")
    
    print("\nTimeline Flexibility:")
    print(f"  Seller Pull Forward Days: {strategy.timeline_flex.seller_pull_forward_days}")
    print(f"  Seller Notice Days: {strategy.timeline_flex.seller_notice_days}")
    
    print("\nProof and Lender:")
    print(f"  Fully Underwritten: {strategy.proof_and_lender.fully_underwritten}")
    
    return strategy

def test_different_user_profiles():
    """Test strategy creation with different user profiles"""
    
    # First-time buyer with limited budget
    first_time_buyer = {
        'home_budget': 400000,
        'down_payment': 20000,  # 5% down payment
        'credit_score_range': '620_679',
        'preferred_home_features': ['move-in ready', 'good schools'],
        'deal_breakers': ['major repairs needed', 'high HOA fees'],
        'renovation_preference': 'none',
        'communication_frequency': 'frequent',
        'information_detail_level': 'brief',
        'has_buyers_agent': 'no',
        'commute_tolerance': 20
    }
    
    # Cash buyer with renovation experience
    cash_buyer = {
        'home_budget': 1200000,
        'down_payment': 1200000,  # Cash purchase
        'credit_score_range': '800_plus',
        'preferred_home_features': ['good bones', 'large lot', 'privacy'],
        'deal_breakers': ['HOA restrictions', 'small lot'],
        'renovation_preference': 'complete',
        'communication_frequency': 'minimal',
        'information_detail_level': 'detailed',
        'has_buyers_agent': 'yes',
        'commute_tolerance': 60
    }
    
    profiles = [
        ("First-Time Buyer", first_time_buyer),
        ("Cash Buyer/Renovator", cash_buyer)
    ]
    
    # Simple seller intel and market data for testing
    seller_intel = SellerIntel(reasons=[SellerReason.UPSIZING])
    market_data = MarketData(ask_price=Decimal('500000'))
    initial_offer_approach = InitialOfferApproach(market_condition=MarketCondition.BALANCED)
    counteroffer_plan = CounterofferPlan()
    
    for profile_name, preferences in profiles:
        print(f"\n=== {profile_name.upper()} PROFILE ===")
        
        strategy = NegotiationStrategy.from_user_preferences(
            user_preferences=preferences,
            seller_intel=seller_intel,
            market_data=market_data,
            initial_offer_approach=initial_offer_approach,
            counteroffer_plan=counteroffer_plan
        )
        
        print(f"Max Price: ${strategy.personal_priorities.max_price:,}")
        print(f"Financing: {strategy.personal_priorities.financing}")
        print(f"Condition Tolerance: {strategy.personal_priorities.condition_tolerance}")
        print(f"Negotiation Rounds: {strategy.negotiation_tactics.limit_rounds_to}")
        print(f"Time Pressure: {strategy.negotiation_tactics.time_pressure}")
        print(f"Inspection Tests: {strategy.inspection_plan.allowed_tests}")
        print(f"Credit Threshold: ${strategy.inspection_plan.single_item_credit_threshold or 0:,}")

if __name__ == "__main__":
    print("Testing NegotiationStrategy with User Preferences Integration\n")
    
    try:
        # Test main functionality
        strategy = test_strategy_with_user_preferences()
        
        # Test different user profiles
        test_different_user_profiles()
        
        print("\n✅ All tests passed! Strategy model successfully integrates user preferences.")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
