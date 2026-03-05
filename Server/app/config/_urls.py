import os


def get_google_redirect_uri():
    """Get Google OAuth redirect URI based on environment."""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/google/oauth/callback"
    # Development: use localhost with port 5173 (Vite dev server)
    return "http://localhost:5173/api/v1/google/oauth/callback"


def get_frontend_url():
    """Get frontend URL based on environment."""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com"
    # Development: use localhost with port 5173 (Vite dev server)
    return "http://localhost:5173"
