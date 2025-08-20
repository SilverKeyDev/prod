# Fix Hugging Face parallelism warnings - must be set before any HF imports
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_MAX_THREADS", "14")

# Optional on macOS to avoid fork shenanigans in dev
try:
    import multiprocessing as mp
    mp.set_start_method("spawn")  # no-op if already set
except Exception:
    pass

from flask import Flask, send_from_directory, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
from flask_jwt_extended import JWTManager
from datetime import datetime
from .config import Config
import logging
from jose.exceptions import ExpiredSignatureError

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
ma = Marshmallow()
executor = Executor()


def create_app(config=None):

    # STATIC FOLDER: matches Docker
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../Client/dist")
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)
    
    # Configure centralized logging for entire application
    from .utils.app_logging import configure_app_logging
    configure_app_logging(app)

    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret")
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"

    jwt = JWTManager(app)

    # Initialize extensions
    db.init_app(app)    
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    migrate = Migrate(app, db)

    # Initialize database within app context
    with app.app_context():
        from .models import User, PDFDocument, Subscription, HomeDescription, HomeUniversal
        from .models.chat_history import ChatHistory
        db.create_all()

    # Global CORS Configuration - Restricted to specific domains
    CORS(app, resources={
        r"/*": {
            "origins": [
                "https://silverkeyestates.com",
                "https://www.silverkeyestates.com",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://10.136.25.50:5173",
                "http://10.90.20.231:5173"
            ],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "expose_headers": ["Content-Type", "X-CSRFToken"],
            "max_age": 600
        },
    })

    # Register login manager loader
    from .models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Initialize S3 service
    with app.app_context():
        try:
            from .services.s3_service import s3_service
            from .utils.app_logging import get_logger
            logger = get_logger()
        except Exception as e:
            from .utils.app_logging import get_logger
            logger = get_logger()
            logger.error(f"Failed to initialize S3 service: {str(e)}")
            logger.error("Application will continue with local storage fallback")

    # Validate environment variables at startup
    from .utils.env_validator import validate_environment, check_api_keys
    try:
        validate_environment()
        api_status = check_api_keys()
        missing_apis = [name for name, status in api_status.items() if not status]
        if missing_apis:
            logging.getLogger(__name__).warning(f"Missing API keys: {', '.join(missing_apis)}")
    except Exception as e:
        logging.getLogger(__name__).warning(f"Environment validation warning: {e}")

    # Register blueprints
    from .routes.report import report_bp
    from .routes.dashboard import dashboard_bp
    from .routes.auth import auth_bp
    from .routes.payment import payment_bp
    from .routes.user import user_bp
    from .routes.preferences import preferences_bp
    from .routes.chatbot import chatbot_bp
    from .routes.home_matching import home_matching_bp
    from .routes.maps import maps_bp
    from .routes.search import search_bp
    from .routes.secure_upload import secure_upload_bp

    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(home_matching_bp)
    app.register_blueprint(maps_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(secure_upload_bp)

    # Security headers middleware
    @app.after_request
    def security_headers(response):
        """Add security headers to all responses"""
        # HTTPS enforcement
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Content security policy
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://js.stripe.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://cognito-idp.us-east-2.amazonaws.com; "
            "frame-src https://js.stripe.com; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response.headers['Content-Security-Policy'] = csp_policy
        
        # Additional security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response

    # Global handler for expired JWT tokens
    @app.errorhandler(ExpiredSignatureError)
    def handle_expired_signature(error):
        app.logger.warning("Expired token detected, prompting re-login.")
        return jsonify({
            'success': False,
            'error': 'TOKEN_EXPIRED',
            'message': 'Signature has expired. Please log in again.'
        }), 401

    # Static asset serving
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        path = os.path.join(app.static_folder, "assets")
        print(f"Serving from {path} filename={filename}")
        return send_from_directory(path, filename)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        if path == "":
            print("CATCH_ALL: Serving index.html for root path")
            return send_from_directory(app.static_folder, "index.html")

        requested_file = os.path.join(app.static_folder, path)
        if os.path.isfile(requested_file):
            print(f"CATCH_ALL: Serving static file: {path}")
            return send_from_directory(app.static_folder, path)
        else:
            print(f"CATCH_ALL: Path not found: {path} — serving index.html fallback")
            return send_from_directory(app.static_folder, "index.html")

    return app