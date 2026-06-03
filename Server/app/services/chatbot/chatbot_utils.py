import os

import httpx
from openai import OpenAI

from app.config.llm_models import (
    openai_chat_token_limit_params,
    openai_model_action_plan,
    openai_model_chat,
    openai_model_summarize,
)
from app.services.aggregation import get_preferences_dict_optional
from logger import log

from .chatbot_retry import make_openai_request_with_retry


def get_preferences(user_id):
    """Get user preferences for the given user_id (aggregated from new models)."""
    try:
        prefs = get_preferences_dict_optional(str(user_id))
        if prefs:
            return prefs
        log.warn("MESSAGES", f"[CHATBOT] No preferences found for user {user_id}, using defaults")
        return {}
    except Exception as e:
        log.error("ERRORS", f"[CHATBOT] Error fetching user preferences for {user_id}: {str(e)}")
        return {}


def get_chat_response(report_data, user_profile, user_message, address):
    """Generate AI chat response using OpenAI API"""
    SYSTEM_PROMPT = f"You are SilverKey, a helpful real estate AI assistant.\nThe user is asking about the property at {address}.\n\nYou have access to comprehensive property and neighborhood data. Answer questions using the provided report data.\nBe conversational, helpful, and specific. If unsure, say so honestly.\n\n=== PROPERTY INFORMATION ===\nProperty Address: {address}\n\n=== USER PREFERENCES (COMPLETE) ===\n{(user_profile if user_profile else 'No user preferences available')}\n\n=== COMPLETE PROPERTY REPORT DATA ===\n{(report_data if report_data else 'No report data available')}\n\n=== INSTRUCTIONS ===\nUse the complete user preferences and property report data above to provide personalized, accurate responses.\nReference specific data points from the report when answering questions.\nConsider the user's preferences when making recommendations or highlighting relevant information.\n\nNow respond helpfully to the user's question.\n"
    try:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            log.error("ERRORS", "[CHATBOT] OPENAI_KEY is not set in environment variables.")
            return ("AI service unavailable. Please try again later.", None)
        client = OpenAI(api_key=api_key, http_client=httpx.Client())
        chat_model = openai_model_chat()

        def make_request():
            return client.chat.completions.create(
                model=chat_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                **openai_chat_token_limit_params(chat_model, 1000),
            )

        response = make_openai_request_with_retry(client, make_request)
        if not response or not response.choices:
            return ("I'm sorry, I didn't get a valid response. Please try again.", None)
        reply = response.choices[0].message.content
        return (reply, None)
    except Exception as e:
        log.error("ERRORS", f"[CHATBOT] Error generating chat response: {str(e)}")
        log.error("ERRORS", "[CHATBOT] Traceback:")
        return (
            "I'm sorry, I'm having trouble processing your request right now. Please try again.",
            None,
        )


