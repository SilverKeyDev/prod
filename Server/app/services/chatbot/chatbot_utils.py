import os
import logging
from openai import OpenAI
from app.models.user_preferences import UserPreferences
import httpx


# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def get_preferences(user_id):
    """Get user preferences for the given user_id"""
    logger.info(f"[CHATBOT] Fetching user preferences for user_id: {user_id}")
    try:
        prefs = UserPreferences.query.filter_by(user_id=user_id).first()
        if prefs:
            logger.info(f"[CHATBOT] Successfully retrieved preferences for user {user_id}")
            prefs_dict = prefs.to_dict()
            logger.debug(f"[CHATBOT] User preferences keys: {list(prefs_dict.keys())}")
            return prefs_dict
        else:
            logger.warning(f"[CHATBOT] No preferences found for user {user_id}, using defaults")
            return {}
    except Exception as e:
        logger.error(f"[CHATBOT] Error fetching user preferences for {user_id}: {str(e)}")
        return {}

def get_chat_response(report_data, user_profile, user_message, address):
    """Generate AI chat response using OpenAI API"""
    logger.info(f"[CHATBOT] Generating chat response for address: {address}")
    logger.info(f"[CHATBOT] User message length: {len(user_message)} characters")
    logger.debug(f"[CHATBOT] User message preview: {user_message[:100]}")

    if isinstance(report_data, dict):
        logger.info(f"[CHATBOT] Report data available with {len(report_data)} keys")
        logger.debug(f"[CHATBOT] Report data keys: {list(report_data.keys())}")
    else:
        logger.warning(f"[CHATBOT] Report data is missing or malformed")

    if user_profile:
        logger.info(f"[CHATBOT] User profile has {len(user_profile)} preferences")
    else:
        logger.info(f"[CHATBOT] No user profile available")

    # Construct system prompt with complete context
    SYSTEM_PROMPT = f"""You are SilverKey, a helpful real estate AI assistant.
The user is asking about the property at {address}.

You have access to comprehensive property and neighborhood data. Answer questions using the provided report data.
Be conversational, helpful, and specific. If unsure, say so honestly.

=== PROPERTY INFORMATION ===
Property Address: {address}

=== USER PREFERENCES (COMPLETE) ===
{user_profile if user_profile else 'No user preferences available'}

=== COMPLETE PROPERTY REPORT DATA ===
{report_data if report_data else 'No report data available'}

=== INSTRUCTIONS ===
Use the complete user preferences and property report data above to provide personalized, accurate responses.
Reference specific data points from the report when answering questions.
Consider the user's preferences when making recommendations or highlighting relevant information.

Now respond helpfully to the user's question.
"""
    logger.debug(f"[CHATBOT] System prompt length: {len(SYSTEM_PROMPT)}")

    try:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            logger.error("[CHATBOT] OPENAI_KEY is not set in environment variables.")
            return "AI service unavailable. Please try again later.", None

        client = OpenAI(api_key=api_key,
        http_client=httpx.Client()
        )

        logger.info(f"[CHATBOT] Sending message to GPT-4o")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        reply = response.choices[0].message.content
        logger.info(f"[CHATBOT] Response generated ({len(reply)} chars)")
        logger.debug(f"[CHATBOT] Preview: {reply[:100]}")

        try:
            usage = response.usage
            if usage:
                logger.info(f"[CHATBOT] Token usage: Prompt={usage.prompt_tokens}, Completion={usage.completion_tokens}, Total={usage.total_tokens}")
        except Exception as usage_error:
            logger.warning(f"[CHATBOT] Token usage not available: {usage_error}")

        return reply, None

    except Exception as e:
        logger.error(f"[CHATBOT] Error generating chat response: {str(e)}")
        logger.error("[CHATBOT] Traceback:", exc_info=True)
        return "I'm sorry, I'm having trouble processing your request right now. Please try again.", None


def summarize_user_message(user_message):
    """Summarize user message in 3 words or less using OpenAI"""
    logger.info(f"[CHATBOT] Summarizing user message: {len(user_message)} characters")
    logger.debug(f"[CHATBOT] Message to summarize: {user_message[:100]}")
    
    try:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            logger.error("[CHATBOT] OPENAI_KEY is not set for summarization.")
            return "chat message"  # Fallback summary
        
        client = OpenAI(api_key=api_key, http_client=httpx.Client())
        
        SUMMARY_PROMPT = """Summarize the following user message in exactly 3 words or less. 
Focus on the main topic or intent. Use simple, clear words.
Examples:
- "What's the crime rate in this neighborhood?" → "crime rate question"
- "Tell me about schools nearby" → "schools inquiry"
- "How much is this house worth?" → "property value"
- "Is this a good investment?" → "investment advice"

Message to summarize:"""
        
        logger.info(f"[CHATBOT] Sending summarization request to GPT-4o")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SUMMARY_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,  # Lower temperature for more consistent summaries
            max_tokens=10     # Very short response needed
        )
        
        summary = response.choices[0].message.content.strip()
        logger.info(f"[CHATBOT] Generated summary: '{summary}'")
        
        # Ensure summary is 3 words or less
        words = summary.split()
        if len(words) > 3:
            summary = " ".join(words[:3])
            logger.info(f"[CHATBOT] Truncated summary to 3 words: '{summary}'")
        
        try:
            usage = response.usage
            if usage:
                logger.info(f"[CHATBOT] Summarization token usage: Prompt={usage.prompt_tokens}, Completion={usage.completion_tokens}, Total={usage.total_tokens}")
        except Exception as usage_error:
            logger.warning(f"[CHATBOT] Summarization token usage not available: {usage_error}")
        
        return summary
        
    except Exception as e:
        logger.error(f"[CHATBOT] Error summarizing user message: {str(e)}")
        logger.error("[CHATBOT] Summarization traceback:", exc_info=True)
        return "chat message"  # Fallback summary


