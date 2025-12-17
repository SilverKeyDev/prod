"""
Email content formatting module.

Formats email content with hardcoded elements (title, subject, etc.) and provides
infrastructure for future LLM-based personalization.

Now supports HTML rendering via React Email components.
"""

from typing import List, Tuple, Optional, Dict, Any
import logging
import os

from app.models.home_universal import HomeUniversal

logger = logging.getLogger(__name__)

# Import HTML renderer
try:
    from app.services.email.render_email_html import (
        render_email_html,
        convert_home_universal_to_listing_dict,
    )
    HTML_RENDERING_AVAILABLE = True
except ImportError:
    HTML_RENDERING_AVAILABLE = False
    logger.warning(
        "HTML email rendering not available. Falling back to plain text."
    )


# Hardcoded email configuration
EMAIL_CONFIG = {
    "sender_name": "SilverKey",
    "subject_template": "Your Updated Home Listings",
    "title": "New Properties Matching Your Preferences",
    "greeting": "Hello!",
    "intro_text": "We've found some great properties that match your preferences:",
    "closing_text": "Thank you for using SilverKey!",
    "footer_text": "You're receiving this email because you have active home search preferences.",
}


class EmailFormatter:
    """
    Formats email content for listings emails.
    
    Provides infrastructure for LLM-based personalization (not yet implemented).
    """

    def __init__(self, use_llm: bool = False):
        """
        Initialize the email formatter.
        
        Args:
            use_llm: If True, enable LLM-based personalization (not yet implemented).
                    Currently ignored, but sets up infrastructure for future use.
        """
        self.use_llm = use_llm
        self._llm_client = None
        
        if self.use_llm:
            # Initialize LLM client for future use (not implemented yet)
            self._init_llm_client()

    def _init_llm_client(self):
        """
        Initialize LLM client for future personalization.
        Currently not implemented - placeholder for future functionality.
        """
        try:
            # Future: Import and initialize LLM client
            # from app.home_matching.llm_scorer.llm_client import LLMClient
            # self._llm_client = LLMClient()
            logger.info("[EMAIL_FORMATTER] LLM client initialization deferred (not yet implemented)")
            pass
        except Exception as e:
            logger.warning(f"[EMAIL_FORMATTER] Could not initialize LLM client: {e}")
            self.use_llm = False

    def format_listings_text(
        self, 
        listings: List[HomeUniversal], 
        max_items: int = 10,
        user_id: Optional[str] = None
    ) -> str:
        """
        Format a list of homes into plaintext email body content.
        
        Args:
            listings: List of HomeUniversal objects to format
            max_items: Maximum number of listings to include
            user_id: Optional user ID for future LLM personalization
            
        Returns:
            Formatted plaintext string
        """
        if not listings:
            return ""

        lines: List[str] = []
        
        # Add title/intro
        lines.append(EMAIL_CONFIG["title"])
        lines.append("")
        lines.append(EMAIL_CONFIG["greeting"])
        lines.append("")
        lines.append(EMAIL_CONFIG["intro_text"])
        lines.append("")
        
        # Format each listing
        for i, home in enumerate(listings[:max_items], start=1):
            lines.append(f"--- Property {i} ---")
            
            # Format property details
            parts = []
            if home.address:
                parts.append(f"Address: {home.address}")
            if home.price:
                parts.append(f"Price: ${self._format_price(home.price)}")
            if home.beds:
                parts.append(f"Beds: {home.beds}")
            if home.baths:
                parts.append(f"Baths: {home.baths}")
            if home.sqft:
                parts.append(f"Sqft: {home.sqft}")
            if home.score is not None:
                parts.append(f"Match Score: {home.score:.2f}")
            
            lines.append(" | ".join(parts))
            
            lines.append("")

        # Add closing
        lines.append(EMAIL_CONFIG["closing_text"])
        lines.append("")
        lines.append(EMAIL_CONFIG["footer_text"])

        return "\n".join(lines)

    def _format_price(self, price: str) -> str:
        """
        Format price string for display.
        
        Args:
            price: Price string (may contain commas or be numeric)
            
        Returns:
            Formatted price string
        """
        try:
            # Remove commas and convert to int for formatting
            price_clean = price.replace(",", "").replace("$", "").strip()
            price_num = int(float(price_clean))
            # Format with commas
            return f"{price_num:,}"
        except (ValueError, AttributeError):
            return str(price)

    def format_email_message(
        self,
        recipient_email: str,
        listings: List[HomeUniversal],
        user_id: Optional[str] = None,
        max_items: int = 10,
        custom_subject: Optional[str] = None,
        use_html: bool = True,
    ) -> Tuple[str, str, str, Optional[str]]:
        """
        Format a complete email message.
        
        Args:
            recipient_email: Email address of recipient
            listings: List of HomeUniversal objects to include
            user_id: Optional user ID for future personalization
            max_items: Maximum number of listings to include
            custom_subject: Optional custom subject line (overrides default)
            use_html: If True, render HTML email using React Email (default: True)
            
        Returns:
            Tuple of (recipient_email, subject, body_text, html_body)
            html_body will be None if HTML rendering is disabled or unavailable
        """
        subject = custom_subject or EMAIL_CONFIG["subject_template"]
        body_text = self.format_listings_text(listings, max_items=max_items, user_id=user_id)
        html_body = None
        
        # Try to render HTML if requested and available
        if use_html and HTML_RENDERING_AVAILABLE:
            try:
                # Convert listings to dict format for React component
                listing_dicts = [
                    convert_home_universal_to_listing_dict(listing)
                    for listing in listings[:max_items]
                ]
                
                # Render HTML email
                html_body = render_email_html(
                    template_name="ListingsEmail",
                    props={
                        "recipientEmail": recipient_email,
                        "listings": listing_dicts,
                        "maxItems": max_items,
                    },
                )
                logger.info(
                    f"Successfully rendered HTML email for {recipient_email} "
                    f"with {len(listing_dicts)} listings"
                )
            except Exception as e:
                logger.warning(
                    f"Failed to render HTML email for {recipient_email}, "
                    f"falling back to plain text: {e}"
                )
                # Continue with plain text only
                html_body = None
        
        return (recipient_email, subject, body_text, html_body)

    def format_email_with_llm(
        self,
        recipient_email: str,
        listings: List[HomeUniversal],
        user_data: Dict[str, Any],
        max_items: int = 10,
    ) -> Tuple[str, str, str]:
        """
        Format email using LLM for personalization.
        
        This is a placeholder for future LLM-based personalization.
        Currently returns the same format as format_email_message.
        
        Args:
            recipient_email: Email address of recipient
            listings: List of HomeUniversal objects to include
            user_data: User data dict for personalization
            max_items: Maximum number of listings to include
            
        Returns:
            Tuple of (recipient_email, subject, body_text)
        """
        if not self.use_llm or not self._llm_client:
            # Fallback to standard formatting
            return self.format_email_message(
                recipient_email=recipient_email,
                listings=listings,
                user_id=user_data.get("user_id"),
                max_items=max_items,
            )
        
        # Future: Implement LLM-based personalization
        # This would:
        # 1. Build a prompt with user preferences and listings
        # 2. Call LLM to generate personalized subject and body
        # 3. Return formatted message
        #
        # Example future implementation:
        # system_prompt = "You are a helpful assistant that personalizes home listing emails."
        # user_prompt = f"""
        # User preferences: {json.dumps(user_data)}
        # Listings: {json.dumps([h.to_dict() for h in listings[:max_items]])}
        # Generate a personalized email subject and body.
        # """
        # response = self._llm_client.call_llm(system_prompt, user_prompt)
        # personalized_content = response["content"]
        # subject = personalized_content.get("subject", EMAIL_CONFIG["subject_template"])
        # body = personalized_content.get("body", self.format_listings_text(listings, max_items))
        # return (recipient_email, subject, body)
        
        logger.info("[EMAIL_FORMATTER] LLM personalization not yet implemented, using standard formatting")
        return self.format_email_message(
            recipient_email=recipient_email,
            listings=listings,
            user_id=user_data.get("user_id"),
            max_items=max_items,
        )


def format_email_messages(
    user_listings: List[Tuple[str, str, List[HomeUniversal]]],
    max_items_per_user: int = 10,
    use_llm: bool = False,
    use_html: bool = True,
) -> List[Tuple[str, str, str, Optional[str]]]:
    """
    Format email messages for multiple users.
    
    Args:
        user_listings: List of tuples (user_id, email, listings)
        max_items_per_user: Maximum listings per email
        use_llm: Whether to use LLM personalization (not yet implemented)
        use_html: If True, render HTML email using React Email (default: True)
        
    Returns:
        List of tuples (recipient_email, subject, body_text, html_body)
        html_body will be None if HTML rendering is disabled or unavailable
    """
    formatter = EmailFormatter(use_llm=use_llm)
    messages: List[Tuple[str, str, str, Optional[str]]] = []
    
    for user_id, email, listings in user_listings:
        if not email or not listings:
            continue
        
        try:
            message = formatter.format_email_message(
                recipient_email=email,
                listings=listings,
                user_id=user_id,
                max_items=max_items_per_user,
                use_html=use_html,
            )
            messages.append(message)
        except Exception as e:
            logger.error(f"[EMAIL_FORMATTER] Failed to format email for {email}: {e}")
            continue
    
    return messages

