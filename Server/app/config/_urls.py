import os


def get_google_redirect_uri():
    """Get Google OAuth redirect URI based on environment."""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/google/oauth/callback"
    # Development: use localhost with port 5000 (Flask backend) — OAuth callback is an API route
    return "http://localhost:5000/api/v1/google/oauth/callback"


def get_skyslope_redirect_uri():
    """Get SkySlope OAuth redirect URI based on environment."""
    explicit = os.getenv("SKYSLOPE_REDIRECT_URI", "").strip()
    if explicit:
        return explicit
    flask_env = os.getenv("FLASK_ENV", "development")
    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/skyslope/callback"
    # Development: use localhost with port 5000 (Flask backend) — OAuth callback is an API route
    return "http://localhost:5000/api/v1/skyslope/callback"


def get_frontend_url():
    """Get frontend URL based on environment."""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com"
    # Development: use localhost with port 5173 (Vite dev server)
    return "http://localhost:5173"