def generate_action_plan(user_preferences, client_name):
    """Generate a personalized action plan using OpenAI based on user preferences"""
    logger.info(f"[ACTION_PLAN] Generating action plan for client: {client_name}")
    
    try:
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            logger.error("[ACTION_PLAN] OPENAI_KEY is not set in environment variables.")
            return "AI service unavailable. Please try again later."
        
        client = OpenAI(api_key=api_key, http_client=httpx.Client())

        # Build context from user preferences
        context_parts = []

        if user_preferences:
            # Personal Information
            personal = getattr(user_preferences, 'personal_information', {})
            if personal:
                if personal.get('age_range'):
                    context_parts.append(f"Age range: {personal['age_range'].replace('_', '-')}")
                if personal.get('marital_status'):
                    context_parts.append(f"Marital status: {personal['marital_status'].replace('_', ' ')}")
                if personal.get('children_count') is not None:
                    context_parts.append(f"Number of children: {personal['children_count']}")

            # Financial Profile
            financial = getattr(user_preferences, 'financial_profile', {})
            if financial:
                if financial.get('income_range'):
                    context_parts.append(f"Income range: ${financial['income_range'].replace('_', '-')}")
                if financial.get('preferred_home_price_range'):
                    context_parts.append(f"Budget: ${financial['preferred_home_price_range'].replace('_', '-')}")
                if financial.get('employment_status'):
                    context_parts.append(f"Employment: {financial['employment_status'].replace('_', ' ')}")

            # Housing Preferences
            housing = getattr(user_preferences, 'housing_preferences', {})
            if housing:
                if housing.get('preferred_home_type'):
                    context_parts.append(f"Preferred home type: {housing['preferred_home_type'].replace('_', ' ')}")
                if housing.get('preferred_bedrooms'):
                    context_parts.append(f"Bedrooms needed: {housing['preferred_bedrooms']}")
                if housing.get('preferred_bathrooms'):
                    context_parts.append(f"Bathrooms needed: {housing['preferred_bathrooms']}")
                features = housing.get('preferred_home_features', [])
                if isinstance(features, list) and features:
                    context_parts.append(f"Desired features: {', '.join(features)}")

            # Location Preferences
            location = getattr(user_preferences, 'location_preferences', {})
            if location:
                regions = location.get('preferred_regions', [])
                if regions:
                    context_parts.append(f"Preferred regions: {', '.join(regions)}")
                if location.get('urban_rural_preference'):
                    context_parts.append(f"Setting preference: {location['urban_rural_preference']}")
                if location.get('commute_tolerance'):
                    context_parts.append(f"Commute tolerance: {location['commute_tolerance'].replace('_', ' ')}")

            # Lifestyle
            lifestyle = getattr(user_preferences, 'lifestyle', {})
            if lifestyle:
                if lifestyle.get('lifestyle_type'):
                    context_parts.append(f"Lifestyle: {lifestyle['lifestyle_type'].replace('_', ' ')}")
                hobbies = lifestyle.get('hobbies_interests', [])
                if hobbies:
                    context_parts.append(f"Interests: {', '.join(hobbies[:3])}")

            # Real Estate Experience
            experience = getattr(user_preferences, 'real_estate_experience', {})
            if experience:
                if experience.get('first_time_buyer') is not None:
                    status = "first-time buyer" if experience['first_time_buyer'] else "experienced buyer"
                    context_parts.append(f"Buyer status: {status}")
                breakers = experience.get('deal_breakers', [])
                if breakers:
                    context_parts.append(f"Deal breakers: {', '.join(breakers[:2])}")
        
        user_context = "; ".join(context_parts) if context_parts else "No specific preferences provided"

        ACTION_PLAN_PROMPT = f"""You are an elite real estate agent preparing a full intelligence brief for your client {client_name}. Use the profile below to guide every recommendation.

Client Profile:
{user_context}

Create a comprehensive plan with the following structure:

**SALES TIPS FOR AGENT**
- What to emphasize during showings (features, lifestyle cues, framing)
- What to avoid bringing up or what might turn them off
- How to emotionally connect listings to their values
- Ideal pacing and communication style for this client

**IDEAL HOME DESCRIPTION**
- Based on their preferences, describe the perfect home they would be most likely to buy
- Be specific: style, space, feel, location, vibe, etc.

**PROPERTY SEARCH STRATEGY**
- Describe how to filter and prioritize listings
- Include example cities or neighborhoods that align with their lifestyle
- Mention red flags to avoid or things that might turn them off

**FINANCIAL PREPARATION**
- Give budget-aware advice
- Suggest pre-approval language or tools
- Include anything specific to their employment or income profile

Keep tone friendly, expert, and strategic. Response should be specific and agent-usable. 450–550 words max."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a seasoned real estate strategist writing a customized buyer action plan and sales cheat sheet "
                        "for a professional agent. Prioritize specificity, actionable guidance, and strategic insight."
                    )
                },
                {"role": "user", "content": ACTION_PLAN_PROMPT}
            ],
            max_tokens=900,
            temperature=0.7
        )

        action_plan = response.choices[0].message.content.strip()
        logger.info(f"[ACTION_PLAN] Successfully generated action plan for {client_name}")
        return action_plan

    except Exception as e:
        logger.error(f"[ACTION_PLAN] Error generating action plan: {str(e)}")
        return "Unable to generate action plan at this time. Please try again later."
