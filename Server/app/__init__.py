# Fix Hugging Face parallelism warnings - must be set before any HF imports
import logging
import os
import random

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_MAX_THREADS", "14")

_HEALTHZ_IS_PRODUCTION = os.getenv("FLASK_ENV") == "production"

# Optional on macOS to avoid fork shenanigans in dev
try:
    import multiprocessing as mp

    mp.set_start_method("spawn")  # no-op if already set
except Exception:
    logging.getLogger(__name__).exception(
        "multiprocessing.set_start_method('spawn') failed; continuing with platform default"
    )

from flask import Flask, g, jsonify, make_response, request, send_from_directory
from flask_compress import Compress  # pyright: ignore[reportMissingImports]
from flask_cors import CORS
from flask_executor import Executor
from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate

from .config import Config
from .config.constants._constants_public_urls import (
    DEV_FRONTEND_ORIGIN,
    DEV_FRONTEND_ORIGIN_LOOPBACK,
    PUBLIC_PRODUCTION_ORIGIN,
)
from .extensions import db

# Initialize extensions (db from extensions; others local for create_app)
login_manager = LoginManager()
ma = Marshmallow()
executor = Executor()
compress = Compress()

# HTTP caching for Vite `dist` (hashed /assets are immutable; `index.html` must stay fresh for deploys)
_CACHE_IMMUTABLE_WEB_ASSETS = "public, max-age=31536000, immutable"
_CACHE_SPA_INDEX = "no-cache, no-store, must-revalidate"
_CACHE_DIST_UNHASHED = "public, max-age=86400"


