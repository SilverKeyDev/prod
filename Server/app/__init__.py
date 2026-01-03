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
from sqlalchemy.exc import ProgrammingError, OperationalError, IntegrityError, DatabaseError
from werkzeug.exceptions import Unauthorized

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
ma = Marshmallow()
executor = Executor()


def create_app(config=None):

    # STATIC FOLDER: matches Docker
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../Client/dist")
    # IMPORTANT: move Flask's built-in static off "/" to avoid intercepting SPA routes like /login
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)
    
    # Configure centralized logging for entire application
    from .utils.security.app_logging import configure_app_logging
    configure_app_logging(app)

    # Initialize extensions
    db.init_app(app)    
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    migrate = Migrate(app, db)

    # Initialize database within app context
    with app.app_context():
        from .models import User, PDFDocument, HomeUniversal
        from .models.chat_history import ChatHistory
        db.create_all()

    # CORS Configuration with runtime origins list
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    ALLOWED = [o.strip() for o in raw.split(",") if o.strip()]
    if not ALLOWED:
        ALLOWED = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://usesilverkey.com",
        ]
    
    CORS(
        app,
        resources={r"/api/*": {"origins": ALLOWED}},
        supports_credentials=True,
        expose_headers=["Content-Type", "X-CSRFToken"],
        allow_headers=["Content-Type", "X-CSRFToken"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        vary_header=True,
    )

    # Register login manager loader
    from .models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Initialize S3 service silently
    with app.app_context():
        try:
            from .utils.s3_service import s3_service
            s3_service._initialize_s3_client(force_retry=True)
        except Exception:
            pass

    # Validate environment variables at startup
    from .utils.security.env_validator import validate_environment, check_api_keys
    try:
        validate_environment()
        api_status = check_api_keys()
        missing_apis = [name for name, status in api_status.items() if not status]
        if missing_apis:
            logging.getLogger(__name__).warning(f"Missing API keys: {', '.join(missing_apis)}")
    except Exception as e:
        logging.getLogger(__name__).warning(f"Environment validation warning: {e}")

    from .services.auth.minimal_token import minimal_token_service
    flask_env = os.getenv('FLASK_ENV', 'development')

    # Register blueprints
    from .routes.dashboard import dashboard_bp
    from .routes.auth import auth_bp
    from .routes.user import user_bp
    from .routes.preferences import preferences_bp
    from .routes.home_matching import home_matching_bp
    from .routes.maps import maps_bp
    from .routes.search import search_bp
    from .routes.research import research_bp
    from .routes.secure_upload import secure_upload_bp
    from .routes.offer import offer_bp
    from .routes.google_calendar import google_calendar_bp
    from .routes.agent import agent_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(home_matching_bp)
    app.register_blueprint(maps_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(research_bp)
    app.register_blueprint(secure_upload_bp)
    app.register_blueprint(offer_bp)
    app.register_blueprint(google_calendar_bp)
    app.register_blueprint(agent_bp)

    # ---------- Static asset routes (Vite build) ----------
    # Serve /assets/* out of the Vite dist directory with correct MIME types.
    @app.route('/assets/<path:filename>', methods=['GET', 'HEAD'])
    def serve_assets(filename):
        return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

    # Common top-level files Vite may emit (optional but nice to have)
    @app.route('/robots.txt', methods=['GET', 'HEAD'])
    @app.route('/manifest.webmanifest', methods=['GET', 'HEAD'])
    @app.route('/site.webmanifest', methods=['GET', 'HEAD'])
    @app.route('/favicon.ico', methods=['GET', 'HEAD'])
    def top_level_static():
        # Will 404 naturally if not present—browser handles that fine.
        path = request.path.lstrip('/')
        return send_from_directory(app.static_folder, path)

    # Health check endpoint with DB connectivity test
    @app.route('/healthz', methods=['GET', 'HEAD'])
    def healthz():
        try:
            from sqlalchemy import text
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({"status": "ok", "database": "connected"}), 200
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            return jsonify({"status": "error", "database": "disconnected", "error": str(e)}), 503

    # Request/Response logging middleware
    @app.before_request
    def log_request_info():
        import time
        request_id = f"req_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        g.start_time = time.time()
        g.request_id = request_id
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
                                sanitized_data[key] = str(value)[:100]
            except Exception as e:
                app.logger.warning("AUTH_REQUEST_DATA_ERROR", extra={'request_id': request_id, 'error': str(e)})

    @app.after_request
    def log_response_info(response):
        import time
        if hasattr(g, 'request_id') and hasattr(g, 'start_time'):
      
            # Security headers (unchanged from your version)
            is_pdf_viewer = (
                request.endpoint and 
                ('view_pdf_inline' in str(request.endpoint) or 
                 '/view' in request.path or
                 request.path.endswith('/view'))
            )
            if is_pdf_viewer:
                permissions_policy = (
                    "camera=(), microphone=(), geolocation=(), fullscreen=*, "
                    "payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
                )
            else:
                permissions_policy = (
                    "camera=(), microphone=(), geolocation=(), "
                    "fullscreen=(self \"https://*.amazonaws.com\"), "
                    "payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
                )
            response.headers['Permissions-Policy'] = permissions_policy
            response.headers['X-Content-Type-Options'] = 'nosniff'
            if not is_pdf_viewer:
                response.headers['X-Frame-Options'] = 'DENY'
            else:
                response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # ---- error handlers (unchanged) ----
    @app.errorhandler(ExpiredSignatureError)
    def handle_expired_signature(error):
        app.logger.warning("Expired token detected, prompting re-login.")
        return jsonify({'success': False,'error': 'TOKEN_EXPIRED','message': 'Signature has expired. Please log in again.'}), 401

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("INTERNAL_SERVER_ERROR", extra={'request_id': request_id,'error_type': type(error).__name__,'error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'INTERNAL_SERVER_ERROR','message': 'An internal server error occurred. Please try again later.'}), 500

    @app.errorhandler(502)
    def handle_bad_gateway(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("BAD_GATEWAY_ERROR_HANDLER", extra={'request_id': request_id,'error_type': type(error).__name__,'error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','headers': dict(request.headers) if request else {},'timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'BAD_GATEWAY','message': 'Service temporarily unavailable. Please try again later.'}), 502

    @app.errorhandler(503)
    def handle_service_unavailable(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("SERVICE_UNAVAILABLE_ERROR", extra={'request_id': request_id,'error_type': type(error).__name__,'error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'SERVICE_UNAVAILABLE','message': 'Service temporarily unavailable. Please try again later.'}), 503

    @app.errorhandler(504)
    def handle_gateway_timeout(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("GATEWAY_TIMEOUT_ERROR", extra={'request_id': request_id,'error_type': type(error).__name__,'error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'GATEWAY_TIMEOUT','message': 'Request timeout. Please try again later.'}), 504

    @app.errorhandler(ProgrammingError)
    def handle_programming_error(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("DB_PROGRAMMING_ERROR", extra={'request_id': request_id,'error_type': 'ProgrammingError','error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','endpoint': request.endpoint if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'DATABASE_ERROR','message': 'Database query error. Please contact support if this persists.'}), 500

    @app.errorhandler(OperationalError)
    def handle_operational_error(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("DB_OPERATIONAL_ERROR", extra={'request_id': request_id,'error_type': 'OperationalError','error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','endpoint': request.endpoint if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'DATABASE_CONNECTION_ERROR','message': 'Database connection error. Please try again later.'}), 503

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("DB_INTEGRITY_ERROR", extra={'request_id': request_id,'error_type': 'IntegrityError','error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','endpoint': request.endpoint if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'DATA_INTEGRITY_ERROR','message': 'Data integrity constraint violation.'}), 422

    @app.errorhandler(DatabaseError)
    def handle_database_error(error):
        import traceback
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        error_traceback = traceback.format_exc()
        app.logger.error("DB_GENERAL_ERROR", extra={'request_id': request_id,'error_type': 'DatabaseError','error_message': str(error),'traceback': error_traceback,'url': request.url if request else 'unknown','method': request.method if request else 'unknown','endpoint': request.endpoint if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'DATABASE_ERROR','message': 'Database error occurred. Please try again later.'}), 500

    @app.errorhandler(Unauthorized)
    def handle_unauthorized(error):
        from datetime import datetime
        request_id = getattr(g, 'request_id', 'unknown')
        app.logger.warning("UNAUTHORIZED_ACCESS", extra={'request_id': request_id,'error_type': 'Unauthorized','error_message': str(error),'url': request.url if request else 'unknown','method': request.method if request else 'unknown','endpoint': request.endpoint if request else 'unknown','timestamp': datetime.utcnow().isoformat()})
        return jsonify({'success': False,'error': 'UNAUTHORIZED','message': 'Authentication required.'}), 401

    # Favicon route left here for completeness; top_level_static above also handles it.
    @app.route('/favicon.ico')
    def favicon():
        favicon_path = os.path.join(app.static_folder, 'favicon.ico')
        if os.path.exists(favicon_path):
            return send_from_directory(app.static_folder, 'favicon.ico')
        return ('', 204)

    # --- SPA catch-all route (MUST be registered last) ---
    @app.route("/", defaults={"path": ""}, methods=["GET", "HEAD"])
    @app.route("/<path:path>", methods=["GET", "HEAD"])
    def catch_all(path):
        # Do NOT hijack API or explicit Flask static handler
        if path.startswith(("api/", "static/")) or path in ("healthz", "favicon.ico"):
            return jsonify({"error": "Not Found"}), 404

        # Serve real files under dist (robots.txt, manifest.json, assets/*, etc.)
        try:
            requested_file = os.path.join(app.static_folder, path)
            if os.path.commonpath([app.static_folder, requested_file]) == app.static_folder and os.path.isfile(requested_file):
                return send_from_directory(app.static_folder, path)
        except (ValueError, OSError):
            pass  # fall through to SPA index

        # SPA routing: return index.html for client-side routes (e.g., /login, /dashboard)
        return send_from_directory(app.static_folder, "index.html")

    return app
