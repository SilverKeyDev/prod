import os
import stripe
from datetime import datetime, timezone

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
            success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/subscription?cancelled=true",
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
    from app import db
    from app.models.user import User
    from app.models.subscription import Subscription
    
    try:
        customer_email = session.get('customer_email')
        if not customer_email:
            current_app.logger.error('No customer email in checkout session')
            return
            
        # Find user by email
        user = User.query.filter_by(email=customer_email).first()
        if not user:
            current_app.logger.error(f'User not found with email: {customer_email}')
            return
            
        # Get plan details from metadata or line items
        plan_id = session.get('metadata', {}).get('plan_id', '5-reports')
        reports_limit = {
            '5-reports': 5,
            '20-reports': 20,
            '50-reports': 50,
            'unlimited-monthly': -1,  # -1 means unlimited
            'unlimited-yearly': -1
        }.get(plan_id, 0)
        
        # Update or create subscription
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.session.add(subscription)
            
        subscription.plan_id = plan_id
        subscription.reports_used = 0
        subscription.reports_limit = reports_limit
        subscription.stripe_customer_id = session.get('customer')
        subscription.stripe_subscription_id = session.get('subscription')
        subscription.status = 'active'
        
        # For one-time purchases, set expiration date
        if plan_id in ['5-reports', '20-reports', '50-reports']:
            subscription.current_period_end = None  # No expiration for one-time purchases
        else:
            # For subscriptions, set period end based on interval
            interval = 'month' if 'monthly' in plan_id else 'year'
            from datetime import datetime, timedelta
            subscription.current_period_end = datetime.utcnow() + timedelta(
                days=30 if interval == 'month' else 365
            )
        
        db.session.commit()
        current_app.logger.info(f'Updated subscription for user {user.id}')
        
    except Exception as e:
        current_app.logger.error(f'Error handling checkout session: {str(e)}')
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
    
    try:
        subscription_id = subscription['id']
        
        # Find and update subscription
        db_subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()
        
        if not db_subscription:
            current_app.logger.error(f'Subscription not found for cancellation: {subscription_id}')
            return
            
        # Update status to canceled
        db_subscription.status = 'canceled'
        db.session.commit()
        
        current_app.logger.info(f'Canceled subscription: {subscription_id}')
        
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