def summarize_user_message(user_message):
    """Summarize user message in 3 words or less using OpenAI"""
    try:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            log.error("ERRORS", "[CHATBOT] OPENAI_KEY is not set for summarization.")
            return "chat message"
        client = OpenAI(api_key=api_key, http_client=httpx.Client())
        summarize_model = openai_model_summarize()
        SUMMARY_PROMPT = 'Summarize the following user message in exactly 3 words or less.\nFocus on the main topic or intent. Use simple, clear words.\nExamples:\n- "What\'s the crime rate in this neighborhood?" → "crime rate question"\n- "Tell me about schools nearby" → "schools inquiry"\n- "How much is this house worth?" → "property value"\n- "Is this a good investment?" → "investment advice"\n\nMessage to summarize:'

        def make_request():
            return client.chat.completions.create(
                model=summarize_model,
                messages=[
                    {"role": "system", "content": SUMMARY_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.3,
                **openai_chat_token_limit_params(summarize_model, 10),
            )

        response = make_openai_request_with_retry(client, make_request)
        if not response or not response.choices:
            return "chat message"
        summary = (response.choices[0].message.content or "").strip()
        words = summary.split()
        if len(words) > 3:
            summary = " ".join(words[:3])
        return summary
    except Exception as e:
        log.error("ERRORS", f"[CHATBOT] Error summarizing user message: {str(e)}")
        log.error("ERRORS", "[CHATBOT] Summarization traceback:")
        return "chat message"


def generate_action_plan(user_preferences, client_name):
    """Generate a personalized action plan using OpenAI based on user preferences"""
    try:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            log.error("ERRORS", "[ACTION_PLAN] OPENAI_KEY is not set in environment variables.")
            return "AI service unavailable. Please try again later."
        client = OpenAI(api_key=api_key, http_client=httpx.Client())
        action_plan_model = openai_model_action_plan()
        context_parts = []
        if user_preferences:
            if user_preferences.get("age"):
                context_parts.append(f"Age: {user_preferences['age']}")
            if user_preferences.get("gender"):
                context_parts.append(f"Gender: {user_preferences['gender']}")
            if user_preferences.get("occupation"):
                context_parts.append(f"Occupation: {user_preferences['occupation']}")
            if user_preferences.get("pets"):
                context_parts.append(f"Pets: {user_preferences['pets']}")
            if user_preferences.get("gross_income"):
                context_parts.append(f"Gross income: ${user_preferences['gross_income']:,.0f}")
            budget_min = user_preferences.get("home_budget_min")
            budget_max = user_preferences.get("home_budget_max")
            if budget_min and budget_max:
                context_parts.append(f"Home budget: ${budget_min:,.0f} - ${budget_max:,.0f}")
            elif budget_max:
                context_parts.append(f"Home budget: Up to ${budget_max:,.0f}")
            if user_preferences.get("credit_score_range"):
                context_parts.append(
                    f"Credit score range: {user_preferences['credit_score_range']}"
                )
            if user_preferences.get("down_payment"):
                context_parts.append(f"Down payment: ${user_preferences['down_payment']:,.0f}")
            if user_preferences.get("ideal_zip_code"):
                context_parts.append(f"Ideal zip code: {user_preferences['ideal_zip_code']}")
            if user_preferences.get("housing_type"):
                context_parts.append(f"Preferred housing type: {user_preferences['housing_type']}")
            if (
                user_preferences.get("preferred_bedrooms_min") is not None
                or user_preferences.get("preferred_bedrooms_max") is not None
            ):
                lo = user_preferences.get("preferred_bedrooms_min", "")
                hi = user_preferences.get("preferred_bedrooms_max", "")
                context_parts.append(f"Bedrooms range: {lo}–{hi}")
            if (
                user_preferences.get("preferred_bathrooms_min") is not None
                or user_preferences.get("preferred_bathrooms_max") is not None
            ):
                lo = user_preferences.get("preferred_bathrooms_min", "")
                hi = user_preferences.get("preferred_bathrooms_max", "")
                context_parts.append(f"Bathrooms range: {lo}–{hi}")
            if (
                user_preferences.get("preferred_lot_size_min") is not None
                or user_preferences.get("preferred_lot_size_max") is not None
            ):
                lo = user_preferences.get("preferred_lot_size_min", "")
                hi = user_preferences.get("preferred_lot_size_max", "")
                context_parts.append(f"Lot size range: {lo}–{hi} acres")
            elif user_preferences.get("preferred_lot_size"):
                context_parts.append(
                    f"Lot size preference: {user_preferences['preferred_lot_size']}"
                )
            if (
                user_preferences.get("preferred_home_age_min") is not None
                or user_preferences.get("preferred_home_age_max") is not None
            ):
                lo = user_preferences.get("preferred_home_age_min", "")
                hi = user_preferences.get("preferred_home_age_max", "")
                context_parts.append(f"Home age range: {lo}–{hi} years")
            elif user_preferences.get("preferred_home_age"):
                context_parts.append(
                    f"Home age preference: {user_preferences['preferred_home_age']}"
                )
            if (
                user_preferences.get("must_have")
                and isinstance(user_preferences["must_have"], list)
                and user_preferences["must_have"]
            ):
                context_parts.append(
                    f"Must-have features: {', '.join(user_preferences['must_have'])}"
                )
            if (
                user_preferences.get("preferred_sqft_min") is not None
                or user_preferences.get("preferred_sqft_max") is not None
            ):
                lo = user_preferences.get("preferred_sqft_min", "")
                hi = user_preferences.get("preferred_sqft_max", "")
                context_parts.append(f"Square feet range: {lo}–{hi} sq ft")
            if (
                user_preferences.get("listing_type")
                and isinstance(user_preferences["listing_type"], list)
                and user_preferences["listing_type"]
            ):
                context_parts.append(
                    f"Listing types: {', '.join(user_preferences['listing_type'])}"
                )
            if (
                user_preferences.get("days_on_market_min") is not None
                or user_preferences.get("days_on_market_max") is not None
            ):
                lo = user_preferences.get("days_on_market_min", "")
                hi = user_preferences.get("days_on_market_max", "")
                context_parts.append(f"Days on market range: {lo}–{hi} days")
            if user_preferences.get("preferred_architectural_style"):
                context_parts.append(
                    f"Architectural style: {user_preferences['preferred_architectural_style']}"
                )
            if user_preferences.get("renovation_preference"):
                context_parts.append(
                    f"Renovation preference: {user_preferences['renovation_preference']}"
                )
            if user_preferences.get("intended_property_use"):
                context_parts.append(f"Property use: {user_preferences['intended_property_use']}")
            if user_preferences.get("preferred_home_features"):
                features = user_preferences["preferred_home_features"]
                if isinstance(features, list) and features:
                    context_parts.append(f"Desired features: {', '.join(features)}")
            if user_preferences.get("deal_breakers"):
                breakers = user_preferences["deal_breakers"]
                if isinstance(breakers, list) and breakers:
                    context_parts.append(f"Deal breakers: {', '.join(breakers[:3])}")
            if user_preferences.get("important_locations"):
                locations = user_preferences["important_locations"]
                if isinstance(locations, list) and locations:
                    location_names = []
                    for loc in locations:
                        if isinstance(loc, dict):
                            name = loc.get("name") or loc.get("address", "Unknown Location")
                            commute = loc.get("commute_tolerance")
                            if commute:
                                location_names.append(f"{name} ({commute}min commute)")
                            else:
                                location_names.append(name)
                        else:
                            location_names.append(str(loc))
                    context_parts.append(f"Important locations: {', '.join(location_names[:3])}")
            if user_preferences.get("walkability_importance"):
                context_parts.append(
                    f"Walkability importance: {user_preferences['walkability_importance']}"
                )
            if user_preferences.get("communication_frequency"):
                context_parts.append(
                    f"Communication frequency: {user_preferences['communication_frequency']}"
                )
            if user_preferences.get("information_detail_level"):
                context_parts.append(
                    f"Information detail level: {user_preferences['information_detail_level']}"
                )
            if user_preferences.get("has_buyers_agent"):
                context_parts.append(f"Has buyer's agent: {user_preferences['has_buyers_agent']}")
            if user_preferences.get("looking_for_buyers_agent"):
                context_parts.append(
                    f"Looking for agent: {user_preferences['looking_for_buyers_agent']}"
                )
        user_context = (
            "; ".join(context_parts) if context_parts else "No specific preferences provided"
        )
        ACTION_PLAN_PROMPT = f"You are an elite real estate agent preparing a full intelligence brief for your client {client_name}. Use the profile below to guide every recommendation.\n\nClient Profile:\n{user_context}\n\nCreate a comprehensive plan with the following structure:\n\n**SALES TIPS FOR AGENT**\n- What to emphasize during showings (features, lifestyle cues, framing)\n- What to avoid bringing up or what might turn them off\n- How to emotionally connect listings to their values\n- Ideal pacing and communication style for this client\n\n**IDEAL HOME DESCRIPTION**\n- Based on their preferences, describe the perfect home they would be most likely to buy\n- Be specific: style, space, feel, location, vibe, etc.\n\n**PROPERTY SEARCH STRATEGY**\n- Describe how to filter and prioritize listings\n- Include example cities or neighborhoods that align with their lifestyle\n- Mention red flags to avoid or things that might turn them off\n\n**FINANCIAL PREPARATION**\n- Give budget-aware advice\n- Suggest pre-approval language or tools\n- Include anything specific to their employment or income profile\n\nKeep tone friendly, expert, and strategic. Response should be specific and agent-usable. 450–550 words max."

        def make_request():
            return client.chat.completions.create(
                model=action_plan_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a seasoned real estate strategist writing a customized buyer action plan and sales cheat sheet for a professional agent. Prioritize specificity, actionable guidance, and strategic insight.",
                    },
                    {"role": "user", "content": ACTION_PLAN_PROMPT},
                ],
                temperature=0.7,
                **openai_chat_token_limit_params(action_plan_model, 900),
            )

        response = make_openai_request_with_retry(client, make_request)
        if not response or not response.choices:
            return "Unable to generate action plan at this time. Please try again later."
        action_plan = (response.choices[0].message.content or "").strip()
        return action_plan
    except Exception as e:
        log.error("ERRORS", f"[ACTION_PLAN] Error generating action plan: {str(e)}")
        return "Unable to generate action plan at this time. Please try again later."
