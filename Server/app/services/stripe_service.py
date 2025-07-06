import os
import stripe
from datetime import datetime, timezone

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

# Price mapping from plan IDs to Stripe price IDs
PRICE_IDS = {
    '5-reports': os.getenv('STRIPE_PRICE_5_REPORTS'),
    '20-reports': os.getenv('STRIPE_PRICE_20_REPORTS'),
    '50-reports': os.getenv('STRIPE_PRICE_50_REPORTS'),
    'unlimited-monthly': os.getenv('STRIPE_PRICE_UNLIMITED_MONTHLY'),
    'unlimited-yearly': os.getenv('STRIPE_PRICE_UNLIMITED_YEARLY'),
}

def create_checkout_session(price_id: str, customer_email: str):
    """Create a Stripe Checkout session"""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription' if 'unlimited' in price_id.lower() else 'payment',
            success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/subscription?cancelled=true",
            customer_email=customer_email,
            metadata={
                'plan_id': next((k for k, v in PRICE_IDS.items() if v == price_id), 'unknown')
            }
        )
        return {'session_id': session.id}
    except Exception as e:
        print(f"Error creating checkout session: {str(e)}")
        raise

def create_portal_session(customer_id: str):
    """Create a Stripe Customer Portal session"""
    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL')}/dashboard",
        )
        return {'url': session.url}
    except Exception as e:
        print(f"Error creating portal session: {str(e)}")
        raise

def handle_webhook(payload, sig_header):
    """Handle Stripe webhook events"""
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        print(f"Invalid payload: {str(e)}")
        raise e
    except stripe.error.SignatureVerificationError as e:
        print(f"Invalid signature: {str(e)}")
        raise e

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session(session)
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_successful_payment(invoice)
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_cancelled(subscription)

    return {'status': 'success'}

def handle_checkout_session(session):
    """Handle successful checkout session"""
    # Get or create user based on customer_email
    # Update user's subscription status and report limits
    # This is a placeholder - implement based on your user model
    pass

def handle_successful_payment(invoice):
    """Handle successful payment"""
    # Update user's subscription status
    # This is a placeholder - implement based on your user model
    pass

def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    # Update user's subscription status
    # This is a placeholder - implement based on your user model
    pass

def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation"""
    # Update user's subscription status
    # This is a placeholder - implement based on your user model
    pass
