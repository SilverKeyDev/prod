import os
import stripe
from datetime import datetime, timezone
from flask import current_app

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

# Price mapping from plan IDs to Stripe price IDs
PRICE_IDS = {
    '5-reports': os.getenv('STRIPE_FIVE_REPORTS'),
    '20-reports': os.getenv('STRIPE_TWENTY_REPORTS'),
    '50-reports': os.getenv('STRIPE_FIFTY_REPORTS'),
    'unlimited-monthly': os.getenv('STRIPE_UNLIMITED_MONTHLY'),
    'unlimited-yearly': os.getenv('STRIPE_UNLIMITED_YEARLY'),
}

def create_checkout_session(plan_id: str, customer_email: str):
    """Create a Stripe Checkout session
    
    Args:
        plan_id: The plan ID (e.g., '5-reports', 'unlimited-monthly')
        customer_email: Email of the customer
        
    Returns:
        dict: Contains session_id for the checkout session
        
    Raises:
        ValueError: If the plan_id is not found in PRICE_IDS
    """
    try:
        # Get the Stripe price ID for the plan
        price_id = PRICE_IDS.get(plan_id)
        if not price_id:
            error_msg = f"No Stripe price ID mapped for plan: {plan_id}"
            print(error_msg)
            raise ValueError(error_msg)
            
        print(f"[INFO] Creating checkout session - plan_id: {plan_id}, price_id: {price_id}")
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription' if 'unlimited' in plan_id.lower() else 'payment',
            success_url="https://silverkeyestates.com/dashboard/subscription",
            cancel_url="https://silverkeyestates.com/dashboard/subscription?cancelled=true",
            customer_email=customer_email,
            metadata={'plan_id': plan_id}
        )

        # Debug type check
        print(f"[DEBUG] Stripe session object type: {type(session)}")
        print(f"[DEBUG] Stripe session contents: {session}")

        # Defensive access to session ID
        session_id = getattr(session, 'id', None) or session.get('id')
        if not session_id:
            raise ValueError("Failed to retrieve session ID from Stripe response")

        return {'session_id': session_id}

    except Exception as e:
        print(f"[ERROR] Error creating checkout session: {str(e)}")
        raise


def create_portal_session(customer_id: str):
    """Create a Stripe Customer Portal session"""
    try:
        frontend_url = os.getenv('FRONTEND_URL')
        
        # Fallback to production URL if FRONTEND_URL is not set
        if not frontend_url:
            frontend_url = "https://silverkeyestates.com"
            
        print(f"[Portal] Attempting to create portal session for customer: {customer_id}")
        print(f"[Portal] Using return URL: {frontend_url}/dashboard")

        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{frontend_url}/dashboard",
        )
        print(f"[Portal] Created session: {session.url}")
        return {'url': session.url}

    except Exception as e:
        print(f"[Portal] Error creating portal session: {str(e)}")
        raise

# Webhook handling has been moved to payment.py to avoid duplication
def handle_checkout_session(session):
    from app import db
    from app.models.user import User
    from app.models.subscription import Subscription
    from datetime import datetime, timedelta

    try:
        current_app.logger.info(f"[CHECKOUT] ✅ Received session: {session}")

        customer_email = session.get('customer_email')
        if not customer_email:
            current_app.logger.error('[CHECKOUT] ❌ No customer email in session')
            return

        user = User.query.filter_by(email=customer_email).first()
        if not user:
            current_app.logger.error(f'[CHECKOUT] ❌ No user found with email: {customer_email}')
            return

        current_app.logger.info(f"[CHECKOUT] 👤 Found user ID: {user.id}, email: {user.email}")

        plan_id = session.get('metadata', {}).get('plan_id', '5-reports')
        current_app.logger.info(f"[CHECKOUT] 📦 Plan ID from metadata: {plan_id}")

        reports_limit = {
            'unlimited-monthly': -1,
            'unlimited-yearly': -1
        }.get(plan_id, 0)
        current_app.logger.info(f"[CHECKOUT] 📊 Resolved reports_limit: {reports_limit}")

        subscription = Subscription.query.filter_by(user_id=user.id).first()
        if not subscription:
            subscription = Subscription(user_id=user.id, status='active')
            db.session.add(subscription)
            current_app.logger.info(f"[CHECKOUT] 🆕 Created new subscription object for user {user.id}")
        else:
            current_app.logger.info(f"[CHECKOUT] 🔄 Updating existing subscription for user {user.id}")

        # For unlimited subscriptions, set user as agent and activate subscription
        user.is_agent = True
        db.session.add(user)
        interval = 'month' if 'monthly' in plan_id else 'year'
        subscription.current_period_end = datetime.utcnow() + timedelta(
            days=30 if interval == 'month' else 365
        )
        subscription.reports_limit = -1  # Set reports_limit for unlimited subscriptions
        current_app.logger.info(
            f"[CHECKOUT] 🎯 Set user as agent (is_agent=True) for subscription plan: {plan_id}"
        )
        current_app.logger.info(
            f"[CHECKOUT] 📅 Set subscription period end to {subscription.current_period_end} "
            f"(interval: {interval}, limit: {reports_limit})"
        )

        # Set final subscription fields
        subscription.plan_id = plan_id
        subscription.stripe_customer_id = session.get('customer')
        subscription.stripe_subscription_id = session.get('subscription')
        subscription.status = 'active'

        db.session.commit()
        current_app.logger.info(f"[CHECKOUT] ✅ Successfully committed subscription changes for user {user.id}")

    except Exception as e:
        current_app.logger.error(f"[CHECKOUT] ❗ Error occurred: {str(e)}", exc_info=True)
        db.session.rollback()

