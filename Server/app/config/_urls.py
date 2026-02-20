import os


def get_google_redirect_uri():
    """Get Google OAuth redirect URI based on environment"""
    # Check if we're in development (localhost) or production
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/google/oauth/callback"
    else:
        # Development: use localhost with port 5173 (Vite dev server)
        return "http://localhost:5173/api/v1/google/oauth/callback"


def get_frontend_url():
    """Get frontend URL based on environment"""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com"
    else:
        # Development: use localhost with port 5173 (Vite dev server)
        return "http://localhost:5173"


def get_docusign_webhook_connect_url():
    """Get DocuSign webhook connect URL based on environment"""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        # Use main domain to match existing API pattern (same as Google OAuth callback)
        return "https://usesilverkey.com/api/v1/webhooks/docusign/connect"
    else:
        # Development: use localhost (backend runs on port 5000)
        return "http://localhost:5000/api/v1/webhooks/docusign/connect"


def get_docusign_oauth_redirect_uri():
    """Get DocuSign OAuth redirect URI based on environment"""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/docusign/oauth/callback"
    else:
        return "http://localhost:5000/api/v1/docusign/oauth/callback"
