# Fix Hugging Face parallelism warnings - must be set before any HF imports
import os
import random
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

from flask import Flask, send_from_directory, jsonify, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_executor import Executor
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
    from .routes.offer import offer_bp

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
    app.register_blueprint(offer_bp)

    # Health check endpoint
    @app.route('/healthz', methods=['GET', 'HEAD'])
    def healthz():
        return jsonify({"status": "ok"}), 200

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

    # Request/Response logging middleware
    @app.before_request
    def log_request_info():
        import time
        from datetime import datetime
        
        request_id = f"req_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        g.start_time = time.time()
        g.request_id = request_id
        
        # Log request details
        app.logger.info(f"REQUEST_START", extra={
            'request_id': request_id,
            'method': request.method,
            'url': request.url,
            'endpoint': request.endpoint,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'unknown'),
            'content_type': request.content_type,
            'content_length': request.content_length,
            'has_json': request.is_json,
            'headers': dict(request.headers),
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Log request data for auth endpoints
        if request.endpoint and 'auth' in request.endpoint:
            try:
                if request.is_json:
                    data = request.get_json()
                    if data:
                        sanitized_data = {}
                        for key, value in data.items():
                            if key == 'email' and isinstance(value, str):
                                sanitized_data[key] = value[:3] + '***' + value[-3:]
                            elif key == 'password':
                                sanitized_data[key] = f"[{len(str(value))} chars]"
                            else:
                                sanitized_data[key] = str(value)[:100]  # Truncate long values
                        
                        app.logger.info(f"AUTH_REQUEST_DATA", extra={
                            'request_id': request_id,
                            'data': sanitized_data
                        })
            except Exception as e:
                app.logger.warning(f"AUTH_REQUEST_DATA_ERROR", extra={
                    'request_id': request_id,
                    'error': str(e)
                })

    @app.after_request
    def log_response_info(response):
        import time
        from datetime import datetime
        
        if hasattr(g, 'request_id') and hasattr(g, 'start_time'):
            request_id = g.request_id
            duration_ms = int((time.time() - g.start_time) * 1000)
            
            # Log response details
            app.logger.info(f"RESPONSE_COMPLETE", extra={
                'request_id': request_id,
                'method': request.method,
                'url': request.url,
                'endpoint': request.endpoint,
                'status_code': response.status_code,
                'status_text': response.status,
                'content_type': response.content_type,
                'content_length': response.content_length,
                'duration_ms': duration_ms,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Enhanced logging for auth endpoints
            if request.endpoint and 'auth' in request.endpoint:
                try:
                    if response.is_json:
                        response_data = response.get_json()
                        if response_data:
                            sanitized_response = {}
                            for key, value in response_data.items():
                                if key == 'user' and isinstance(value, dict):
                                    sanitized_user = {}
                                    for user_key, user_value in value.items():
                                        if user_key == 'email' and isinstance(user_value, str):
                                            sanitized_user[user_key] = user_value[:3] + '***' + user_value[-3:]
                                        else:
                                            sanitized_user[user_key] = str(user_value)[:100]
                                    sanitized_response[key] = sanitized_user
                                elif key == 'id_token':
                                    sanitized_response[key] = f"[{len(str(value))} chars]"
                                else:
                                    sanitized_response[key] = str(value)[:100]
                            
                            app.logger.info(f"AUTH_RESPONSE_DATA", extra={
                                'request_id': request_id,
                                'data': sanitized_response,
                                'duration_ms': duration_ms
                            })
                except Exception as e:
                    app.logger.warning(f"AUTH_RESPONSE_DATA_ERROR", extra={
                        'request_id': request_id,
                        'error': str(e),
                        'duration_ms': duration_ms
                    })
            
            # Log slow requests
            if duration_ms > 5000:  # 5 seconds
                app.logger.warning(f"SLOW_REQUEST", extra={
                    'request_id': request_id,
                    'method': request.method,
                    'url': request.url,
                    'duration_ms': duration_ms,
                    'status_code': response.status_code
                })
            
            # Log 502 errors specifically
            if response.status_code == 502:
                app.logger.error(f"BAD_GATEWAY_ERROR", extra={
                    'request_id': request_id,
                    'method': request.method,
                    'url': request.url,
                    'endpoint': request.endpoint,
                    'duration_ms': duration_ms,
                    'response_headers': dict(response.headers),
                    'response_data': response.get_data(as_text=True)[:500] if response.get_data() else 'empty'
                })
        
        return response

    # Global error handlers
    @app.errorhandler(ExpiredSignatureError)
    def handle_expired_signature(error):
        app.logger.warning("Expired token detected, prompting re-login.")
        return jsonify({
            'success': False,
            'error': 'TOKEN_EXPIRED',
            'message': 'Signature has expired. Please log in again.'
        }), 401

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        import traceback
        from datetime import datetime
        
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        
        app.logger.error(f"INTERNAL_SERVER_ERROR", extra={
            'request_id': request_id,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': error_traceback,
            'url': request.url if request else 'unknown',
            'method': request.method if request else 'unknown',
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'success': False,
            'error': 'INTERNAL_SERVER_ERROR',
            'message': 'An internal server error occurred. Please try again later.'
        }), 500

    @app.errorhandler(502)
    def handle_bad_gateway(error):
        import traceback
        from datetime import datetime
        
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        
        app.logger.error(f"BAD_GATEWAY_ERROR_HANDLER", extra={
            'request_id': request_id,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': error_traceback,
            'url': request.url if request else 'unknown',
            'method': request.method if request else 'unknown',
            'headers': dict(request.headers) if request else {},
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'success': False,
            'error': 'BAD_GATEWAY',
            'message': 'Service temporarily unavailable. Please try again later.'
        }), 502

    @app.errorhandler(503)
    def handle_service_unavailable(error):
        import traceback
        from datetime import datetime
        
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        
        app.logger.error(f"SERVICE_UNAVAILABLE_ERROR", extra={
            'request_id': request_id,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': error_traceback,
            'url': request.url if request else 'unknown',
            'method': request.method if request else 'unknown',
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'success': False,
            'error': 'SERVICE_UNAVAILABLE',
            'message': 'Service temporarily unavailable. Please try again later.'
        }), 503

    @app.errorhandler(504)
    def handle_gateway_timeout(error):
        import traceback
        from datetime import datetime
        
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        
        app.logger.error(f"GATEWAY_TIMEOUT_ERROR", extra={
            'request_id': request_id,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': error_traceback,
            'url': request.url if request else 'unknown',
            'method': request.method if request else 'unknown',
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'success': False,
            'error': 'GATEWAY_TIMEOUT',
            'message': 'Request timeout. Please try again later.'
        }), 504

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