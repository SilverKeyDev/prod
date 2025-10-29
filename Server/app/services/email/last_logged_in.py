from datetime import datetime, timedelta
from typing import List, Dict
from app import db
from app.models.user import User


def get_recently_logged_in_users_with_preferences() -> List[Dict[str, str]]:
    """
    Find all users who:
    1. Have last_logged_in not null
    2. Have last_logged_in within the last month
    3. Have has_preferences set to True
    
    Returns:
        List of dictionaries containing user id and email
        Format: [{'user_id': 'xxx', 'email': 'user@example.com'}, ...]
    """
    # Calculate the date one month ago
    one_month_ago = datetime.utcnow() - timedelta(days=30)
    
    # Query users meeting all three conditions
    users = db.session.query(User).filter(
        User.last_logged_in.isnot(None),
        User.last_logged_in >= one_month_ago,
        User.has_preferences == True
    ).all()
    
    # Return list of dictionaries with user id and email
    return [{'user_id': user.id, 'email': user.email} for user in users]