def create_app(config=None):
    import time

    _boot_t0 = time.perf_counter()

    # STATIC FOLDER: matches Docker
    STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../Client/dist")
    # IMPORTANT: move Flask's built-in static off "/" to avoid intercepting SPA routes like /login
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")
    static_dir: str = app.static_folder or STATIC_DIR

    # Load config
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Configure centralized logging for entire application
    from .utils.security.app_logging import configure_app_logging

    configure_app_logging(app)

    # Initialize centralized logger (category-based with PII scrubbing)
    import sys

    server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if server_dir not in sys.path:
        sys.path.insert(0, server_dir)
    from logger import LOG_CATEGORIES, get_logger

    logger = get_logger()
    logger.info(LOG_CATEGORIES["API"], "Centralized logger initialized")

    def _log_boot_phase(phase: str) -> None:
        elapsed_ms = int((time.perf_counter() - _boot_t0) * 1000)
        logger.info(
            LOG_CATEGORIES["API"],
            f"gunicorn_boot_phase={phase} elapsed_ms={elapsed_ms} pid={os.getpid()}",
        )

    _log_boot_phase("logger_ready")

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    ma.init_app(app)
    executor.init_app(app)
    compress.init_app(app)
    Migrate(app, db)
    _log_boot_phase("extensions_ready")

    # Initialize database within app context
    with app.app_context():
        from .models import (  # noqa: F401
            ChatHistory,
            Document,
            PropertyCache,
            User,
            UserClientSettings,
        )

        # Production schema is owned by Alembic; skip create_all to avoid extra DDL round-trips at boot.
        if os.getenv("FLASK_ENV") == "production":
            logger.info(
                LOG_CATEGORIES["API"],
                "Skipping db.create_all() in production (migrations own schema)",
            )
        else:
            db.create_all()

        # Validate SQLAlchemy mapper configuration at startup (fail fast)
        try:
            from sqlalchemy.orm import configure_mappers

            configure_mappers()
            logger.info(LOG_CATEGORIES["API"], "SQLAlchemy mappers configured successfully")
        except Exception as mapper_error:
            logger.error(
                LOG_CATEGORIES["ERRORS"], f"SQLAlchemy mapper configuration failed: {mapper_error}"
            )
            raise RuntimeError(
                f"Database model configuration error: {mapper_error}"
            ) from mapper_error

    _log_boot_phase("db_mappers_ready")

    # CORS Configuration with runtime origins list
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    ALLOWED = [o.strip() for o in raw.split(",") if o.strip()]
    if not ALLOWED:
        ALLOWED = [
            DEV_FRONTEND_ORIGIN,
            DEV_FRONTEND_ORIGIN_LOOPBACK,
            PUBLIC_PRODUCTION_ORIGIN,
        ]

    CORS(
        app,
        resources={
            r"/api/*": {"origins": ALLOWED},
            r"/healthz": {"origins": ALLOWED},
            r"/livez": {"origins": ALLOWED},
            r"/readyz": {"origins": ALLOWED},
        },
        supports_credentials=True,
        expose_headers=["Content-Type", "X-CSRFToken", "X-Request-ID"],
        allow_headers=["Content-Type", "X-CSRFToken", "Authorization", "X-Request-ID"],
        methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        vary_header=True,
    )

    @app.route("/livez", methods=["GET", "HEAD"])
    def livez():
        """Process liveness only (no DB). Use for Docker/orchestrator probes; use /healthz for DB readiness."""
        return jsonify({"status": "ok"}), 200

    # Register login manager loader (User already imported in app_context block above)

    @login_manager.user_loader
    def load_user(user_id):
        from app.utils.db.orm_lookup import get_model

        # User.id is String(36) UUID; do not coerce to int
        return get_model(User, user_id)

    # S3 client is initialized lazily on first use via s3_service._ensure_s3_client() (avoids boto/head_bucket at boot).

    # Validate environment variables at startup
    from .utils.security.env_validator import check_api_keys
    from .utils.validation.config_validator import validate_and_raise

    try:
        validate_and_raise()  # Raises RuntimeError if required vars are missing
        api_status = check_api_keys()
        missing_apis = [name for name, status in api_status.items() if not status]
        if missing_apis:
            logger.warn(LOG_CATEGORIES["SECURITY"], f"Missing API keys: {', '.join(missing_apis)}")
    except RuntimeError:
        # Re-raise RuntimeError from config validation (critical)
        raise
    except Exception as e:
        logger.warn(LOG_CATEGORIES["SECURITY"], f"Environment validation warning: {str(e)}")

    _log_boot_phase("env_validate_done")

    # Register blueprints
    from .routes.admin import admin_bp
    from .routes.agent.agent import agent_bp
    from .routes.auth.auth import auth_bp
    from .routes.auth.preferences import preferences_bp
    from .routes.auth.search_display import search_display_bp
    from .routes.auth.user import user_bp
    from .routes.calendar.google_calendar import google_calendar_bp
    from .routes.client_errors import client_errors_bp
    from .routes.documents.report import report_bp
    from .routes.documents.secure_upload import secure_upload_bp
    from .routes.feed import feed_bp
    from .routes.forms import forms_bp
    from .routes.maps import maps_bp
    from .routes.offer import offer_bp
    from .routes.public import public_bp
    from .routes.search.home_matching import home_matching_bp
    from .routes.search.research import research_bp
    from .routes.search.search import search_bp
    from .routes.tasks import tasks_bp
    from .routes.transactions import transactions_bp
    from .routes.viewings import viewings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(preferences_bp)
    app.register_blueprint(search_display_bp)
    app.register_blueprint(home_matching_bp)
    app.register_blueprint(maps_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(research_bp)
    app.register_blueprint(secure_upload_bp)
    app.register_blueprint(offer_bp)
    app.register_blueprint(google_calendar_bp)
    app.register_blueprint(viewings_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(client_errors_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(forms_bp)

    try:
        from .routes.documents.docusign import docusign_bp, webhook_bp

        app.register_blueprint(docusign_bp)
        app.register_blueprint(webhook_bp)
        logger.info(LOG_CATEGORIES["API"], "DocuSign routes registered")
    except ImportError as e:
        logger.warn(LOG_CATEGORIES["API"], f"DocuSign routes not available: {e}")

    _log_boot_phase("blueprints_registered")

    # ---------- Static asset routes (Vite build) ----------
    # Serve /assets/* out of the Vite dist directory with correct MIME types.
    @app.route("/assets/<path:filename>", methods=["GET", "HEAD"])
    def serve_assets(filename):
        out = make_response(send_from_directory(os.path.join(static_dir, "assets"), filename))
        out.headers["Cache-Control"] = _CACHE_IMMUTABLE_WEB_ASSETS
        return out

    # Common top-level files Vite may emit (optional but nice to have)
    @app.route("/robots.txt", methods=["GET", "HEAD"])
    @app.route("/manifest.webmanifest", methods=["GET", "HEAD"])
    @app.route("/site.webmanifest", methods=["GET", "HEAD"])
    @app.route("/favicon.ico", methods=["GET", "HEAD"])
    def top_level_static():
        # Will 404 naturally if not present—browser handles that fine.
        p = request.path.lstrip("/")
        out = make_response(send_from_directory(static_dir, p))
        out.headers["Cache-Control"] = _CACHE_DIST_UNHASHED
        return out

    # Health: DB readiness (shared by /healthz and /readyz)
    def _db_readiness_response():
        try:
            from sqlalchemy import text

            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({"status": "ok", "database": "connected"}), 200
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}", exc_info=True)
            body = {"status": "error", "database": "disconnected"}
            if not _HEALTHZ_IS_PRODUCTION:
                body["error"] = str(e)
            return jsonify(body), 503

    @app.route("/healthz", methods=["GET", "HEAD"])
    def healthz():
        return _db_readiness_response()

    @app.route("/readyz", methods=["GET", "HEAD"])
    def readyz():
        """Database readiness (alias of /healthz) for operators who prefer the readyz name."""
        return _db_readiness_response()

    # Request/Response logging middleware
    @app.before_request
    def log_request_info():
        import re
        import time

        header_rid = request.headers.get("X-Request-ID") or request.headers.get("X-Request-Id")
        if (
            header_rid
            and isinstance(header_rid, str)
            and re.fullmatch(r"[A-Za-z0-9._-]{8,128}", header_rid)
        ):
            request_id = header_rid
        else:
            request_id = f"req_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        g.start_time = time.time()
        g.request_id = request_id
        # Global Privacy Control (CCPA/CPRA): opt-out of sale or sharing when the browser sends it.
        g.gpc_opt_out = request.headers.get("Sec-GPC", "").strip() == "1"
        if request.endpoint and "auth" in request.endpoint:
            try:
                if request.is_json:
                    data = request.get_json()
                    if data:
                        sanitized_data = {}
                        for key, value in data.items():
                            if key == "email" and isinstance(value, str):
                                sanitized_data[key] = value[:3] + "***" + value[-3:]
                            elif key == "password":
                                sanitized_data[key] = f"[{len(str(value))} chars]"
                            else:
                                sanitized_data[key] = str(value)[:100]
            except Exception as e:
                app.logger.warning(
                    "AUTH_REQUEST_DATA_ERROR", extra={"request_id": request_id, "error": str(e)}
                )

    from .error_handlers import register_after_request_headers, register_error_handlers

    register_after_request_headers(app)
    register_error_handlers(app)

    # Favicon route left here for completeness; top_level_static above also handles it.
    @app.route("/favicon.ico")
    def favicon():
        favicon_path = os.path.join(static_dir, "favicon.ico")
        if os.path.exists(favicon_path):
            out = make_response(send_from_directory(static_dir, "favicon.ico"))
            out.headers["Cache-Control"] = _CACHE_DIST_UNHASHED
            return out
        return ("", 204)

    # --- SPA catch-all route (MUST be registered last) ---
    @app.route("/", defaults={"path": ""}, methods=["GET", "HEAD"])
    @app.route("/<path:path>", methods=["GET", "HEAD"])
    def catch_all(path):
        # Do NOT hijack API or explicit Flask static handler
        if path.startswith(("api/", "static/")) or path in (
            "healthz",
            "livez",
            "readyz",
            "favicon.ico",
        ):
            return jsonify({"error": "Not Found"}), 404

        # Serve real files under dist (robots.txt, manifest.json, assets/*, etc.)
        try:
            requested_file = os.path.join(static_dir, path)
            if os.path.commonpath([static_dir, requested_file]) == static_dir and os.path.isfile(
                requested_file
            ):
                out = make_response(send_from_directory(static_dir, path))
                base = os.path.basename(path) or path
                out.headers["Cache-Control"] = (
                    _CACHE_SPA_INDEX if base == "index.html" else _CACHE_DIST_UNHASHED
                )
                return out
        except (ValueError, OSError) as exc:
            app.logger.warning(
                "SPA catch_all static path resolution failed: %s",
                exc,
                exc_info=True,
            )

        # SPA routing: return index.html for client-side routes (e.g., /login, /dashboard)
        out = make_response(send_from_directory(static_dir, "index.html"))
        out.headers["Cache-Control"] = _CACHE_SPA_INDEX
        return out

    _log_boot_phase("app_factory_complete")
    return app