def handle_successful_payment(invoice):
    """Handle successful payment"""
    from app import db
    from app.models.user import User
    from app.models.subscription import Subscription
    
    try:
        customer_id = invoice.get('customer')
        subscription_id = invoice.get('subscription')
        
        if not customer_id or not subscription_id:
            current_app.logger.error('Missing customer or subscription ID in invoice')
            return
            
        # Find subscription
        subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if not subscription:
            current_app.logger.error(f'Subscription not found: {subscription_id}')
            return
            
        # Update subscription status and period
        subscription.status = 'active'
        subscription.current_period_end = datetime.utcfromtimestamp(invoice['period_end'])
        
        # For subscription payments, ensure user is set as agent
        user = User.query.get(subscription.user_id)
        if user and subscription.plan_id in ['unlimited-monthly', 'unlimited-yearly']:
            user.is_agent = True
            db.session.add(user)
            current_app.logger.info(f'Set user {user.id} as agent (is_agent=True) for subscription payment')
        
        db.session.commit()
        
        current_app.logger.info(f'Processed payment for subscription {subscription_id}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling successful payment: {str(e)}')
        db.session.rollback()

def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    from app import db
    from app.models.subscription import Subscription
    
    try:
        subscription_id = subscription['id']
        status = subscription['status']
        
        # Find and update subscription
        db_subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if not db_subscription:
            current_app.logger.error(f'Subscription not found: {subscription_id}')
            return
            
        # Update status and period
        db_subscription.status = status
        
        # Update period end if available
        if 'current_period_end' in subscription:
            db_subscription.current_period_end = datetime.utcfromtimestamp(
                subscription['current_period_end']
            )
            
        db.session.commit()
        current_app.logger.info(f'Updated subscription {subscription_id} to status: {status}')
        
    except Exception as e:
        current_app.logger.error(f'Error updating subscription: {str(e)}')
        db.session.rollback()

def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation"""
    from app import db
    from app.models.subscription import Subscription
    from app.models.user import User
    
    try:
        subscription_id = subscription['id']
        
        # Find and update subscription
        db_subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if not db_subscription:
            current_app.logger.error(f'Subscription not found for cancellation: {subscription_id}')
            return
        
        # Find user through subscription relationship
        user = User.query.get(db_subscription.user_id)
        if not user:
            current_app.logger.error(f'User not found for subscription: {subscription_id}')
            return
        
        # Update subscription status to canceled
        db_subscription.status = 'canceled'
        
        # Remove agent status from user
        user.is_agent = False
        
        db.session.commit()
        
        current_app.logger.info(f'Canceled subscription: {subscription_id}, removed agent status from user: {user.id}')
        
    except Exception as e:
        current_app.logger.error(f'Error canceling subscription: {str(e)}')
        db.session.rollback()

def get_subscription_status(subscription_id: str) -> str:
    """Get the current status of a subscription from Stripe"""
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return subscription.status
    except stripe.error.InvalidRequestError:
        current_app.logger.error(f'Invalid subscription ID: {subscription_id}')
        return 'inactive'
    except Exception as e:
        current_app.logger.error(f'Error getting subscription status: {str(e)}')
        return 'inactive'
